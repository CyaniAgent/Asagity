using Verse.Shared;

namespace Verse.Api.Middlewares;

/// <summary>
/// Enforces the scope requirements declared on endpoints
/// (Verse.Shared.ScopeRequirement / AdministratorRequirement).
///
/// 401 UNAUTHORIZED when the caller is anonymous, 403 PERMISSION_DENIED with
/// the missing scope named — the same contract the Go engine uses.
/// </summary>
public sealed class ScopeGuardMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext http)
    {
        var endpoint = http.GetEndpoint();
        if (endpoint is null)
        {
            await next(http);
            return;
        }

        var user = CurrentUser.From(http);

        var adminRequirement = endpoint.Metadata.GetMetadata<AdministratorRequirement>();
        if (adminRequirement is not null)
        {
            if (!user.Authenticated)
            {
                await ApiResults.Fail(StatusCodes.Status401Unauthorized, "UNAUTHORIZED", "User not authenticated")
                    .ExecuteAsync(http);
                return;
            }

            if (!user.IsAdmin)
            {
                await ApiResults.Fail(StatusCodes.Status403Forbidden, "PERMISSION_DENIED", "Administrator privileges required")
                    .ExecuteAsync(http);
                return;
            }
        }

        var scopeRequirement = endpoint.Metadata.GetMetadata<ScopeRequirement>();
        if (scopeRequirement is not null)
        {
            if (!user.Authenticated)
            {
                await ApiResults.Fail(StatusCodes.Status401Unauthorized, "UNAUTHORIZED", "User not authenticated")
                    .ExecuteAsync(http);
                return;
            }

            if (!user.HasScope(scopeRequirement.Scope))
            {
                await ApiResults.Fail(StatusCodes.Status403Forbidden, "PERMISSION_DENIED",
                        $"Missing required scope: {scopeRequirement.Scope}")
                    .ExecuteAsync(http);
                return;
            }
        }

        await next(http);
    }
}
