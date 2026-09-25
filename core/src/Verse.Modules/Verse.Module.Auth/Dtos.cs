using System.Text.Json.Serialization;

namespace Verse.Module.Auth;

/// <summary>Ported from Go <c>auth/dto.RegisterRequest</c> (username 3-64, optional email, password 8+).</summary>
public sealed record RegisterRequest(
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("password")] string Password);

/// <summary>Ported from Go <c>auth/dto.LoginRequest</c> (identifier = username/email/pubid).</summary>
public sealed record LoginRequest(
    [property: JsonPropertyName("identifier")] string Identifier,
    [property: JsonPropertyName("password")] string Password);

/// <summary>Ported from Go <c>auth/dto.RefreshRequest</c> (cookie is preferred, body is the fallback).</summary>
public sealed record RefreshRequest(
    [property: JsonPropertyName("refresh_token")] string RefreshToken);

/// <summary>Ported from Go <c>auth/dto.LogoutRequest</c>.</summary>
public sealed record LogoutRequest(
    [property: JsonPropertyName("refresh_token")] string RefreshToken);

/// <summary>Ported from Go <c>auth/dto.UserResponse</c>.</summary>
public sealed record UserResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("pub_id")] string PubId,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("avatar_url")] string AvatarUrl);

/// <summary>Ported from Go <c>auth/dto.AuthResponse</c>.</summary>
public sealed record AuthResponse(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("refresh_token")] string RefreshToken,
    [property: JsonPropertyName("user")] UserResponse User);

/// <summary>Ported from Go <c>auth/dto.VerifyEmailRequest</c> (6-digit code).</summary>
public sealed record VerifyEmailRequest(
    [property: JsonPropertyName("challenge_id")] string ChallengeId,
    [property: JsonPropertyName("code")] string Code);

/// <summary>Ported from Go <c>auth/dto.RegisterWithEmailRequest</c>.</summary>
public sealed record RegisterWithEmailRequest(
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("password")] string Password);

/// <summary>Ported from Go <c>auth/dto.RegisterSendCodeResponse</c>.</summary>
public sealed record RegisterSendCodeResponse(
    [property: JsonPropertyName("challenge_id")] string ChallengeId,
    [property: JsonPropertyName("expires_at")] string ExpiresAt);

/// <summary>Ported from Go <c>auth/dto.LoginChallengeResponse</c>.</summary>
public sealed record LoginChallengeResponse(
    [property: JsonPropertyName("challenge_id")] string ChallengeId,
    [property: JsonPropertyName("expires_at")] string ExpiresAt);

/// <summary>Ported from Go logout/logout-all success shape <c>{status: ok}</c>.</summary>
public sealed record StatusResponse(
    [property: JsonPropertyName("status")] string Status);
