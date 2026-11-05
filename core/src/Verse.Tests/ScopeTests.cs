using Verse.Shared;
using Xunit;

namespace Verse.Tests;

public class ScopeTests
{
    [Fact]
    public void WriteImpliesReadWithinDomain()
    {
        var expanded = Scopes.Expand(["notes:write", "admin:users:write"]);

        Assert.Contains("notes:write", expanded);
        Assert.Contains("notes:read", expanded);
        Assert.Contains("admin:users:write", expanded);
        Assert.Contains("admin:users:read", expanded);
        Assert.DoesNotContain("notes:delete", expanded);
    }

    [Fact]
    public void UnknownScopesPassThrough()
    {
        var expanded = Scopes.Expand(["future:thing"]);
        Assert.Contains("future:thing", expanded);
    }

    [Fact]
    public void AdminScopesAreIndependent()
    {
        Assert.True(Scopes.IsAdminScope("admin:users:write"));
        Assert.False(Scopes.IsAdminScope("notes:write"));
    }

    [Theory]
    [InlineData("account:read")]
    [InlineData("notes:write")]
    [InlineData("drive:read")]
    [InlineData("follow:write")]
    [InlineData("admin:system:read")]
    public void EnforcedScopesAreRegistered(string scope)
    {
        Assert.Contains(scope, Scopes.Names);
    }
}
