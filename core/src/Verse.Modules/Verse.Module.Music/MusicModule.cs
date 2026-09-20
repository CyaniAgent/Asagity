using System.Text.Json.Serialization;
using Verse.Shared;

namespace Verse.Module.Music;

/// <summary>Audio fidelity labels, ported from the frontend quality-tag rules.</summary>
public sealed record QualityTag(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("color")] string Color,
    [property: JsonPropertyName("rule")] string Rule);

/// <summary>
/// AAP extension sample: a tiny self-contained module showing how a
/// third-party App surface can look once promoted into the core tree.
/// </summary>
public static class MusicModule
{
    private static readonly IReadOnlyList<QualityTag> Tags =
    [
        new("Lossless", "cyan", "FLAC/WAV/ALAC/AIFF/Monkey's Audio"),
        new("Hi-Res", "amber", "Bitrate > 320kbps or sample rate > 48kHz"),
        new("HQ", "green", "Bitrate > 128kbps"),
        new("Standard", "gray", "Bitrate <= 128kbps"),
    ];

    public static void AddServices(IServiceCollection services) { }

    public static void Register(WebApplication app) =>
        app.MapGet("/api/music/quality-tags", () => ApiResults.Ok(Tags));
}
