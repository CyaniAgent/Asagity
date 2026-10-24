using Microsoft.EntityFrameworkCore;
using Verse.Data;
using Verse.Data.Entities;
using UserEntity = Verse.Data.Entities.User;

namespace Verse.Module.User;

/// <summary>Repository over accounts, groups and public-id history.</summary>
public interface IUserRepository
{
    Task<UserEntity?> GetByIdAsync(string userId, CancellationToken ct = default);
    Task<UserEntity?> GetByUsernameAsync(string username, CancellationToken ct = default);
    Task<UserEntity?> GetByPubIdAsync(string pubId, CancellationToken ct = default);
    Task<UserEntity?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<bool> PubIdExistsAsync(string pubId, CancellationToken ct = default);
    Task<int> CountPubIdChangesInMonthAsync(string userId, DateTime start, DateTime end, CancellationToken ct = default);
    Task<IReadOnlyList<PubIdChange>> GetPubIdChangeHistoryAsync(string userId, int limit, CancellationToken ct = default);
    Task UpdatePubIdWithHistoryAsync(string userId, string oldPubId, string newPubId, DateTime changedAt, CancellationToken ct = default);
    Task<string> GetGroupNameAsync(string groupId, CancellationToken ct = default);
}

public sealed class UserRepository(VerseDbContext db) : IUserRepository
{
    public Task<UserEntity?> GetByIdAsync(string userId, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

    public Task<UserEntity?> GetByUsernameAsync(string username, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Username == username, ct);

    public Task<UserEntity?> GetByPubIdAsync(string pubId, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.PubId == pubId, ct);

    public Task<UserEntity?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<bool> PubIdExistsAsync(string pubId, CancellationToken ct = default) =>
        db.Users.AnyAsync(u => u.PubId == pubId, ct);

    public Task<int> CountPubIdChangesInMonthAsync(string userId, DateTime start, DateTime end, CancellationToken ct = default) =>
        db.PubIdChanges.CountAsync(c => c.UserId == userId && c.ChangedAt >= start && c.ChangedAt < end, ct);

    public async Task<IReadOnlyList<PubIdChange>> GetPubIdChangeHistoryAsync(
        string userId, int limit, CancellationToken ct = default) =>
        await db.PubIdChanges.AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.ChangedAt)
            .Take(limit)
            .ToListAsync(ct);

    public async Task UpdatePubIdWithHistoryAsync(
        string userId, string oldPubId, string newPubId, DateTime changedAt, CancellationToken ct = default)
    {
        var account = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new InvalidOperationException("user not found");

        account.PubId = newPubId;
        db.PubIdChanges.Add(new PubIdChange
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            OldPubId = oldPubId,
            NewPubId = newPubId,
            ChangedAt = changedAt,
        });

        await db.SaveChangesAsync(ct);
    }

    public async Task<string> GetGroupNameAsync(string groupId, CancellationToken ct = default)
    {
        var group = await db.UserGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == groupId, ct);
        return group?.Name ?? groupId;
    }
}
