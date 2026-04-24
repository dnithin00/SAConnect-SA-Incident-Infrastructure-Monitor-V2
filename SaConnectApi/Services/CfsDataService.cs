using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using SaConnectApi.Models;

namespace SaConnectApi.Services;

public interface ICfsDataService
{
    Task<IReadOnlyCollection<CfsIncident>> FetchCurrentIncidentsAsync(CancellationToken cancellationToken);
}

public class CfsDataService : ICfsDataService
{
    private const string CfsEndpoint =
        "https://data.eso.sa.gov.au/prod/cfs/criimson/cfs_current_incidents.json";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly ILogger<CfsDataService> _logger;

    public CfsDataService(HttpClient httpClient, ILogger<CfsDataService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<IReadOnlyCollection<CfsIncident>> FetchCurrentIncidentsAsync(CancellationToken cancellationToken)
    {
        using var response = await _httpClient.GetAsync(CfsEndpoint, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var payload = await JsonSerializer.DeserializeAsync<List<CfsIncidentDto>>(stream, JsonOptions, cancellationToken);

        if (payload is null || payload.Count == 0)
        {
            _logger.LogInformation("CFS feed returned no incidents.");
            return Array.Empty<CfsIncident>();
        }

        var incidents = payload
            .Where(i => !string.IsNullOrWhiteSpace(i.IncidentNo))
            .Select(MapDtoToIncident)
            .ToList();

        return incidents;
    }

    private static CfsIncident MapDtoToIncident(CfsIncidentDto dto)
    {
        var (latitude, longitude) = ParseLocation(dto.Location);

        return new CfsIncident
        {
            IncidentNo = dto.IncidentNo ?? string.Empty,
            Date = dto.Date,
            Time = dto.Time,
            Message = dto.Message,
            MessageLink = dto.MessageLink,
            LocationName = dto.LocationName,
            Region = dto.Region,
            Type = dto.Type,
            Status = dto.Status,
            Level = dto.Level,
            Fbd = dto.Fbd,
            Resources = dto.Resources,
            Aircraft = dto.Aircraft,
            LocationRaw = dto.Location,
            Latitude = latitude,
            Longitude = longitude
        };
    }

    private static (double? Latitude, double? Longitude) ParseLocation(string? location)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            return (null, null);
        }

        var parts = location.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2)
        {
            return (null, null);
        }

        var latParsed = double.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var latitude);
        var lngParsed = double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var longitude);

        if (!latParsed || !lngParsed)
        {
            return (null, null);
        }

        return (latitude, longitude);
    }

    private sealed class CfsIncidentDto
    {
        [JsonPropertyName("IncidentNo")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? IncidentNo { get; init; }

        [JsonPropertyName("Date")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Date { get; init; }

        [JsonPropertyName("Time")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Time { get; init; }

        [JsonPropertyName("Message")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Message { get; init; }

        [JsonPropertyName("Message_link")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? MessageLink { get; init; }

        [JsonPropertyName("Location_name")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? LocationName { get; init; }

        [JsonPropertyName("Region")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Region { get; init; }

        [JsonPropertyName("Type")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Type { get; init; }

        [JsonPropertyName("Status")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Status { get; init; }

        [JsonPropertyName("Level")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Level { get; init; }

        [JsonPropertyName("FBD")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Fbd { get; init; }

        [JsonPropertyName("Resources")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Resources { get; init; }

        [JsonPropertyName("Aircraft")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Aircraft { get; init; }

        [JsonPropertyName("Location")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Location { get; init; }
    }

    private sealed class FlexibleStringConverter : JsonConverter<string?>
    {
        public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.TokenType switch
            {
                JsonTokenType.String => reader.GetString(),
                JsonTokenType.Number => reader.GetDouble().ToString(CultureInfo.InvariantCulture),
                JsonTokenType.True => bool.TrueString,
                JsonTokenType.False => bool.FalseString,
                JsonTokenType.Null => null,
                _ => throw new JsonException($"Unsupported token type '{reader.TokenType}' for flexible string conversion.")
            };
        }

        public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
        {
            if (value is null)
            {
                writer.WriteNullValue();
                return;
            }

            writer.WriteStringValue(value);
        }
    }
}
