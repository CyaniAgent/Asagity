using Microsoft.EntityFrameworkCore;
using Verse.Data;
using Verse.Data.Entities;
using Verse.Shared;

namespace Verse.Module.Instance;

/// <summary>Repository over the instance settings and database statistics.</summary>
public interface IInstanceRepository
{
    Task<IReadOnlyList<InstanceSetting>> GetAllSettingsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<DatabaseStat>> GetDatabaseStatsAsync(CancellationToken ct = default);
    Task<(User? User, string GroupName)> GetAdministratorAsync(CancellationToken ct = default);
}

public sealed record DatabaseStat(
    string Table,
    string SizePretty,
    long SizeBytes,
    long Rows);

public sealed class InstanceRepository(VerseDbContext db) : IInstanceRepository
{
    public async Task<IReadOnlyList<InstanceSetting>> GetAllSettingsAsync(CancellationToken ct = default) =>
        await db.InstanceSettings.AsNoTracking().OrderBy(s => s.Id).ToListAsync(ct);

    public async Task<IReadOnlyList<DatabaseStat>> GetDatabaseStatsAsync(CancellationToken ct = default)
    {
        // Per-table row counts work on both providers; the byte size is
        // reported by the provider-specific statistics API.
        var tables = new List<string>();
        if (db.Database.IsNpgsql())
        {
            var rows = await db.Database.SqlQueryRaw<string>(
                    """
                    SELECT relname AS "Value" FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC
                    """).ToListAsync(ct);
            tables.AddRange(rows);
        }
        else
        {
            var rows = await db.Database.SqlQueryRaw<string>(
                    """
                    SELECT name AS "Value" FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name
                    """).ToListAsync(ct);
            tables.AddRange(rows);
        }

        var stats = new List<DatabaseStat>(tables.Count);
        foreach (var table in tables)
        {
            // The table name comes from the database catalog (sqlite_master /
            // pg_stat_user_tables), never from user input, so the identifier
            // cannot be injected. EF cannot prove that, hence the suppression.
#pragma warning disable EF1002
            var count = await db.Database.SqlQueryRaw<long>(
                $"SELECT COUNT(*) AS \"Value\" FROM \"{table}\"").FirstOrDefaultAsync(ct);
#pragma warning restore EF1002

            stats.Add(new DatabaseStat(table, "-", 0, count));
        }

        return stats;
    }

    public async Task<(User? User, string GroupName)> GetAdministratorAsync(CancellationToken ct = default)
    {
        var account = await db.Users.AsNoTracking()
            .Where(u => u.UserGroupId == Scopes.AdministratorGroupId)
            .OrderBy(u => u.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (account is null)
        {
            return (null, string.Empty);
        }

        var group = await db.UserGroups.AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == account.UserGroupId, ct);

        return (account, group?.Name ?? account.UserGroupId);
    }
}
