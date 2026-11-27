using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Data.Sqlite;
using Microsoft.IdentityModel.Tokens;
using Verse.Data;
using Verse.Data.Entities;
using Verse.Module.Auth;
using Verse.Shared;
using Xunit;
using UserEntity = Verse.Data.Entities.User;

namespace Verse.Tests;

/// <summary>End-to-end tests for the .NET username/password auth flow.</summary>
public sealed class AuthServiceTests : IDisposable
{
    private const string Secret = "auth-tests-secret";
    private readonly SqliteConnection _keepAlive;
    private readonly VerseDbContext _db;
    private readonly IRefreshTokenStore _tokens = new InMemoryRefreshTokenStore();
    private readonly JwtTokenIssuer _issuer;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        // Shared-cache in-memory SQLite, as in databaseless mode: unique per
        // test and no temp files to clean up.
        var connectionString = $"Data Source=file:asagity-auth-{Guid.NewGuid():N}?mode=memory&cache=shared";
        _keepAlive = new SqliteConnection(connectionString);
        _keepAlive.Open();
        var options = new DbContextOptionsBuilder<VerseDbContext>()
            .UseSqlite(connectionString)
            .Options;
        _db = new VerseDbContext(options);
        _db.Database.EnsureCreated();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["JWT_SECRET"] = Secret })
            .Build();
        _issuer = new JwtTokenIssuer(config);
        _service = new AuthService(_db, _tokens, _issuer, NullLogger<AuthService>.Instance);
    }

    public void Dispose()
    {
        _db.Dispose();
        _keepAlive.Dispose();
    }

    private static RegisterRequest Register(string username = "alice", string password = "correct-horse") =>
        new(username, null, password);

    [Fact]
    public async Task RegisterCreatesUserWithHashedPasswordAndSession()
    {
        var result = await _service.RegisterAsync(Register());

        var user = await _db.Users.SingleAsync();
        Assert.Equal("alice", user.Username);
        Assert.StartsWith("usr_", user.PubId);
        Assert.Equal("default", user.UserGroupId);
        Assert.NotEqual("correct-horse", user.PasswdHash);
        Assert.True(PasswordHasher.Verify("correct-horse", user.PasswdHash));
        Assert.Equal(user.Id, result.User.Id);
        Assert.Equal(user.PubId, result.User.PubId);
        Assert.Equal(64, result.RefreshToken.Length);
        Assert.True(_tokens.TryGet(result.RefreshToken, out var userId));
        Assert.Equal(user.Id, userId);
    }

    [Fact]
    public async Task AccessTokenUsesGoCompatibleClaimsAndKey()
    {
        var result = await _service.RegisterAsync(Register());
        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
        var principal = handler.ValidateToken(result.AccessToken,
            new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(JwtSecrets.DeriveKey(Secret)),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero,
            },
            out _);

        var user = await _db.Users.SingleAsync();
        Assert.Equal(user.Id, principal.FindFirst("sub")?.Value);
        Assert.Equal(user.PubId, principal.FindFirst("pubid")?.Value);
        Assert.Equal("default", principal.FindFirst("grp")?.Value);
    }

    [Fact]
    public async Task DuplicateUsernameIsRejected()
    {
        await _service.RegisterAsync(Register());

        var ex = await Assert.ThrowsAsync<ModuleException>(() => _service.RegisterAsync(Register()));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Equal(AuthErrors.RegistrationFailed, ex.Code);
        Assert.Single(await _db.Users.ToListAsync());
    }

    [Theory]
    [InlineData("ab", "long-enough")]
    [InlineData("alice", "short")]
    public async Task InvalidUsernameOrPasswordIsRejected(string username, string password)
    {
        var ex = await Assert.ThrowsAsync<ModuleException>(() =>
            _service.RegisterAsync(Register(username, password)));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
        Assert.Equal(AuthErrors.InvalidRequest, ex.Code);
        Assert.Empty(await _db.Users.ToListAsync());
    }

    [Fact]
    public async Task EmailRegistrationIsRoutedToVerificationFlow()
    {
        var ex = await Assert.ThrowsAsync<ModuleException>(() =>
            _service.RegisterAsync(new RegisterRequest("alice", "a@example.com", "correct-horse")));

        Assert.Equal(AuthErrors.RegistrationFailed, ex.Code);
        Assert.Empty(await _db.Users.ToListAsync());
    }

    [Theory]
    [InlineData("usr_")]
    [InlineData("a@example.com")]
    [InlineData("alice")]
    public async Task LoginAcceptsPubIdEmailOrUsername(string selector)
    {
        var registered = await _service.RegisterAsync(Register());
        var account = await _db.Users.SingleAsync();
        account.Email = "a@example.com";
        await _db.SaveChangesAsync();
        if (selector == "usr_")
        {
            selector = registered.User.PubId;
        }

        var result = await _service.LoginAsync(new LoginRequest(selector, "correct-horse"));

        Assert.Equal(registered.User.Id, result.User.Id);
        Assert.Equal(64, result.RefreshToken.Length);
    }

    [Fact]
    public async Task UnknownUserAndWrongPasswordShareTheSameError()
    {
        await _service.RegisterAsync(Register());

        var unknown = await Assert.ThrowsAsync<ModuleException>(() =>
            _service.LoginAsync(new LoginRequest("nobody", "correct-horse")));
        var wrongPassword = await Assert.ThrowsAsync<ModuleException>(() =>
            _service.LoginAsync(new LoginRequest("alice", "wrong-password")));

        Assert.Equal(StatusCodes.Status401Unauthorized, unknown.StatusCode);
        Assert.Equal(AuthErrors.LoginFailed, unknown.Code);
        Assert.Equal(AuthErrors.InvalidCredentials, unknown.Message);
        Assert.Equal(unknown.Code, wrongPassword.Code);
        Assert.Equal(unknown.Message, wrongPassword.Message);
    }

    [Fact]
    public async Task LoginVerifiesLegacyGoBcryptHash()
    {
        _db.Users.Add(new UserEntity
        {
            Id = "go-user",
            PubId = "usr_go12345",
            Username = "go-user",
            Email = "go@example.com",
            PasswdHash = BCrypt.Net.BCrypt.HashPassword("go-password"),
            UserGroupId = "default",
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        var result = await _service.LoginAsync(new LoginRequest("go-user", "go-password"));

        Assert.Equal("go-user", result.User.Username);
    }

    [Fact]
    public async Task RefreshRotatesTokenAndConsumesTheOldOne()
    {
        var registered = await _service.RegisterAsync(Register());

        var refreshed = await _service.RefreshAsync(registered.RefreshToken);

        Assert.NotEqual(registered.RefreshToken, refreshed.RefreshToken);
        Assert.Equal(registered.User.Id, refreshed.User.Id);
        Assert.False(_tokens.TryGet(registered.RefreshToken, out _));
        await Assert.ThrowsAsync<ModuleException>(() => _service.RefreshAsync(registered.RefreshToken));
    }

    [Fact]
    public async Task RefreshRejectsUnknownToken()
    {
        var ex = await Assert.ThrowsAsync<ModuleException>(() => _service.RefreshAsync("not-a-token"));

        Assert.Equal(StatusCodes.Status401Unauthorized, ex.StatusCode);
        Assert.Equal(AuthErrors.InvalidRefreshToken, ex.Code);
    }

    [Fact]
    public async Task LogoutAndLogoutAllRevokeSessions()
    {
        var first = await _service.RegisterAsync(Register("alice"));
        var second = await _service.LoginAsync(new LoginRequest("alice", "correct-horse"));

        await _service.LogoutAsync(first.RefreshToken);
        Assert.False(_tokens.TryGet(first.RefreshToken, out _));
        Assert.True(_tokens.TryGet(second.RefreshToken, out _));

        await _service.LogoutAllAsync(first.User.Id);
        Assert.False(_tokens.TryGet(second.RefreshToken, out _));
    }

    [Fact]
    public async Task MeReturnsProfileAndMissingUserFails()
    {
        var registered = await _service.RegisterAsync(Register());

        var profile = await _service.MeAsync(registered.User.Id);
        Assert.Equal(registered.User.PubId, profile.PubId);

        var ex = await Assert.ThrowsAsync<ModuleException>(() => _service.MeAsync("missing"));
        Assert.Equal(StatusCodes.Status404NotFound, ex.StatusCode);
        Assert.Equal(AuthErrors.UserNotFound, ex.Code);
    }

    [Fact]
    public async Task EmailChallengeFlowsAreExplicitlyNotImplemented()
    {
        var ex = await Assert.ThrowsAsync<ModuleException>(() =>
            _service.RegisterWithEmailAsync(new RegisterWithEmailRequest("alice", "a@example.com", "correct-horse")));

        Assert.Equal(StatusCodes.Status501NotImplemented, ex.StatusCode);
        Assert.Equal(AuthErrors.EmailAuthNotImplemented, ex.Code);
    }
}
