using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaConnectApi.Data;
using SaConnectApi.Models;

namespace SaConnectApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentsController : ControllerBase
{
    private static readonly string[] DateFormats =
    {
        "dd MMM yyyy",
        "d MMM yyyy",
        "dd/MM/yyyy",
        "d/M/yyyy",
        "yyyy-MM-dd"
    };

    private readonly AppDbContext _dbContext;

    public IncidentsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Returns all incidents ordered by most recent date/time.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CfsIncident>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CfsIncident>>> GetIncidents(CancellationToken cancellationToken)
    {
        var incidents = await _dbContext.CfsIncidents
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var ordered = incidents
            .OrderByDescending(i => ParseIncidentDateTime(i))
            .ThenByDescending(i => i.Id)
            .ToList();

        return Ok(ordered);
    }

    /// <summary>
    /// Returns a single incident by database identifier.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(CfsIncident), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CfsIncident>> GetIncidentById(int id, CancellationToken cancellationToken)
    {
        var incident = await _dbContext.CfsIncidents
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (incident is null)
        {
            return NotFound();
        }

        return Ok(incident);
    }

    private static DateTime ParseIncidentDateTime(CfsIncident incident)
    {
        if (string.IsNullOrWhiteSpace(incident.Date))
        {
            return DateTime.MinValue;
        }

        var parsedDate = DateTime.TryParseExact(
            incident.Date,
            DateFormats,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeLocal,
            out var dateValue);

        if (!parsedDate)
        {
            if (!DateTime.TryParse(incident.Date, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out dateValue))
            {
                return DateTime.MinValue;
            }
        }

        if (TimeSpan.TryParse(incident.Time, CultureInfo.InvariantCulture, out var timeValue))
        {
            return dateValue.Date + timeValue;
        }

        return dateValue.Date;
    }
}
