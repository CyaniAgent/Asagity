using Verse.Shared;

namespace Verse.Module.Follow;

/// <summary>Error codes ported from Go <c>follow/dto</c> constants and <c>follow/handler</c>.</summary>
public static class FollowErrors
{
    public const string AlreadyFollowing = "ALREADY_FOLLOWING";
    public const string FollowNotAllowed = "ERR 16611";
    public const string CannotFollowSelf = "ERR 19101";
    public const string FollowRequestNotFound = "ERR 28801";
    public const string NotFollowing = "NOT_FOLLOWING";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string InvalidId = "INVALID_ID";
    public const string FollowFailed = "FOLLOW_FAILED";
    public const string UnfollowFailed = "UNFOLLOW_FAILED";
    public const string AcceptFailed = "ACCEPT_FAILED";
    public const string RejectFailed = "REJECT_FAILED";
    public const string FetchFailed = "FETCH_FAILED";
}

/// <summary>Contract ported from Go <c>follow/service.FollowService</c>.</summary>
public interface IFollowService
{
    Follow FollowUser(string followerId, string followingId);
    void UnfollowUser(string followerId, string followingId);
    void AcceptFollowRequest(string userId, string followId);
    void RejectFollowRequest(string userId, string followId);
    (IReadOnlyList<FollowUserResponse> Users, string? NextCursor) GetFollowers(string userId, string currentUserId, string cursor, int limit);
    (IReadOnlyList<FollowUserResponse> Users, string? NextCursor) GetFollowing(string userId, string currentUserId, string cursor, int limit);
    FollowCountResponse GetFollowCount(string userId);
    IReadOnlyList<FollowUserResponse> GetPendingRequests(string userId);
    bool IsFollowing(string followerId, string followingId);
    IReadOnlyList<string> GetFollowingUserIds(string userId);
}

/// <summary>DI stub: every call returns 501 until the real service lands.</summary>
public sealed class NotImplementedFollowService : IFollowService
{
    private static ModuleException Todo() =>
        new(StatusCodes.Status501NotImplemented, "FOLLOW_NOT_IMPLEMENTED", "Follow service is not implemented yet.");

    public Follow FollowUser(string followerId, string followingId) => throw Todo();
    public void UnfollowUser(string followerId, string followingId) => throw Todo();
    public void AcceptFollowRequest(string userId, string followId) => throw Todo();
    public void RejectFollowRequest(string userId, string followId) => throw Todo();
    public (IReadOnlyList<FollowUserResponse> Users, string? NextCursor) GetFollowers(string userId, string currentUserId, string cursor, int limit) => throw Todo();
    public (IReadOnlyList<FollowUserResponse> Users, string? NextCursor) GetFollowing(string userId, string currentUserId, string cursor, int limit) => throw Todo();
    public FollowCountResponse GetFollowCount(string userId) => throw Todo();
    public IReadOnlyList<FollowUserResponse> GetPendingRequests(string userId) => throw Todo();
    public bool IsFollowing(string followerId, string followingId) => throw Todo();
    public IReadOnlyList<string> GetFollowingUserIds(string userId) => throw Todo();
}
