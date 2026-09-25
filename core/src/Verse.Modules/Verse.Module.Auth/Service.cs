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
}

/// <summary>Contract ported from Go <c>auth/service.Service</c> (30-min access / 30-day refresh).</summary>
public interface IAuthService
{
    AuthResponse Register(RegisterRequest request);
    RegisterSendCodeResponse RegisterWithEmail(RegisterWithEmailRequest request);
    AuthResponse VerifyRegisterEmail(VerifyEmailRequest request);
    AuthResponse Login(LoginRequest request);
    AuthResponse VerifyLoginEmail(VerifyEmailRequest request, string deviceFingerprint, string deviceName);
    AuthResponse Refresh(string refreshToken);
    void Logout(string refreshToken);
    void LogoutAll(string userId);
    UserResponse Me(string userId);
    RegisterSendCodeResponse SendLoginVerificationEmail(string userId, string deviceFingerprint, string deviceName);
}

/// <summary>DI stub: every call returns 501 until the real service lands.</summary>
public sealed class NotImplementedAuthService : IAuthService
{
    private static ModuleException Todo() =>
        new(StatusCodes.Status501NotImplemented, "AUTH_NOT_IMPLEMENTED", "Auth service is not implemented yet.");

    public AuthResponse Register(RegisterRequest request) => throw Todo();
    public RegisterSendCodeResponse RegisterWithEmail(RegisterWithEmailRequest request) => throw Todo();
    public AuthResponse VerifyRegisterEmail(VerifyEmailRequest request) => throw Todo();
    public AuthResponse Login(LoginRequest request) => throw Todo();
    public AuthResponse VerifyLoginEmail(VerifyEmailRequest request, string deviceFingerprint, string deviceName) => throw Todo();
    public AuthResponse Refresh(string refreshToken) => throw Todo();
    public void Logout(string refreshToken) => throw Todo();
    public void LogoutAll(string userId) => throw Todo();
    public UserResponse Me(string userId) => throw Todo();
    public RegisterSendCodeResponse SendLoginVerificationEmail(string userId, string deviceFingerprint, string deviceName) => throw Todo();
}
