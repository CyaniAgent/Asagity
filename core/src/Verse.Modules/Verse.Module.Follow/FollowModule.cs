using Verse.Shared;

namespace Verse.Module.Follow;

/// <summary>Route registration ported from Go <c>follow/module.go</c>.</summary>
public static class FollowModule
{
    public static void AddServices(IServiceCollection services) =>
        services.AddSingleton<IFollowService, NotImplementedFollowService>();

    public static void Register(WebApplication app)
    {
        app.MapPost("/api/users/{id}/follow", (string id, IFollowService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                try { return ApiResults.Ok(svc.FollowUser(user.UserId, id)); }
                catch (ModuleException ex) when (ex.Code is FollowErrors.CannotFollowSelf or FollowErrors.AlreadyFollowing)
                {
                    return ApiResults.Fail(400, ex.Code, ex.Message);
                }
            }, FollowErrors.FollowFailed));

        app.MapDelete("/api/users/{id}/follow", (string id, IFollowService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                svc.UnfollowUser(user.UserId, id);
                return ApiResults.Ok(new { status = "ok" });
            }, FollowErrors.UnfollowFailed));

        app.MapGet("/api/users/{id}/followers", (string id, string? cursor, int? limit, IFollowService svc, HttpContext http) =>
            Guard(() =>
            {
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, FollowErrors.InvalidId, "User ID required");
                var current = CurrentUser.From(http)?.UserId ?? string.Empty;
                var (users, next) = svc.GetFollowers(id, current, cursor ?? string.Empty, limit is > 0 ? limit.Value : 20);
                return ApiResults.Ok(new { users, next_cursor = next });
            }, FollowErrors.FetchFailed));

        app.MapGet("/api/users/{id}/following", (string id, string? cursor, int? limit, IFollowService svc, HttpContext http) =>
            Guard(() =>
            {
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, FollowErrors.InvalidId, "User ID required");
                var current = CurrentUser.From(http)?.UserId ?? string.Empty;
                var (users, next) = svc.GetFollowing(id, current, cursor ?? string.Empty, limit is > 0 ? limit.Value : 20);
                return ApiResults.Ok(new { users, next_cursor = next });
            }, FollowErrors.FetchFailed));

        app.MapGet("/api/users/{id}/follow-count", (string id, IFollowService svc) =>
            Guard(() =>
            {
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, FollowErrors.InvalidId, "User ID required");
                return ApiResults.Ok(svc.GetFollowCount(id));
            }, FollowErrors.FetchFailed));

        app.MapGet("/api/follow/requests/pending", (IFollowService svc, HttpContext http) =>
            Guard(() => ApiResults.Ok(svc.GetPendingRequests(RequireUser(http).UserId)), FollowErrors.FetchFailed));

        app.MapPost("/api/follow/requests/{id}/accept", (string id, IFollowService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, FollowErrors.InvalidId, "Follow ID required");
                try
                {
                    svc.AcceptFollowRequest(user.UserId, id);
                }
                catch (ModuleException ex) when (ex.Code == FollowErrors.FollowRequestNotFound)
                {
                    return ApiResults.Fail(404, ex.Code, ex.Message);
                }
                return ApiResults.Ok(new { status = "ok" });
            }, FollowErrors.AcceptFailed));

        app.MapPost("/api/follow/requests/{id}/reject", (string id, IFollowService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, FollowErrors.InvalidId, "Follow ID required");
                try
                {
                    svc.RejectFollowRequest(user.UserId, id);
                }
                catch (ModuleException ex) when (ex.Code == FollowErrors.FollowRequestNotFound)
                {
                    return ApiResults.Fail(404, ex.Code, ex.Message);
                }
                return ApiResults.Ok(new { status = "ok" });
            }, FollowErrors.RejectFailed));
    }

    private static CurrentUser RequireUser(HttpContext http) =>
        CurrentUser.From(http)
        ?? throw new ModuleException(401, FollowErrors.Unauthorized, "User not authenticated");

    private static IResult Guard(Func<IResult> call, string fallbackCode)
    {
        try
        {
            return call();
        }
        catch (ModuleException ex)
        {
            return ApiResults.From(ex);
        }
        catch (Exception ex)
        {
            return ApiResults.Fail(500, fallbackCode, ex.Message);
        }
    }
}
