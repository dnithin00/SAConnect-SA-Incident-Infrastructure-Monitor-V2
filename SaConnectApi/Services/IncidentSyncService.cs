using Microsoft.EntityFrameworkCore;
using SaConnectApi.Data;

namespace SaConnectApi.Services;

public class IncidentSyncService : BackgroundService
{
    private static readonly TimeSpan SyncInterval = TimeSpan.FromMinutes(10);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<IncidentSyncService> _logger;

    public IncidentSyncService(IServiceScopeFactory scopeFactory, ILogger<IncidentSyncService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Incident sync service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncIncidentsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Incident sync run failed.");
            }

            await Task.Delay(SyncInterval, stoppingToken);
        }
    }

    private async Task SyncIncidentsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cfsDataService = scope.ServiceProvider.GetRequiredService<ICfsDataService>();

        var incidents = await cfsDataService.FetchCurrentIncidentsAsync(cancellationToken);
        if (incidents.Count == 0)
        {
            return;
        }

        var incomingIncidentNumbers = incidents
            .Select(i => i.IncidentNo)
            .Where(i => !string.IsNullOrWhiteSpace(i))
            .Distinct()
            .ToList();

        if (incomingIncidentNumbers.Count == 0)
        {
            return;
        }

        var existingIncidentNumbers = await dbContext.CfsIncidents
            .Where(i => incomingIncidentNumbers.Contains(i.IncidentNo))
            .Select(i => i.IncidentNo)
            .ToListAsync(cancellationToken);

        var existingLookup = existingIncidentNumbers.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var newIncidents = incidents
            .Where(i => !existingLookup.Contains(i.IncidentNo))
            .ToList();

        if (newIncidents.Count == 0)
        {
            _logger.LogInformation("Incident sync completed. No new incidents.");
            return;
        }

        await dbContext.CfsIncidents.AddRangeAsync(newIncidents, cancellationToken);
        var saved = await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Incident sync completed. Saved {SavedCount} new incidents.", saved);
    }
}
