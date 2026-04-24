using System.ComponentModel.DataAnnotations;

namespace SaConnectApi.Models;

public class CfsIncident
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string IncidentNo { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Date { get; set; }

    [MaxLength(20)]
    public string? Time { get; set; }

    public string? Message { get; set; }
    public string? MessageLink { get; set; }
    public string? LocationName { get; set; }
    public string? Region { get; set; }
    public string? Type { get; set; }
    public string? Status { get; set; }
    public string? Level { get; set; }
    public string? Fbd { get; set; }
    public string? Resources { get; set; }
    public string? Aircraft { get; set; }

    // Raw format from CFS feed: "-35.x,138.x"
    public string? LocationRaw { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
