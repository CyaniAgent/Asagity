using System.Security.Cryptography;

namespace Verse.Data;

/// <summary>
/// Password hashing for the .NET stack. New hashes use PBKDF2 (SHA-256,
/// 210k iterations) with a per-password salt and a versioned, self-describing
/// payload so hashes stay verifiable and upgradeable.
///
/// The Go engine writes bcrypt ($2a$/$2b$) hashes into the same users table,
/// so verification also understands those legacy hashes during the S5
/// migration window. New writes are always PBKDF2; a successful bcrypt
/// verification can be upgraded by calling <see cref="NeedsUpgrade"/> and
/// <see cref="Hash"/>.
/// </summary>
public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 210_000;
    private const string Prefix = "pbkdf2-sha256";

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);

        return $"{Prefix}${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    /// <summary>True when the stored hash came from the Go engine and should be upgraded on next login.</summary>
    public static bool NeedsUpgrade(string stored) =>
        !string.IsNullOrEmpty(stored) && !stored.StartsWith(Prefix + "$", StringComparison.Ordinal);

    public static bool Verify(string password, string stored)
    {
        if (string.IsNullOrEmpty(stored) || string.IsNullOrEmpty(password))
        {
            return false;
        }

        if (!stored.StartsWith(Prefix + "$", StringComparison.Ordinal))
        {
            // Go bcrypt hashes: $2a$/$2b$ followed by cost, salt and digest.
            // Plain Verify (not EnhancedVerify) is the wire-compatible mode.
            if (!stored.StartsWith("$2", StringComparison.Ordinal))
            {
                return false;
            }

            try
            {
                return BCrypt.Net.BCrypt.Verify(password, stored);
            }
            catch (Exception)
            {
                // Malformed/truncated legacy hash: treat as a failed login
                // instead of leaking the parsing error to the caller.
                return false;
            }
        }

        var parts = stored.Split('$');
        if (parts.Length != 4 || parts[0] != Prefix)
        {
            return false;
        }

        if (!int.TryParse(parts[1], out var iterations) || iterations <= 0)
        {
            return false;
        }

        byte[] salt, expected;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expected = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
