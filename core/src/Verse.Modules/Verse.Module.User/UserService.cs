using Verse.Data;
using Verse.Shared;

namespace Verse.Module.User;

/// <summary>
/// Account service — the .NET transliteration of the Go
/// <c>internal/module/user/service</c> business rules.
/// </summary>
public sealed class UserService(IUserRepository repository) : IUserService
{
    public async Task<UserProfileResponse> GetMeAsync(string userId, CancellationToken ct = default)
    {
        var account = await repository.GetByIdAsync(userId, ct)
            ?? throw new ModuleException(StatusCodes.Status404NotFound, UserErrors.UserNotFound, "User not found");

        var group = await repository.GetGroupNameAsync(account.UserGroupId, ct);

        return new UserProfileResponse(
            account.Id,
            account.PubId,
            account.Username,
            account.Name,
            account.AvatarUrl,
            account.Description,
            group);
    }

    public async Task<ChangePubIdResponse> ChangePubIdAsync(
        string userId, string currentPubId, string newPubId, CancellationToken ct = default)
    {
        if (!PubIdGenerator.IsValidCustomPubId(newPubId))
        {
            throw new ModuleException(StatusCodes.Status400BadRequest, UserErrors.InvalidPubIdFormat,
                "PubID must be 1-30 characters (alphanumeric, _, -, . only)");
        }

        if (newPubId == currentPubId)
        {
            throw new ModuleException(StatusCodes.Status400BadRequest, UserErrors.SamePubId,
                "new_pub_id is the same as current pub_id");
        }

        if (await repository.PubIdExistsAsync(newPubId, ct))
        {
            throw new ModuleException(StatusCodes.Status409Conflict, UserErrors.PubIdConflict,
                "pub_id already taken");
        }

        var now = DateTime.Now;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Local);
        var endOfMonth = startOfMonth.AddMonths(1);

        var changeCount = await repository.CountPubIdChangesInMonthAsync(userId, startOfMonth, endOfMonth, ct);
        if (changeCount >= PubIdGenerator.MaxPubIdChangesPerMonth)
        {
            throw new ModuleException(StatusCodes.Status429TooManyRequests, UserErrors.RateLimited,
                "monthly pub_id change limit reached");
        }

        await repository.UpdatePubIdWithHistoryAsync(userId, currentPubId, newPubId, now, ct);

        var changesLeft = PubIdGenerator.MaxPubIdChangesPerMonth - changeCount - 1;
        return new ChangePubIdResponse(
            newPubId,
            changesLeft,
            endOfMonth.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"));
    }

    public async Task<PubIdChangeHistoryResponse> GetPubIdChangeHistoryAsync(
        string userId, int limit, CancellationToken ct = default)
    {
        if (limit <= 0)
        {
            limit = 20;
        }

        if (limit > 100)
        {
            limit = 100;
        }

        var changes = await repository.GetPubIdChangeHistoryAsync(userId, limit, ct);
        var history = changes
            .Select(c => new PubIdChangeHistoryItem(
                c.OldPubId,
                c.NewPubId,
                c.ChangedAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")))
            .ToList();

        return new PubIdChangeHistoryResponse(history, history.Count);
    }
}
