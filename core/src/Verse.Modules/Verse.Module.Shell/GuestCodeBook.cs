using System.Security.Cryptography;

namespace Verse.Module.Shell;

/// <summary>
/// In-memory verification-code store for the Termity guest (not-logged-in) entry gate.
///
/// Replaces the old frontend-hardcoded password: an 8-char code (0-9 + A-Z) is
/// minted server-side on every issue, surfaced only in backend runtime logs and
/// the browser devtools console, and is single-use (consumed on success),
/// TTL-bounded and attempt-capped.
/// </summary>
public sealed class GuestCodeBook
{
    public const int CodeLength = 8;

    /// <summary>Failed attempts allowed per code before it is invalidated.</summary>
    public const int MaxAttempts = 5;

    public static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    /// <summary>Charset per spec: exactly 0-9 and A-Z (36 symbols).</summary>
    public const string Charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public enum VerifyResult
    {
        /// <summary>Code matched; consumed (one-time use).</summary>
        Valid,
        /// <summary>Wrong code with attempts remaining — the code stays alive.</summary>
        Mismatch,
        /// <summary>No live code: never issued, consumed, or TTL elapsed.</summary>
        Expired,
        /// <summary>Attempt cap reached — code invalidated, a fresh issue is required.</summary>
        Exhausted,
    }

    private readonly object _gate = new();
    private string? _code;
    private DateTimeOffset _expiresAt;
    private int _attempts;

    /// <summary>Attempt counter for logging and tests (read right after a Verify call).</summary>
    public int Attempts
    {
        get { lock (_gate) return _attempts; }
    }

    /// <summary>
    /// Mint a fresh code (replacing any previous one) and reset the attempt counter.
    /// Uses a CSPRNG — 36^8 ≈ 2.8e12 combinations.
    /// </summary>
    public string Issue(DateTimeOffset now)
    {
        var chars = new char[CodeLength];
        for (var i = 0; i < CodeLength; i++)
            chars[i] = Charset[RandomNumberGenerator.GetInt32(0, Charset.Length)];
        var code = new string(chars);

        lock (_gate)
        {
            _code = code;
            _expiresAt = now.Add(Ttl);
            _attempts = 0;
        }
        return code;
    }

    /// <summary>Check a candidate code. Case-insensitive; input is normalized to upper.</summary>
    public VerifyResult Verify(string? input, DateTimeOffset now)
    {
        lock (_gate)
        {
            if (_code is null || now >= _expiresAt)
            {
                _code = null;
                return VerifyResult.Expired;
            }

            var normalized = (input ?? string.Empty).Trim().ToUpperInvariant();
            if (normalized.Length == CodeLength &&
                string.Equals(normalized, _code, StringComparison.Ordinal))
            {
                _code = null; // one-time use
                return VerifyResult.Valid;
            }

            _attempts++;
            if (_attempts >= MaxAttempts)
            {
                _code = null;
                return VerifyResult.Exhausted;
            }
            return VerifyResult.Mismatch;
        }
    }
}
