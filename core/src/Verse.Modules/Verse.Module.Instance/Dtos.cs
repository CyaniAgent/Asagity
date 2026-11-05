using System.Text.Json.Serialization;
using Verse.Data.Entities;

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

/// <summary>
/// The seeded administrator/developer account. The password is never exposed.
/// </summary>
public sealed record DeveloperAccountResponse
{
    [JsonPropertyName("exists")] public bool Exists { get; set; }
    [JsonPropertyName("username")] public string Username { get; set; } = string.Empty;
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("group")] public string Group { get; set; } = string.Empty;
    [JsonPropertyName("group_id")] public string GroupId { get; set; } = string.Empty;
    [JsonPropertyName("pub_id")] public string PubId { get; set; } = string.Empty;
    [JsonPropertyName("mode")] public string Mode { get; set; } = string.Empty;
    [JsonPropertyName("seeded_by")] public string SeededBy { get; set; } = string.Empty;
}
