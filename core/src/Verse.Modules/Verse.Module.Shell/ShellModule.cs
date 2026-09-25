using System.Text.Json;
using Verse.Shared;

namespace Verse.Module.Shell;

/// <summary>
/// Termity platform-shell gateway (read-only, stateless).
/// Moves logic out of the frontend Termity component:
/// - ping/meta give Termity a backend-measured source of truth
///   instead of local Zustand flags.
/// - github/* proxies api.github.com server-side so browsers
///   no longer call GitHub directly (CORS / rate-limit safe).
/// </summary>
public static class ShellModule
{
    private static readonly HttpClient GithubHttp = new()
    {
        Timeout = TimeSpan.FromSeconds(8),
    };

    private const string GithubRepo = "CyaniAgent/Asagity";

    static ShellModule()
    {
        GithubHttp.DefaultRequestHeaders.UserAgent.ParseAdd("Asagity-Shell/1.0");
        GithubHttp.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github.v3+json");
    }

    public static void AddServices(IServiceCollection services)
    {
    }

    public static void Register(WebApplication app)
    {
        var group = app.MapGroup("/api/shell");

        group.MapGet("/ping", () =>
            ApiResults.Ok(new ShellPingResponse(
                Backend: "verse-api",
                Pong: true,
                Time: DateTime.UtcNow.ToString("o"),
                Version: AppVersion())));

        group.MapGet("/meta", () =>
            ApiResults.Ok(new ShellMetaResponse(
                Name: "Asagity",
                Backend: "verse-api",
                Version: AppVersion(),
                Time: DateTime.UtcNow.ToString("o"))));

        group.MapGet("/github/latest-commit", async (string? @ref) =>
        {
            var reference = string.IsNullOrWhiteSpace(@ref) ? "main" : @ref;
            try
            {
                using var doc = await GetGithubJson($"https://api.github.com/repos/{GithubRepo}/commits/{Uri.EscapeDataString(reference)}");
                var root = doc.RootElement;
                var sha = root.TryGetProperty("sha", out var shaEl) ? shaEl.GetString() ?? string.Empty : string.Empty;
                var message = string.Empty;
                var author = string.Empty;
                var date = string.Empty;
                if (root.TryGetProperty("commit", out var commitEl))
                {
                    if (commitEl.TryGetProperty("message", out var msgEl))
                        message = (msgEl.GetString() ?? string.Empty).Split('\n')[0];
                    if (commitEl.TryGetProperty("author", out var authorEl))
                    {
                        if (authorEl.TryGetProperty("name", out var nameEl))
                            author = nameEl.GetString() ?? string.Empty;
                        if (authorEl.TryGetProperty("date", out var dateEl))
                            date = dateEl.GetString() ?? string.Empty;
                    }
                    else if (commitEl.TryGetProperty("committer", out var committerEl) && committerEl.TryGetProperty("date", out var cDateEl))
                    {
                        date = cDateEl.GetString() ?? string.Empty;
                    }
                }
                return ApiResults.Ok(new GithubCommitResponse(sha, message, author, date));
            }
            catch (HttpRequestException ex)
            {
                return ApiResults.Fail(StatusCodes.Status502BadGateway, "GITHUB_UPSTREAM_ERROR", ex.Message);
            }
            catch (TaskCanceledException)
            {
                return ApiResults.Fail(StatusCodes.Status504GatewayTimeout, "GITHUB_UPSTREAM_TIMEOUT", "GitHub request timed out");
            }
        });

        group.MapGet("/github/latest-release", async () =>
        {
            try
            {
                using var doc = await GetGithubJson($"https://api.github.com/repos/{GithubRepo}/releases/latest");
                return ApiResults.Ok(ParseRelease(doc.RootElement));
            }
            catch (HttpRequestException ex)
            {
                return ApiResults.Fail(StatusCodes.Status502BadGateway, "GITHUB_UPSTREAM_ERROR", ex.Message);
            }
            catch (TaskCanceledException)
            {
                return ApiResults.Fail(StatusCodes.Status504GatewayTimeout, "GITHUB_UPSTREAM_TIMEOUT", "GitHub request timed out");
            }
        });

        group.MapGet("/github/release", async (string tag) =>
        {
            if (string.IsNullOrWhiteSpace(tag))
                return ApiResults.Fail(StatusCodes.Status400BadRequest, "INVALID_REQUEST", "Query 'tag' is required");
            try
            {
                using var doc = await GetGithubJson($"https://api.github.com/repos/{GithubRepo}/releases/tags/{Uri.EscapeDataString(tag)}");
                return ApiResults.Ok(ParseRelease(doc.RootElement));
            }
            catch (HttpRequestException ex)
            {
                return ApiResults.Fail(StatusCodes.Status502BadGateway, "GITHUB_UPSTREAM_ERROR", ex.Message);
            }
            catch (TaskCanceledException)
            {
                return ApiResults.Fail(StatusCodes.Status504GatewayTimeout, "GITHUB_UPSTREAM_TIMEOUT", "GitHub request timed out");
            }
        });
    }

    private static string AppVersion() =>
        Environment.GetEnvironmentVariable("APP_VERSION") ?? "dev";

    private static async Task<JsonDocument> GetGithubJson(string url)
    {
        using var res = await GithubHttp.GetAsync(url);
        res.EnsureSuccessStatusCode();
        var stream = await res.Content.ReadAsStreamAsync();
        return await JsonDocument.ParseAsync(stream);
    }

    private static GithubReleaseResponse ParseRelease(JsonElement root)
    {
        static string Str(JsonElement el, string name) =>
            el.TryGetProperty(name, out var v) ? v.GetString() ?? string.Empty : string.Empty;
        return new GithubReleaseResponse(
            Str(root, "tag_name"),
            Str(root, "name"),
            Str(root, "body"),
            Str(root, "published_at"));
    }
}
