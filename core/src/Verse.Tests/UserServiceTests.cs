using Verse.Data;
using Verse.Data.Entities;
using Verse.Module.User;
using Verse.Shared;
using Xunit;

namespace Verse.Tests;

/// <summary>In-memory repository double for the transliterated user rules.</summary>
internal sealed class FakeUserRepository : IUserRepository
{
    public User? Account { get; set; }
    public bool PubIdExists { get; set; }
    public int ChangesThisMonth { get; set; }
    public List<PubIdChange> History { get; } = [];

    public Task<User?> GetByIdAsync(string userId, CancellationToken ct = default) =>
        Task.FromResult(Account?.Id == userId ? Account : null);

    public Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default) =>
        Task.FromResult<User?>(null);

    public Task<User?> GetByPubIdAsync(string pubId, CancellationToken ct = default) =>
        Task.FromResult<User?>(null);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        Task.FromResult<User?>(null);

    public Task<bool> PubIdExistsAsync(string pubId, CancellationToken ct = default) =>
        Task.FromResult(PubIdExists);

    public Task<int> CountPubIdChangesInMonthAsync(string userId, DateTime start, DateTime end, CancellationToken ct = default) =>
        Task.FromResult(ChangesThisMonth);

    public Task<IReadOnlyList<PubIdChange>> GetPubIdChangeHistoryAsync(string userId, int limit, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<PubIdChange>>(History.Take(limit).ToList());

    public Task UpdatePubIdWithHistoryAsync(string userId, string oldPubId, string newPubId, DateTime changedAt, CancellationToken ct = default)
    {
        if (Account is not null)
        {
            Account.PubId = newPubId;
        }

        History.Add(new PubIdChange
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            OldPubId = oldPubId,
            NewPubId = newPubId,
            ChangedAt = changedAt,
        });
        return Task.CompletedTask;
    }

    public Task<string> GetGroupNameAsync(string groupId, CancellationToken ct = default) =>
        Task.FromResult("Administrator");
}

public class UserServiceTests
{
    private static FakeUserRepository Repo() => new()
    {
        Account = new User
        {
            Id = "u1",
            PubId = "usr_current",
            Username = "Asagity-dev@asagity.example",
            Name = "Asagity Developer",
            UserGroupId = Scopes.AdministratorGroupId,
            CreatedAt = DateTime.UtcNow,
        },
    };

    [Fact]
    public async Task ProfileReturnsTheCaller()
    {
        var service = new UserService(Repo());

        var profile = await service.GetMeAsync("u1");

        Assert.Equal("u1", profile.Id);
        Assert.Equal("usr_current", profile.PubId);
        Assert.Equal("Administrator", profile.Group);
    }

    [Fact]
    public async Task InvalidPubIdFormatIsRejected()
    {
        var service = new UserService(Repo());

        var ex = await Assert.ThrowsAsync<ModuleException>(() =>
            service.ChangePubIdAsync("u1", "usr_current", "bad id!"));

        Assert.Equal(UserErrors.InvalidPubIdFormat, ex.Code);
    }

    [Fact]
    public async Task SamePubIdIsRejected()
    {
        var service = new UserService(Repo());

        var ex = await Assert.ThrowsAsync<ModuleException>(() =>
            service.ChangePubIdAsync("u1", "usr_current", "usr_current"));

        Assert.Equal(UserErrors.SamePubId, ex.Code);
    }

    [Fact]
    public async Task TakenPubIdConflicts()
    {
        var repo = Repo();
        repo.PubIdExists = true;
        var service = new UserService(repo);

        var ex = await Assert.ThrowsAsync<ModuleException>(() =>
            service.ChangePubIdAsync("u1", "usr_current", "usr_taken"));

        Assert.Equal(UserErrors.PubIdConflict, ex.Code);
    }

    [Fact]
    public async Task MonthlyQuotaIsEnforced()
    {
        var repo = Repo();
        repo.ChangesThisMonth = PubIdGenerator.MaxPubIdChangesPerMonth;
        var service = new UserService(repo);

        var ex = await Assert.ThrowsAsync<ModuleException>(() =>
            service.ChangePubIdAsync("u1", "usr_current", "usr_fresh"));

        Assert.Equal(UserErrors.RateLimited, ex.Code);
    }

    [Fact]
    public async Task SuccessfulChangeUpdatesAccountAndHistory()
    {
        var repo = Repo();
        var service = new UserService(repo);

        var result = await service.ChangePubIdAsync("u1", "usr_current", "usr_fresh");

        Assert.Equal("usr_fresh", result.PubId);
        Assert.Equal(PubIdGenerator.MaxPubIdChangesPerMonth - 1, result.ChangesLeft);
        Assert.Equal("usr_fresh", repo.Account!.PubId);
        Assert.Single(repo.History);
    }
}
