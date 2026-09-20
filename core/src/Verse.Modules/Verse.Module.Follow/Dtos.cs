using System.Text.Json.Serialization;

namespace Verse.Module.Follow;

/// <summary>Ported from Go <c>follow/dto.UserBasic</c>.</summary>
public sealed record UserBasic(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("pub_id")] string PubId,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("display_name")] string DisplayName,
    [property: JsonPropertyName("avatar")] string Avatar);

/// <summary>Ported from Go <c>follow/dto.FollowResponse</c>.</summary>
public sealed record FollowResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("follower")] UserBasic Follower,
    [property: JsonPropertyName("following")] UserBasic Following,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("created_at")] string CreatedAt);

/// <summary>Ported from Go <c>follow/dto.FollowUserResponse</c> (list item).</summary>
public sealed record FollowUserResponse(
    [property: JsonPropertyName("user")] UserBasic User,
    [property: JsonPropertyName("followed")] bool Followed,
    [property: JsonPropertyName("following")] bool Following);

/// <summary>Ported from Go <c>follow/dto.FollowListResponse</c>.</summary>
public sealed record FollowListResponse(
    [property: JsonPropertyName("followers")] IReadOnlyList<FollowResponse> Followers,
    [property: JsonPropertyName("following")] IReadOnlyList<FollowResponse> Following,
    [property: JsonPropertyName("cursor")] string? Cursor);

/// <summary>Ported from Go <c>follow/dto.PaginationRequest</c>.</summary>
public sealed record PaginationRequest(
    [property: JsonPropertyName("cursor")] string Cursor,
    [property: JsonPropertyName("limit")] int Limit);

/// <summary>Ported from Go <c>follow/dto.FollowCountResponse</c>.</summary>
public sealed record FollowCountResponse(
    [property: JsonPropertyName("followers_count")] int FollowersCount,
    [property: JsonPropertyName("following_count")] int FollowingCount);
