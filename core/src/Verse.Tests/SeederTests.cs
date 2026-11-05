using Microsoft.EntityFrameworkCore;
using Verse.Data;
using Verse.Shared;
using Verse.Data.Entities;
using Xunit;

namespace Verse.Tests;

public class SeederTests
{
    // A temp file (not ":memory:") keeps one SQLite instance alive across the
    // connections EF Core opens per operation.
    private static VerseDbContext NewDb()
    {
        var path = Path.Combine(Path.GetTempPath(), $"asagity-test-{Guid.NewGuid():N}.db");
        var options = new DbContextOptionsBuilder<VerseDbContext>()
            .UseSqlite($"Data Source={path}")
            .Options;
        return new VerseDbContext(options);
    }

    [Fact]
    public async Task SeedsDeveloperAccountInLiteMode()
    {
        await using var db = NewDb();
        var seeder = new VerseDataSeeder(db);
        var options = new DataOptions { Mode = RuntimeMode.Lite };

        var created = await seeder.EnsureSeededAsync(options);

        Assert.True(created);
        var account = await db.Users.SingleAsync();
        Assert.Equal(VerseDataSeeder.LiteDeveloperUsername, account.Username);
        Assert.Equal(VerseDataSeeder.LiteDeveloperEmail, account.Email);
        Assert.Equal(Scopes.AdministratorGroupId, account.UserGroupId);
        Assert.NotEqual(VerseDataSeeder.LiteDeveloperPassword, account.PasswdHash);
        Assert.NotEmpty(account.PubId);
    }

    [Fact]
    public async Task SeedingIsIdempotent()
    {
        await using var db = NewDb();
        var seeder = new VerseDataSeeder(db);
        var options = new DataOptions { Mode = RuntimeMode.Lite };

        Assert.True(await seeder.EnsureSeededAsync(options));
        Assert.False(await seeder.EnsureSeededAsync(options));
        Assert.Equal(1, await db.Users.CountAsync());
    }

    [Fact]
    public async Task PlainUsersDoNotBlockSeeding()
    {
        await using var db = NewDb();
        var seeder = new VerseDataSeeder(db);
        var options = new DataOptions { Mode = RuntimeMode.Lite };

        await seeder.EnsureSeededAsync(options);
        await db.Users.ExecuteDeleteAsync();

        db.Users.Add(new User
        {
            Id = "regular-1",
            PubId = "usr_regular1",
            Username = "regular",
            PasswdHash = "x",
            UserGroupId = "default",
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var created = await seeder.EnsureSeededAsync(options);

        Assert.True(created);
        Assert.Equal(2, await db.Users.CountAsync());
    }

    [Fact]
    public async Task ProductionSeedsTheInstanceAdministrator()
    {
        await using var db = NewDb();
        var seeder = new VerseDataSeeder(db);
        var options = new DataOptions { Mode = RuntimeMode.Production };

        var created = await seeder.EnsureSeededAsync(options);

        Assert.True(created);
        var account = await db.Users.SingleAsync();
        Assert.Equal(VerseDataSeeder.ProductionAdministratorUsername, account.Username);
        Assert.Equal("usr_asagity0", account.PubId);
    }
}
