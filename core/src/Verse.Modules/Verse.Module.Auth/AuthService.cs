using Microsoft.EntityFrameworkCore;
using Verse.Data;
using Verse.Shared;
using UserEntity = Verse.Data.Entities.User;

namespace Verse.Module.Auth;

/// <summary>
/// Username/password authentication for the .NET API. Mirrors the Go auth
/// service contract: 30-minute access token, rotating 30-day refresh token,
/// shared JWT signing key, and the same error codes/envelope.
///
/// Email-challenge flows are intentionally 501: mail delivery has not been
/// ported to .NET yet. Deliberately does not rewrite Go bcrypt hashes into
/// PBKDF2 on login, because the Go engine must keep verifying them during the
/// migration window.
/// </summary>
public sealed class AuthService(
    VerseDbContext db,
    IRefreshTokenStore tokens,
    JwtTokenIssuer issuer,
    ILogger<AuthService> logger) : IAuthService
{
    private const string DefaultGroupId = "default";
    private const int UsernameMinLength = 3;
    private const int UsernameMaxLength = 64;
    private const int PasswordMinLength = 8;
    private const int PubIdAttempts = 12;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var username = request.Username?.Trim() ?? string.Empty;
        var password = request.Password ?? string.Empty;
        ValidateCredentials(username, password);

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ModuleException(StatusCodes.Status409Conflict, AuthErrors.RegistrationFailed,
                "email verification required; use RegisterWithEmail");
        }

        if (await db.Users.AnyAsync(u => u.Username == username, ct))
        {
            throw new ModuleException(StatusCodes.Status409Conflict, AuthErrors.RegistrationFailed,
                "username already taken");
        }

        var user = new UserEntity
        {
            Id = Guid.NewGuid().ToString("N"),
            PubId = await GeneratePubIdAsync(ct),
            Username = username,
            PasswdHash = PasswordHasher.Hash(password),
            UserGroupId = DefaultGroupId,
            CreatedAt = DateTime.UtcNow,
        };

        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Unique-index race between two concurrent registrations.
            throw new ModuleException(StatusCodes.Status409Conflict, AuthErrors.RegistrationFailed,
                "account could not be created");
        }

        logger.LogInformation("[auth] registered user {Username} ({PubId})", username, user.PubId);
        return IssueAuth(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var identifier = request.Identifier?.Trim() ?? string.Empty;
        var password = request.Password ?? string.Empty;
        if (identifier.Length == 0 || password.Length == 0)
        {
            throw InvalidCredentials();
        }

        var email = identifier.ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.PubId == identifier, ct)
            ?? await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct)
            ?? await db.Users.FirstOrDefaultAsync(u => u.Username == identifier, ct);

        // Same error for unknown account and wrong password: no account enumeration.
        if (user is null || !PasswordHasher.Verify(password, user.PasswdHash))
        {
            throw InvalidCredentials();
        }

        logger.LogInformation("[auth] login succeeded for {UserId}", user.Id);
        return IssueAuth(user);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        if (!tokens.TryGet(refreshToken, out var userId))
        {
            throw new ModuleException(StatusCodes.Status401Unauthorized, AuthErrors.InvalidRefreshToken,
                "invalid or expired refresh token");
        }

        // Rotate: consume the presented token before issuing the next pair.
        tokens.Revoke(refreshToken);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new ModuleException(StatusCodes.Status404NotFound, AuthErrors.UserNotFound, "user not found");

        return IssueAuth(user);
    }

    public Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        tokens.Revoke(refreshToken);
        return Task.CompletedTask;
    }

    public Task LogoutAllAsync(string userId, CancellationToken ct = default)
    {
        tokens.RevokeAll(userId);
        return Task.CompletedTask;
    }

    public async Task<UserResponse> MeAsync(string userId, CancellationToken ct = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new ModuleException(StatusCodes.Status404NotFound, AuthErrors.UserNotFound, "user not found");

        return ToUserResponse(user);
    }

    public Task<RegisterSendCodeResponse> RegisterWithEmailAsync(RegisterWithEmailRequest request, CancellationToken ct = default) =>
        throw EmailAuthNotImplemented.Error();

    public Task<AuthResponse> VerifyRegisterEmailAsync(VerifyEmailRequest request, CancellationToken ct = default) =>
        throw EmailAuthNotImplemented.Error();

    public Task<AuthResponse> VerifyLoginEmailAsync(VerifyEmailRequest request, string deviceFingerprint, string deviceName, CancellationToken ct = default) =>
        throw EmailAuthNotImplemented.Error();

    public Task<RegisterSendCodeResponse> SendLoginVerificationEmailAsync(string userId, string deviceFingerprint, string deviceName, CancellationToken ct = default) =>
        throw EmailAuthNotImplemented.Error();

    private AuthResponse IssueAuth(UserEntity user)
    {
        var refreshToken = JwtTokenIssuer.GenerateRefreshToken();
        tokens.Store(refreshToken, user.Id, JwtTokenIssuer.RefreshTokenLifetime);

        return new AuthResponse(issuer.IssueAccessToken(user), refreshToken, ToUserResponse(user));
    }

    private async Task<string> GeneratePubIdAsync(CancellationToken ct)
    {
        for (var i = 0; i < PubIdAttempts; i++)
        {
            var candidate = PubIdGenerator.GenerateUserPubId();
            if (!await db.Users.AnyAsync(u => u.PubId == candidate, ct))
            {
                return candidate;
            }
        }

        throw new InvalidOperationException("could not allocate a unique pubid");
    }

    private static void ValidateCredentials(string username, string password)
    {
        if (username.Length is < UsernameMinLength or > UsernameMaxLength)
        {
            throw new ModuleException(StatusCodes.Status400BadRequest, AuthErrors.InvalidRequest,
                $"username must be {UsernameMinLength}-{UsernameMaxLength} characters");
        }

        if (password.Length < PasswordMinLength)
        {
            throw new ModuleException(StatusCodes.Status400BadRequest, AuthErrors.InvalidRequest,
                $"password must be at least {PasswordMinLength} characters");
        }
    }

    private static ModuleException InvalidCredentials() =>
        new(StatusCodes.Status401Unauthorized, AuthErrors.LoginFailed, AuthErrors.InvalidCredentials);

    private static UserResponse ToUserResponse(UserEntity user) =>
        new(user.Id, user.PubId, user.Username, user.Name, user.AvatarUrl);
}
