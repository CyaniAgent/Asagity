using Verse.Shared;

namespace Verse.Module.User;

/// <summary>Route registration ported from Go <c>user/module.go</c>.</summary>
public static class UserModule
{
    public static void AddServices(IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserService, UserService>();
    }

    public static void Register(WebApplication app)
    {
        app.MapGet("/api/users/me", (IUserService svc, HttpContext http) =>
                Guard(async () => ApiResults.Ok(await svc.GetMeAsync(UserIdOf(http)))))
            .RequireScope(Scopes.AccountRead);

        app.MapPost("/api/users/me/pubid", (ChangePubIdRequest? req, IUserService svc, HttpContext http) =>
                Guard(async () =>
                {
                    var user = CurrentUser.From(http);
                    if (user.UserId.Length == 0)
                    {
                        return ApiResults.Fail(StatusCodes.Status401Unauthorized, UserErrors.Unauthorized, "Authentication required");
                    }

                    if (req is null)
                    {
                        return ApiResults.Fail(StatusCodes.Status400BadRequest, UserErrors.InvalidRequest, "Invalid request body");
                    }

                    if (string.IsNullOrEmpty(req.NewPubId))
                    {
                        return ApiResults.Fail(StatusCodes.Status400BadRequest, UserErrors.MissingPubId, "new_pub_id is required");
                    }

                    var result = await svc.ChangePubIdAsync(user.UserId, user.PubId, req.NewPubId);
                    return ApiResults.Ok(result);
                }))
            .RequireScope(Scopes.AccountWrite);

        app.MapGet("/api/users/me/pubid/history", (int? limit, IUserService svc, HttpContext http) =>
                Guard(async () =>
                {
                    var user = CurrentUser.From(http);
                    if (user.UserId.Length == 0)
                    {
                        return ApiResults.Fail(StatusCodes.Status401Unauthorized, UserErrors.Unauthorized, "Authentication required");
                    }

                    return ApiResults.Ok(await svc.GetPubIdChangeHistoryAsync(user.UserId, limit ?? 20));
                }))
            .RequireScope(Scopes.AccountRead);
    }

    private static string UserIdOf(HttpContext http) => CurrentUser.From(http).UserId;

    private static async Task<IResult> Guard(Func<Task<IResult>> call)
    {
        try
        {
            return await call();
        }
        catch (ModuleException ex)
        {
            return ApiResults.From(ex);
        }
        catch (Exception ex)
        {
            return ApiResults.Fail(StatusCodes.Status500InternalServerError, UserErrors.InternalError, ex.Message);
        }
    }
}
