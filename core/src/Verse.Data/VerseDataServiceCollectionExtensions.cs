using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Verse.Data.Entities;
using Verse.Shared;

namespace Verse.Data;

/// <summary>Runtime modes mirrored from the Go engine (core/src/Verse.Engine/internal/platform/mode).</summary>
public enum RuntimeMode
{
    Databaseless = 0,
    Lite = 1,
    Production = 2,
}

/// <summary>Connection settings resolved from the environment.</summary>
public sealed record DataOptions
{
    public RuntimeMode Mode { get; init; } = RuntimeMode.Production;
    public string SqlitePath { get; init; } = "./data/lite/asagity.db";
    public string DbHost { get; init; } = "localhost";
    public string DbPort { get; init; } = "5432";
    public string DbUser { get; init; } = "asagity";
    public string DbPassword { get; init; } = "example_password";
    public string DbName { get; init; } = "asagity_db";

    /// <summary>Maximum number of pooled DbContext instances kept alive.</summary>
    public int DbContextPoolSize { get; init; } = 64;

    /// <summary>Reads the settings from environment variables (same names as the Go engine).</summary>
    public static DataOptions FromEnvironment()
    {
        var modeValue = Environment.GetEnvironmentVariable("ASAGITY_MODE");
        var mode = modeValue?.Trim().ToLowerInvariant() switch
        {
            "databaseless" => RuntimeMode.Databaseless,
            "lite" => RuntimeMode.Lite,
            _ => RuntimeMode.Production,
        };

        return new DataOptions
        {
            Mode = mode,
            SqlitePath = Env("LITE_SQLITE_PATH", "./data/lite/asagity.db"),
            DbHost = Env("DB_HOST", "localhost"),
            DbPort = Env("DB_PORT", "5432"),
            DbUser = Env("DB_USER", "asagity"),
            DbPassword = Env("DB_PASSWORD", "example_password"),
            DbName = Env("DB_NAME", "asagity_db"),
        };
    }

    private static string Env(string key, string fallback)
    {
        var value = Environment.GetEnvironmentVariable(key);
        return string.IsNullOrWhiteSpace(value) ? fallback : value;
    }
}

public static class VerseDataServiceCollectionExtensions
{
    /// <summary>
    /// Registers the data layer. The provider follows the runtime mode:
    /// lite uses SQLite (file-backed, no external service), production uses
    /// PostgreSQL, databaseless registers nothing because no module may touch
    /// storage in that mode.
    /// </summary>
    public static IServiceCollection AddVerseData(this IServiceCollection services, DataOptions options)
    {
        if (options.Mode == RuntimeMode.Databaseless)
        {
            // Databaseless still needs a resolvable DbContext (the modules ask
            // for it), but it must not touch the disk. A shared-cache in-memory
            // SQLite fits: no file, no external process. One connection is held
            // open because the in-memory database lives as long as at least
            // one connection to it exists.
            services.AddSingleton(_ => KeepAliveInMemoryConnection());
            services.AddDbContextPool<VerseDbContext>(
                builder => builder.UseSqlite(InMemoryConnectionString), options.DbContextPoolSize);
            return services;
        }

        // Pooling reuses DbContext instances instead of allocating one per
        // request: fewer allocations, less GC churn and a lower steady-state
        // footprint. The pool size is bounded (default 1024 would be absurd
        // for a small instance and is the main source of idle memory).
        services.AddDbContextPool<VerseDbContext>(builder => builder.UseProvider(options), options.DbContextPoolSize);

        // The seeding step is idempotent and shared by both providers.
        services.AddScoped<VerseDataSeeder>();
        return services;
    }

    /// <summary>Shared-cache in-memory SQLite connection string (no file on disk).</summary>
    public const string InMemoryConnectionString =
        "Data Source=file:asagity_dbless?mode=memory&cache=shared";

    private static SqliteConnection KeepAliveInMemoryConnection()
    {
        var connection = new SqliteConnection(InMemoryConnectionString);
        connection.Open();
        return connection;
    }

    private static DbContextOptionsBuilder UseProvider(this DbContextOptionsBuilder builder, DataOptions options)
    {
        if (options.Mode == RuntimeMode.Lite)
        {
            var dir = Path.GetDirectoryName(options.SqlitePath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }

            return builder.UseSqlite($"Data Source={options.SqlitePath}");
        }

        var cs = $"Host={options.DbHost};Port={options.DbPort};Username={options.DbUser};" +
                  $"Password={options.DbPassword};Database={options.DbName};Timezone=Asia/Shanghai";
        return builder.UseNpgsql(cs);
    }
}

/// <summary>
/// Seeds the built-in groups and the administrator/developer account.
/// Mirrors core/src/Verse.Engine/internal/platform/database/seed.go so both
/// stacks agree on the seeding condition ("no administrator account yet").
/// </summary>
public sealed class VerseDataSeeder(VerseDbContext db)
{
    public const string AdministratorGroupId = Scopes.AdministratorGroupId;
    public const string AdministratorGroupName = "Administrator";

    /// <summary>Fixed developer account of the lite mode.</summary>
    public const string LiteDeveloperUsername = "Asagity-dev@asagity.example";
    public const string LiteDeveloperEmail = "example@example.com";
    public const string LiteDeveloperPassword = "Asagity-dev1234";

    /// <summary>Default administrator of a production instance.</summary>
    public const string ProductionAdministratorUsername = "asagity_admin";
    public const string ProductionAdministratorEmail = "admin@asagity.local";
    public const string ProductionAdministratorPassword = "Asagity1234";

    public async Task<bool> EnsureSeededAsync(DataOptions options, CancellationToken ct = default)
    {
        // The .NET side may own the database before the Go engine ever ran, so
        // make sure the schema exists. EnsureCreated never alters an existing
        // schema, which keeps the Go-owned tables intact.
        await db.Database.EnsureCreatedAsync(ct);

        await EnsureGroupsAsync(ct);

        var lite = options.Mode == RuntimeMode.Lite;
        var username = lite ? LiteDeveloperUsername : ProductionAdministratorUsername;
        var email = lite ? LiteDeveloperEmail : ProductionAdministratorEmail;
        var password = lite ? LiteDeveloperPassword : ProductionAdministratorPassword;
        var displayName = lite ? "Asagity Developer" : "Asagity Administrator";

        if (await db.Users.AnyAsync(u => u.UserGroupId == AdministratorGroupId, ct))
        {
            return false;
        }

        var account = new User
        {
            Id = lite ? Guid.NewGuid().ToString("N") : "00000000000000000000000000000001",
            PubId = lite ? PubIdGenerator.GenerateUserPubId() : "usr_asagity0",
            Username = username,
            Email = email,
            PasswdHash = PasswordHasher.Hash(password),
            Name = displayName,
            UserGroupId = AdministratorGroupId,
            CreatedAt = DateTime.UtcNow,
        };

        db.Users.Add(account);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private async Task EnsureGroupsAsync(CancellationToken ct)
    {
        if (await db.UserGroups.AnyAsync(ct))
        {
            return;
        }

        var now = DateTime.UtcNow;
        db.UserGroups.AddRange(
            new UserGroup
            {
                Id = AdministratorGroupId, Name = AdministratorGroupName,
                Code = AdministratorGroupId, Description = "System administrators", CreatedAt = now,
            },
            new UserGroup
            {
                Id = "moderator", Name = "Moderator",
                Code = "moderator", Description = "Content moderators", CreatedAt = now,
            },
            new UserGroup
            {
                Id = "default", Name = "User",
                Code = "user", Description = "Regular users", CreatedAt = now,
            });

        await db.SaveChangesAsync(ct);
    }
}
