using Verse.Shared;

namespace Verse.Module.Auth;

/// <summary>Route registration ported from Go <c>auth/module.go</c> (cookie flows included).</summary>
public static class AuthModule
{
    private const string RefreshCookie = "refresh_token";
    private static readonly CookieOptions RefreshCookieOptions = new()
    {
        Path = "/",
        MaxAge = JwtTokenIssuer.RefreshTokenLifetime,
        Secure = true,
        HttpOnly = true,
        SameSite = SameSiteMode.Strict,
    };

    public static void AddServices(IServiceCollection services)
    {
        // Single-replica by default; swap IRefreshTokenStore for a distributed
        // implementation when running more than one API instance.
        services.AddSingleton<IRefreshTokenStore, InMemoryRefreshTokenStore>();
        services.AddSingleton<JwtTokenIssuer>();
        services.AddScoped<IAuthService, AuthService>();
    }

    public static void Register(WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (RegisterRequest? req, IAuthService svc, HttpContext http, CancellationToken ct) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = await svc.RegisterAsync(req, ct);
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Created(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(409, AuthErrors.RegistrationFailed, ex.Message); }
        });

        group.MapPost("/register/with-email", async (RegisterWithEmailRequest? req, IAuthService svc, CancellationToken ct) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try { return ApiResults.Ok(await svc.RegisterWithEmailAsync(req, ct)); }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(400, AuthErrors.RegistrationFailed, ex.Message); }
        });

        group.MapPost("/register/verify-email", async (VerifyEmailRequest? req, IAuthService svc, HttpContext http, CancellationToken ct) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = await svc.VerifyRegisterEmailAsync(req, ct);
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Ok(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(400, AuthErrors.VerificationFailed, ex.Message); }
        });

        group.MapPost("/login", async (LoginRequest? req, IAuthService svc, HttpContext http, CancellationToken ct) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = await svc.LoginAsync(req, ct);
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Ok(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(401, AuthErrors.LoginFailed, ex.Message); }
        });

        group.MapPost("/login/verify-email", async (VerifyEmailRequest? req, IAuthService svc, HttpContext http, CancellationToken ct) =>
        {
            if (req is null)
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = await svc.VerifyLoginEmailAsync(req,
                    http.Request.Headers["X-Device-Fingerprint"].ToString(),
                    http.Request.Headers["X-Device-Name"].ToString(), ct);
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Ok(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(400, AuthErrors.VerificationFailed, ex.Message); }
        });

        group.MapPost("/refresh", async (RefreshRequest? body, IAuthService svc, HttpContext http, CancellationToken ct) =>
        {
            // Cookie is preferred, JSON body is the fallback (mirrors Go handler).
            var token = http.Request.Cookies[RefreshCookie] ?? body?.RefreshToken;
            if (string.IsNullOrEmpty(token))
                return Fail(400, AuthErrors.InvalidRequest, "Invalid request body");
            try
            {
                var res = await svc.RefreshAsync(token, ct);
                SetRefreshCookie(http, res.RefreshToken);
                return ApiResults.Ok(res);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(401, AuthErrors.RefreshFailed, ex.Message); }
        });

        group.MapPost("/logout", async (IAuthService svc, HttpContext http, CancellationToken ct) =>
        {
            if (CurrentUser.From(http) is null)
                return Fail(401, AuthErrors.Unauthorized, "User not authenticated");
            var token = http.Request.Cookies[RefreshCookie];
            try
            {
                if (!string.IsNullOrEmpty(token))
                    await svc.LogoutAsync(token, ct);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(500, AuthErrors.LogoutFailed, ex.Message); }
            http.Response.Cookies.Delete(RefreshCookie);
            return ApiResults.Ok(new StatusResponse("ok"));
        });

        group.MapPost("/logout-all", async (IAuthService svc, HttpContext http, CancellationToken ct) =>
        {
            var user = CurrentUser.From(http);
            if (user is null)
                return Fail(401, AuthErrors.Unauthorized, "User not authenticated");
            try
            {
                await svc.LogoutAllAsync(user.UserId, ct);
            }
            catch (ModuleException ex) { return ApiResults.From(ex); }
            catch (Exception ex) { return Fail(500, AuthErrors.LogoutAllFailed, ex.Message); }
            http.Response.Cookies.Delete(RefreshCookie);
            return ApiResults.Ok(new StatusResponse("ok"));
        });

        group.MapGet("/me", async (IAuthService svc, HttpContext http, CancellationToken ct) =>
        {
            var user = CurrentUser.From(http);
            if (user is null)
                return Fail(401, AuthErrors.Unauthorized, "User not authenticated");
            try
            {
                return ApiResults.Ok(await svc.MeAsync(user.UserId, ct));
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
