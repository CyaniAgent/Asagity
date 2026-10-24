using System.Text.Json.Serialization;
using Verse.Shared;
using Verse.Data;
using Verse.Data.Entities;
using UserEntity = Verse.Data.Entities.User;

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
    public const string UserNotFound = "USER_NOT_FOUND";
}

/// <summary>Contract ported from Go <c>user/service.Service</c>.</summary>
public interface IUserService
{
    Task<UserProfileResponse> GetMeAsync(string userId, CancellationToken ct = default);
    Task<ChangePubIdResponse> ChangePubIdAsync(string userId, string currentPubId, string newPubId, CancellationToken ct = default);
    Task<PubIdChangeHistoryResponse> GetPubIdChangeHistoryAsync(string userId, int limit, CancellationToken ct = default);
}

/// <summary>Profile of the authenticated caller.</summary>
public sealed record UserProfileResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("pub_id")] string PubId,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("avatar_url")] string AvatarUrl,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("group")] string Group);
