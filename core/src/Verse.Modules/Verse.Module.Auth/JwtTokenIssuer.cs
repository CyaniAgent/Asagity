using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Verse.Data.Entities;
using Verse.Shared;

namespace Verse.Module.Auth;

/// <summary>
/// Issues access tokens with the same claims, key derivation and lifetime as
/// the Go <c>auth/service.generateAccessToken</c> so both engines accept them.
/// </summary>
public sealed class JwtTokenIssuer(IConfiguration config)
{
    public static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(30);
    public static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(30);

    private readonly SymmetricSecurityKey _key =
        new(JwtSecrets.DeriveKey(JwtSecrets.Resolve(config)));

    public string IssueAccessToken(User user)
    {
        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            claims:
            [
                new Claim("sub", user.Id),
                new Claim("pubid", user.PubId),
                new Claim("grp", user.UserGroupId),
                new Claim("iat", EpochSeconds(now).ToString(System.Globalization.CultureInfo.InvariantCulture), ClaimValueTypes.Integer64),
            ],
            notBefore: now,
            expires: now.Add(AccessTokenLifetime),
            signingCredentials: new SigningCredentials(_key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>64-character opaque token, matching Go's hex-encoded 32 random bytes.</summary>
    public static string GenerateRefreshToken() =>
        Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

    private static long EpochSeconds(DateTime utc) =>
        new DateTimeOffset(utc).ToUnixTimeSeconds();
}
