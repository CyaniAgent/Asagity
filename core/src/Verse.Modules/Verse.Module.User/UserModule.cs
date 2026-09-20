using Verse.Shared;

namespace Verse.Module.User;

/// <summary>Route registration ported from Go <c>user/module.go</c>.</summary>
public static class UserModule
{
    public static void AddServices(IServiceCollection services) =>
        services.AddSingleton<IUserService, NotImplementedUserService>();

    public static void Register(WebApplication app)
    {
        // Go returns the placeholder with an explicit 501 status but an ok:true envelope.
        app.MapGet("/api/users/me", (IUserService svc) =>
        {
            try
            {
                return ApiResults.Raw(StatusCodes.Status501NotImplemented, svc.MePlaceholder());
            }
            catch (ModuleException ex)
            {
                return ApiResults.From(ex);
            }
        });

        app.MapPost("/api/users/me/pubid", (ChangePubIdRequest? req, IUserService svc, HttpContext http) =>
        {
            var user = CurrentUser.From(http);
            if (user is null)
                return ApiResults.Fail(StatusCodes.Status401Unauthorized, UserErrors.Unauthorized, "Authentication required");
            if (req is null)
                return ApiResults.Fail(StatusCodes.Status400BadRequest, UserErrors.InvalidRequest, "Invalid request body");
            if (string.IsNullOrEmpty(req.NewPubId))
                return ApiResults.Fail(StatusCodes.Status400BadRequest, UserErrors.MissingPubId, "new_pub_id is required");

            try
            {
                return ApiResults.Ok(svc.ChangePubId(user.UserId, user.PubId, req.NewPubId));
            }
            catch (ModuleException ex)
            {
                // Mirror Go handler error mapping.
                return ex.Code switch
                {
                    "INVALID_PUBID_FORMAT" => ApiResults.Fail(400, UserErrors.InvalidPubIdFormat, ex.Message),
                    "SAME_PUBID" => ApiResults.Fail(400, UserErrors.SamePubId, ex.Message),
                    "PUBID_CONFLICT" => ApiResults.Fail(409, UserErrors.PubIdConflict, ex.Message),
                    "RATE_LIMITED" => ApiResults.Fail(429, UserErrors.RateLimited, ex.Message),
                    _ => ApiResults.From(ex),
                };
            }
            catch (Exception ex)
            {
                return ApiResults.Fail(500, UserErrors.InternalError, ex.Message);
            }
        });

        app.MapGet("/api/users/me/pubid/history", (int? limit, IUserService svc, HttpContext http) =>
        {
            var user = CurrentUser.From(http);
            if (user is null)
                return ApiResults.Fail(StatusCodes.Status401Unauthorized, UserErrors.Unauthorized, "Authentication required");

            try
            {
                return ApiResults.Ok(svc.GetPubIdChangeHistory(user.UserId, limit is > 0 ? limit.Value : 20));
            }
            catch (ModuleException ex)
            {
                return ApiResults.From(ex);
            }
            catch (Exception ex)
            {
                return ApiResults.Fail(500, UserErrors.InternalError, ex.Message);
            }
        });
    }
}
