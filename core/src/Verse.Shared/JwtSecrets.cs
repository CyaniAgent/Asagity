using System.Security.Cryptography;
using System.Text;

namespace Verse.Shared;

/// <summary>
/// Shared JWT secret resolution and key derivation. Both stacks derive the
/// HMAC key as SHA-256(secret) (see Go internal/platform/jwtx/key.go), which
/// keeps access tokens interchangeable during the S5 migration window.
/// </summary>
public static class JwtSecrets
{
    public const string DefaultSecret = "asagity_secret_miku_39";

    /// <summary>Configuration wins, then the process environment, then the shared default.</summary>
    public static string Resolve(IConfiguration? config)
    {
        var configured = config?["JWT_SECRET"];
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

        return Environment.GetEnvironmentVariable("JWT_SECRET") is { Length: > 0 } env
            ? env
            : DefaultSecret;
    }

    public static byte[] DeriveKey(string secret) =>
        SHA256.HashData(Encoding.UTF8.GetBytes(secret));
}
