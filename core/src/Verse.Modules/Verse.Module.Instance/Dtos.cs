using System.Text.Json.Serialization;

namespace Verse.Module.Instance;

public sealed record RootResponse(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("mode")] string Mode);

public sealed record HealthResponse(
    [property: JsonPropertyName("status")] string Status);

/// <summary>Ported from Go <c>instance/dto.VersionResponse</c>.</summary>
public sealed record VersionResponse(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("version")] string Version);

/// <summary>Ported from Go <c>instance/dto.MetaResponse</c>.</summary>
public sealed record MetaResponse(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("alias")] string Alias,
    [property: JsonPropertyName("description")] string Description);

/// <summary>Ported from Go <c>instance/dto.SystemEnvironmentResponse</c>.</summary>
public sealed record SystemEnvironmentResponse(
    [property: JsonPropertyName("hostname")] string Hostname,
    [property: JsonPropertyName("platform")] string Platform,
    [property: JsonPropertyName("os_version")] string OsVersion,
    [property: JsonPropertyName("arch")] string Arch,
    [property: JsonPropertyName("cpu")] string Cpu,
    [property: JsonPropertyName("memory")] string Memory,
    [property: JsonPropertyName("is_container")] bool IsContainer);

/// <summary>Ported from Go <c>instance/repository.DatabaseStat</c>.</summary>
public sealed record DatabaseStat(
    [property: JsonPropertyName("table")] string Table,
    [property: JsonPropertyName("size_pretty")] string SizePretty,
    [property: JsonPropertyName("size_bytes")] long SizeBytes,
    [property: JsonPropertyName("rows")] long Rows);
