using Verse.Shared;
using Xunit;

namespace Verse.Tests;

public class CurrentUserTests
{
    private static CurrentUser Self(string group = "default", string appId = "", string[]? scopes = null) => new()
    {
        UserId = "u1",
        PubId = "usr_test",
        Group = group,
        AppId = appId,
        GrantedScopes = scopes ?? Array.Empty<string>(),
    };

    [Fact]
    public void SelfUserHoldsAllUserScopes()
    {
        var user = Self();

        Assert.True(user.HasScope(Scopes.NotesRead));
        Assert.True(user.HasScope(Scopes.NotesWrite));
        Assert.True(user.HasScope(Scopes.AccountWrite));
        Assert.False(user.HasScope(Scopes.AdminSystemRead));
    }

    [Fact]
    public void AdministratorHoldsAdminScopes()
    {
        var user = Self(Scopes.AdministratorGroupId);

        Assert.True(user.IsAdmin);
        Assert.True(user.HasScope(Scopes.AdminSystemRead));
    }

    [Fact]
    public void ScopedApplicationIsRestrictedToGrants()
    {
        var user = Self("default", "app-1", [Scopes.NotesRead]);

        Assert.True(user.IsScopedApplication);
        Assert.True(user.HasScope(Scopes.NotesRead));
        Assert.False(user.HasScope(Scopes.NotesWrite));
        Assert.False(user.HasScope(Scopes.DriveRead));
    }

    [Fact]
    public void ScopedApplicationWriteImpliesRead()
    {
        var user = Self("default", "app-1", [Scopes.DriveWrite]);
        Assert.True(user.HasScope(Scopes.DriveRead));
    }

    [Fact]
    public void ScopedApplicationAdminScopeNeedsAdminGroup()
    {
        var nonAdmin = Self("default", "app-1", [Scopes.AdminSystemRead]);
        Assert.False(nonAdmin.HasScope(Scopes.AdminSystemRead));

        var admin = Self(Scopes.AdministratorGroupId, "app-1", [Scopes.AdminSystemRead]);
        Assert.True(admin.HasScope(Scopes.AdminSystemRead));
    }

    [Fact]
    public void AnonymousHasNothing()
    {
        var user = new CurrentUser();
        Assert.False(user.Authenticated);
        Assert.False(user.HasScope(Scopes.NotesRead));
    }

    [Fact]
    public void UnknownScopeNeverGranted()
    {
        var user = Self("default", "app-1", ["nope:missing"]);
        Assert.False(user.HasScope("nope:missing"));
    }
}
