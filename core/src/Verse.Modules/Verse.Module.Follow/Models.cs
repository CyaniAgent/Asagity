using System.Text.Json.Serialization;

namespace Verse.Module.Follow;

/// <summary>String constants ported from Go <c>follow/model.FollowStatus</c>.</summary>
public static class FollowStatus
{
    public const string Pending = "pending";
    public const string Accepted = "accepted";
    public const string Rejected = "rejected";
}

/// <summary>Entity ported from Go <c>follow/model.Follow</c> (table <c>follows</c>).</summary>
public sealed class Follow
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("follower_id")] public string FollowerId { get; set; } = string.Empty;
    [JsonPropertyName("following_id")] public string FollowingId { get; set; } = string.Empty;
    [JsonPropertyName("status")] public string Status { get; set; } = FollowStatus.Accepted;
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}
