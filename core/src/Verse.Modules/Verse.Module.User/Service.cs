using Verse.Shared;

namespace Verse.Module.User;

/// <summary>Error codes ported from Go <c>user/handler</c>.</summary>
public static class UserErrors
{
    public const string Unauthorized = "UNAUTHORIZED";
    public const string InvalidRequest = "INVALID_REQUEST";
    public const string MissingPubId = "MISSING_PUBID";
    public const string InvalidPubIdFormat = "INVALID_PUBID_FORMAT";
    public const string SamePubId = "SAME_PUBID";
    public const string PubIdConflict = "PUBID_CONFLICT";
    public const string RateLimited = "RATE_LIMITED";
    public const string InternalError = "INTERNAL_ERROR";
}

/// <summary>Contract ported from Go <c>user/service.Service</c>.</summary>
public interface IUserService
{
    MessageResponse MePlaceholder();
    ChangePubIdResponse ChangePubId(string userId, string currentPubId, string newPubId);
    PubIdChangeHistoryResponse GetPubIdChangeHistory(string userId, int limit);
}

/// <summary>DI stub: every call returns 501 until the real service lands.</summary>
public sealed class NotImplementedUserService : IUserService
{
    private static ModuleException Todo() =>
        new(StatusCodes.Status501NotImplemented, "USER_NOT_IMPLEMENTED", "User service is not implemented yet.");

    public MessageResponse MePlaceholder() => throw Todo();
    public ChangePubIdResponse ChangePubId(string userId, string currentPubId, string newPubId) => throw Todo();
    public PubIdChangeHistoryResponse GetPubIdChangeHistory(string userId, int limit) => throw Todo();
}
