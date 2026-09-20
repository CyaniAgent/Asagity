using Verse.Shared;

namespace Verse.Module.Auth;

/// <summary>Route registration ported from Go <c>auth/module.go</c> (cookie flows included).</summary>
public static class AuthModule
{
    private const string RefreshCookie = "refresh_token";
    private static readonly CookieOptions RefreshCookieOptions = new()
    {
        Path = "/",
        MaxAge = TimeSpan.FromDays(30),
        Secure = true,
        HttpOnly = true,
        SameSite = SameSiteMode.Strict,
    };

    public static void AddServices(IServiceCollection services) =>
        services.AddSingleton<IAuthService, NotImplementedAuthService>();

    public static void Register(WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", (RegisterRequest? req, IAuthService svc, HttpContext http) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = svc.Register(req);
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Created(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(409, AuthErrors.RegistrationFailed, ex.Message); }
        });

        group.MapPost("/register/with-email", (RegisterWithEmailRequest? req, IAuthService svc) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try { return ApiResults.Ok(svc.RegisterWithEmail(req)); }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(400, AuthErrors.RegistrationFailed, ex.Message); }
        });

        group.MapPost("/register/verify-email", (VerifyEmailRequest? req, IAuthService svc, HttpContext http) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = svc.VerifyRegisterEmail(req);
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Ok(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(400, AuthErrors.VerificationFailed, ex.Message); }
        });

        group.MapPost("/login", (LoginRequest? req, IAuthService svc, HttpContext http) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = svc.Login(req);
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Ok(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(401, AuthErrors.LoginFailed, ex.Message); }
        });

        group.MapPost("/login/verify-email", (VerifyEmailRequest? req, IAuthService svc, HttpContext http) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = svc.VerifyLoginEmail(req,
                    http.Request.Headers["X-Device-Fingerprint"].ToString(),
                    http.Request.Headers["X-Device-Name"].ToString());
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Ok(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(400, AuthErrors.VerificationFailed, ex.Message); }
        });

        group.MapPost("/refresh", (RefreshRequest? body, IAuthService svc, HttpContext http) =>
        {
            // Cookie is preferred, JSON body is the fallback (mirrors Go handler).
            var token = http.Request.Cookies[RefreshCookie] ?? body?.RefreshToken;
            if (string.IsNullOrEmpty(token))
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = svc.Refresh(token);
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Ok(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(401, AuthErrors.RefreshFailed, ex.Message); }
        });

        group.MapPost("/logout", (IAuthService svc, HttpContext http) =>
        {
            if (CurrentUser.From(http) is null)
                return Fail(401, AuthErrors.Unauthorized, "User not authenticated");
            var token = http.Request.Cookies[RefreshCookie];
            try
            {
                if (!string.IsNullOrEmpty(token))
                    svc.Logout(token);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(500, AuthErrors.LogoutFailed, ex.Message); }
            http.Response.Cookies.Delete(RefreshCookie);
            return ApiResults.Ok(new StatusResponse("ok"));
        });

        group.MapPost("/logout-all", (IAuthService svc, HttpContext http) =>
        {
            var user = CurrentUser.From(http);
            if (user is null)
                return Fail(401, AuthErrors.Unauthorized, "User not authenticated");
            try
            {
                svc.LogoutAll(user.UserId);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(500, AuthErrors.LogoutAllFailed, ex.Message); }
            http.Response.Cookies.Delete(RefreshCookie);
            return ApiResults.Ok(new StatusResponse("ok"));
        });

        group.MapGet("/me", (IAuthService svc, HttpContext http) =>
        {
            var user = CurrentUser.From(http);
            if (user is null)
                return Fail(401, AuthErrors.Unauthorized, "User not authenticated");
            try
            {
                return ApiResults.Ok(svc.Me(user.UserId));
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(404, AuthErrors.UserNotFound, ex.Message); }
        });
    }

    private static IResult Fail(int status, string code, string message) =>
        ApiResults.Fail(status, code, message);

    private static void SetRefreshCookie(HttpContext http, string token) =>
        http.Response.Cookies.Append(RefreshCookie, token, RefreshCookieOptions);
}
