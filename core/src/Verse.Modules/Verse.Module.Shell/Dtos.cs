using System.Text.Json.Serialization;

namespace Verse.Module.Shell;

/// <summary>Shell ping/meta responses for Termity platform-shell use.</summary>
public sealed record ShellPingResponse(
    [property: JsonPropertyName("backend")] string Backend,
    [property: JsonPropertyName("pong")] bool Pong,
    [property: JsonPropertyName("time")] string Time,
    [property: JsonPropertyName("version")] string Version);

public sealed record ShellMetaResponse(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("backend")] string Backend,
    [property: JsonPropertyName("version")] string Version,
    [property: JsonPropertyName("time")] string Time);

public sealed record GithubCommitResponse(
    [property: JsonPropertyName("sha")] string Sha,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("author")] string Author,
    [property: JsonPropertyName("date")] string Date);

public sealed record GithubReleaseResponse(
    [property: JsonPropertyName("tag_name")] string TagName,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("body")] string Body,
    [property: JsonPropertyName("published_at")] string PublishedAt);

/// <summary>Termity guest-entry verification code issue response.</summary>
public sealed record ShellGuestCodeResponse(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("expiresInSeconds")] int ExpiresInSeconds);

/// <summary>Termity guest-entry verification attempt.</summary>
public sealed record ShellGuestVerifyRequest(
    [property: JsonPropertyName("code")] string? Code);
