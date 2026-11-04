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

    /// <summary>Org part of <see cref="GithubRepo"/> — feeds /github/org-members.</summary>
    private static readonly string GithubOrg = GithubRepo.Split('/')[0];

    /// <summary>GitHub list cache TTL: anonymous api.github.com allows only
    /// 60 req/h per IP — a shared server-side window keeps window reopens and
    /// multiple visitors off the rate limit; expired entries are still served
    /// when upstream errors (stale beats a broken 系统信息 section).</summary>
    private static readonly TimeSpan GithubListTtl = TimeSpan.FromMinutes(10);

    private static readonly GithubListCache<GithubContributorResponse> ContributorsCache = new(GithubListTtl);
    private static readonly GithubListCache<GithubMemberResponse> OrgMembersCache = new(GithubListTtl);

    /// <summary>Guest-entry verification codes (Termity, not-logged-in gate).</summary>
    private static readonly GuestCodeBook GuestCodes = new();

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

        // ── GitHub lists (系统信息 window) ────────────────────────────────
        // Same proxy rationale as above, plus a shared10-min cache: anonymous
        // GitHub allows 60 req/h per IP and these sections re-open often.

        group.MapGet("/github/contributors", () =>
            GetGithubList(
                $"https://api.github.com/repos/{GithubRepo}/contributors?per_page=100",
                ParseContributor,
                ContributorsCache));

        group.MapGet("/github/org-members", () =>
            GetGithubList(
                $"https://api.github.com/orgs/{GithubOrg}/members?per_page=100",
                ParseMember,
                OrgMembersCache));

        // ── Termity guest entry (not-logged-in gate) ──────────────────────
        // Replaces the old frontend-hardcoded password: the 8-char code is
        // minted server-side, printed to runtime logs here, shown by the
        // frontend in the browser devtools console, then verified back here
        // (single-use, TTL-bound, attempt-capped).

        group.MapPost("/termity/guest-code", () =>
        {
            var code = GuestCodes.Issue(DateTimeOffset.UtcNow);
            app.Logger.LogInformation(
                "[Termity] guest verification code issued: {Code} (8 chars 0-9A-Z, ttl {TtlMinutes}m)",
                code,
                (int)GuestCodeBook.Ttl.TotalMinutes);
            return ApiResults.Ok(new ShellGuestCodeResponse(code, (int)GuestCodeBook.Ttl.TotalSeconds));
        });

        group.MapPost("/termity/guest-verify", (ShellGuestVerifyRequest? req) =>
        {
            if (req is null)
                return ApiResults.Fail(StatusCodes.Status400BadRequest, "INVALID_REQUEST", "Invalid request body");

            var result = GuestCodes.Verify(req.Code, DateTimeOffset.UtcNow);
            switch (result)
            {
                case GuestCodeBook.VerifyResult.Valid:
                    app.Logger.LogInformation("[Termity] guest verification succeeded");
                    return ApiResults.Ok(new { valid = true });

                case GuestCodeBook.VerifyResult.Mismatch:
                    app.Logger.LogWarning(
                        "[Termity] guest verification failed: mismatch (attempt {Attempt}/{MaxAttempts})",
                        GuestCodes.Attempts,
                        GuestCodeBook.MaxAttempts);
                    return ApiResults.Fail(StatusCodes.Status401Unauthorized, "GUEST_CODE_MISMATCH", "Verification code is incorrect");

                case GuestCodeBook.VerifyResult.Exhausted:
                    app.Logger.LogWarning(
                        "[Termity] guest code invalidated after {MaxAttempts} failed attempts",
                        GuestCodeBook.MaxAttempts);
                    return ApiResults.Fail(StatusCodes.Status410Gone, "GUEST_CODE_EXPIRED", "Verification code expired; request a new one");

                default: // Expired
                    app.Logger.LogInformation("[Termity] guest verification attempted with an expired code");
                    return ApiResults.Fail(StatusCodes.Status410Gone, "GUEST_CODE_EXPIRED", "Verification code expired; request a new one");
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

    /// <summary>Fetch a GitHub JSON array through the shared TTL cache.
    /// Fresh cache short-circuits upstream; upstream errors fall back to the
    /// last good snapshot (stale-on-error) before surfacing a gateway failure.</summary>
    private static async Task<IResult> GetGithubList<T>(
        string url,
        Func<JsonElement, T> mapItem,
        GithubListCache<T> cache)
    {
        if (cache.Fresh is { } fresh) return ApiResults.Ok(fresh);

        try
        {
            using var doc = await GetGithubJson(url);
            T[] items = doc.RootElement.ValueKind == JsonValueKind.Array
                ? [.. doc.RootElement.EnumerateArray().Select(mapItem)]
                : [];
            cache.Set(items);
            return ApiResults.Ok(items);
        }
        catch (HttpRequestException ex)
        {
            if (cache.Stale is { } stale) return ApiResults.Ok(stale);
            return ApiResults.Fail(StatusCodes.Status502BadGateway, "GITHUB_UPSTREAM_ERROR", ex.Message);
        }
        catch (TaskCanceledException)
        {
            if (cache.Stale is { } stale) return ApiResults.Ok(stale);
            return ApiResults.Fail(StatusCodes.Status504GatewayTimeout, "GITHUB_UPSTREAM_TIMEOUT", "GitHub request timed out");
        }
    }

    private static GithubContributorResponse ParseContributor(JsonElement el)
    {
        static string Str(JsonElement e, string n) =>
            e.TryGetProperty(n, out var v) ? v.GetString() ?? string.Empty : string.Empty;
        return new GithubContributorResponse(
            Str(el, "login"),
            Str(el, "avatar_url"),
            Str(el, "html_url"),
            el.TryGetProperty("contributions", out var c) && c.TryGetInt32(out var n) ? n : 0);
    }

    private static GithubMemberResponse ParseMember(JsonElement el)
    {
        static string Str(JsonElement e, string n) =>
            e.TryGetProperty(n, out var v) ? v.GetString() ?? string.Empty : string.Empty;
        return new GithubMemberResponse(Str(el, "login"), Str(el, "avatar_url"), Str(el, "html_url"));
    }

    /// <summary>Thread-safe TTL slot backing <see cref="GetGithubList{T}"/>.</summary>
    private sealed class GithubListCache<T>(TimeSpan ttl)
    {
        private readonly object _lock = new();
        private (DateTimeOffset At, T[] Items)? _entry;

        /// <summary>Snapshot within TTL, otherwise null (triggers upstream fetch).</summary>
        public T[]? Fresh
        {
            get { lock (_lock) return _entry is { } e && DateTimeOffset.UtcNow - e.At < ttl ? e.Items : null; }
        }

        /// <summary>Last good snapshot regardless of age (stale-on-error fallback).</summary>
        public T[]? Stale
        {
            get { lock (_lock) return _entry?.Items; }
        }

        public void Set(T[] items)
        {
            lock (_lock) _entry = (DateTimeOffset.UtcNow, items);
        }
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
