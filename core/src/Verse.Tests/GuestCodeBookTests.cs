using Verse.Module.Shell;
using Xunit;

namespace Verse.Tests;

/// <summary>
/// Termity guest-entry verification code rules:
/// charset/length, TTL, attempt cap, one-time use, re-issue.
/// </summary>
public sealed class GuestCodeBookTests
{
    private static readonly DateTimeOffset T0 = new(2026, 10, 24, 12, 0, 0, TimeSpan.Zero);

    /// <summary>8 chars guaranteed different from <paramref name="code"/>.</summary>
    private static string WrongCode(string code) =>
        string.Concat(code[..^1], code[^1] == 'A' ? "B" : "A");

    [Fact]
    public void Issue_MintsEightCharsFromDigitUpperAlphabet()
    {
        var book = new GuestCodeBook();
        for (var i = 0; i < 64; i++)
        {
            var code = book.Issue(T0);
            Assert.Equal(GuestCodeBook.CodeLength, code.Length);
            Assert.All(code, c => Assert.Contains(c, GuestCodeBook.Charset));
        }
    }

    [Fact]
    public void Verify_CorrectCode_IsCaseInsensitive_AndConsumesCode()
    {
        var book = new GuestCodeBook();
        var code = book.Issue(T0);

        Assert.Equal(GuestCodeBook.VerifyResult.Valid, book.Verify(code.ToLowerInvariant(), T0));
        // one-time use: a replay of the same code must fail
        Assert.Equal(GuestCodeBook.VerifyResult.Expired, book.Verify(code, T0));
    }

    [Fact]
    public void Verify_WrongCode_KeepsCodeAlive_UntilAttemptCap()
    {
        var book = new GuestCodeBook();
        var code = book.Issue(T0);
        var wrong = WrongCode(code);

        for (var i = 1; i < GuestCodeBook.MaxAttempts; i++)
            Assert.Equal(GuestCodeBook.VerifyResult.Mismatch, book.Verify(wrong, T0));

        // cap reached → invalidated; even the correct code is dead afterwards
        Assert.Equal(GuestCodeBook.VerifyResult.Exhausted, book.Verify(wrong, T0));
        Assert.Equal(GuestCodeBook.VerifyResult.Expired, book.Verify(code, T0));
    }

    [Fact]
    public void Verify_AfterTtl_ReturnsExpired()
    {
        var book = new GuestCodeBook();
        var code = book.Issue(T0);

        Assert.Equal(
            GuestCodeBook.VerifyResult.Expired,
            book.Verify(code, T0.Add(GuestCodeBook.Ttl)));
    }

    [Fact]
    public void Verify_MalformedInput_IsMismatchNotCrash()
    {
        var book = new GuestCodeBook();
        book.Issue(T0);

        Assert.Equal(GuestCodeBook.VerifyResult.Mismatch, book.Verify(null, T0));
        Assert.Equal(GuestCodeBook.VerifyResult.Mismatch, book.Verify("", T0));
        Assert.Equal(GuestCodeBook.VerifyResult.Mismatch, book.Verify("short", T0));
        Assert.Equal(GuestCodeBook.VerifyResult.Mismatch, book.Verify("has space", T0));
    }

    [Fact]
    public void Issue_ReplacesPreviousCode_AndResetsAttempts()
    {
        var book = new GuestCodeBook();
        var first = book.Issue(T0);
        var second = book.Issue(T0);
        Assert.NotEqual(first, second);

        // old code no longer verifies, new one does
        Assert.Equal(GuestCodeBook.VerifyResult.Mismatch, book.Verify(first, T0));
        Assert.Equal(GuestCodeBook.VerifyResult.Valid, book.Verify(second, T0));
    }

    [Fact]
    public void Issue_AfterExhaustion_MintsFreshUsableCode()
    {
        var book = new GuestCodeBook();
        var dead = book.Issue(T0);
        var wrong = WrongCode(dead);
        for (var i = 0; i < GuestCodeBook.MaxAttempts; i++)
            book.Verify(wrong, T0);

        var fresh = book.Issue(T0);
        Assert.Equal(0, book.Attempts);
        Assert.Equal(GuestCodeBook.VerifyResult.Valid, book.Verify(fresh, T0));
    }
}
