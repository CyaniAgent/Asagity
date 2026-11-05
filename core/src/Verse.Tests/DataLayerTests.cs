using Verse.Data;
using Xunit;

namespace Verse.Tests;

public class DataLayerTests
{
    [Theory]
    [InlineData("Asagity-dev1234", true)]
    [InlineData("abc", true)]
    [InlineData("a_b-c.d", true)]
    [InlineData("", false)]
    [InlineData("has space", false)]
    [InlineData("bad/slash", false)]
    public void CustomPubIdValidationMatchesGoRules(string id, bool expected)
    {
        Assert.Equal(expected, PubIdGenerator.IsValidCustomPubId(id));
    }

    [Fact]
    public void GeneratedPubIdsUseTheExpectedShape()
    {
        var pubId = PubIdGenerator.GenerateUserPubId();

        Assert.StartsWith("usr_", pubId);
        Assert.Equal(12, pubId.Length);
        Assert.All(pubId[4..], c => Assert.True(char.IsAsciiLetterLower(c) || char.IsAsciiDigit(c)));
    }

    [Fact]
    public void PasswordHashRoundTrips()
    {
        var hash = PasswordHasher.Hash("Asagity-dev1234");

        Assert.NotEqual("Asagity-dev1234", hash);
        Assert.True(PasswordHasher.Verify("Asagity-dev1234", hash));
        Assert.False(PasswordHasher.Verify("wrong", hash));
    }

    [Fact]
    public void PasswordHashRejectsForeignPayloads()
    {
        Assert.False(PasswordHasher.Verify("x", ""));
        Assert.False(PasswordHasher.Verify("x", "$2a$10$notpbkdf2"));
    }

    [Fact]
    public void GoTimestampFormatIsParsable()
    {
        // Written by the Go engine (GORM) into SQLite.
        var parsed = DateTimeConverters.Parse("2026-10-21 06:03:18.016999146+08:00");

        Assert.Equal(DateTimeKind.Utc, parsed.Kind);
        Assert.Equal(2026, parsed.Year);
    }

    [Fact]
    public void EfTimestampFormatIsParsable()
    {
        var parsed = DateTimeConverters.Parse("2026-10-21 06:03:18.0169991");

        Assert.Equal(DateTimeKind.Utc, parsed.Kind);
    }
}
