using Verse.Shared;

namespace Verse.Module.Auth;

/// <summary>Error codes ported from Go <c>auth/dto</c> constants and <c>auth/handler</c>.</summary>
public static class AuthErrors
{
    public const string InvalidCredentials = "ERR 14101";
    public const string InvalidRefreshToken = "ERR 14102";
    public const string InvalidRequest = "INVALID_REQUEST";
    public const string RegistrationFailed = "REGISTRATION_FAILED";
    public const string LoginFailed = "LOGIN_FAILED";
    public const string RefreshFailed = "REFRESH_FAILED";
    public const string LogoutFailed = "LOGOUT_FAILED";
    public const string LogoutAllFailed = "LOGOUT_ALL_FAILED";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string UserNotFound = "USER_NOT_FOUND";
    public const string VerificationFailed = "VERIFICATION_FAILED";
    public const string EmailAuthNotImplemented = "EMAIL_AUTH_NOT_IMPLEMENTED";
}

/// <summary>
/// Contract ported from Go <c>auth/service.Service</c>. Username/password
/// flows are live on .NET (30-min access / 30-day refresh); the email-challenge
/// flows remain explicit 501s until mail delivery is ported in S5b.
/// </summary>
public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<RegisterSendCodeResponse> RegisterWithEmailAsync(RegisterWithEmailRequest request, CancellationToken ct = default);
    Task<AuthResponse> VerifyRegisterEmailAsync(VerifyEmailRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResponse> VerifyLoginEmailAsync(VerifyEmailRequest request, string deviceFingerprint, string deviceName, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAllAsync(string userId, CancellationToken ct = default);
    Task<UserResponse> MeAsync(string userId, CancellationToken ct = default);
    Task<RegisterSendCodeResponse> SendLoginVerificationEmailAsync(string userId, string deviceFingerprint, string deviceName, CancellationToken ct = default);
}

/// <summary>Common failure for the email-challenge flows (no mail service on .NET yet).</summary>
public static class EmailAuthNotImplemented
{
    public static ModuleException Error() => new(
        StatusCodes.Status501NotImplemented,
        AuthErrors.EmailAuthNotImplemented,
        "Email verification is not implemented on the .NET API yet; use the Go engine /api/*");
}
