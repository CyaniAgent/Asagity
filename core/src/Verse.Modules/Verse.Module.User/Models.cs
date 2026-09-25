using System.Text.Json.Serialization;

namespace Verse.Module.User;

/// <summary>Entity ported from Go <c>user/model.User</c> (table <c>users</c>).</summary>
public sealed class User
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("pub_id")] public string PubId { get; set; } = string.Empty;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("username")] public string Username { get; set; } = string.Empty;
    [JsonPropertyName("email")] public string? Email { get; set; }
    [JsonPropertyName("avatar_url")] public string AvatarUrl { get; set; } = string.Empty;
    [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
    [JsonPropertyName("user_group_id")] public string UserGroupId { get; set; } = string.Empty;
    [JsonPropertyName("follow_requests_enabled")] public bool FollowRequestsEnabled { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>user/model.UserGroup</c> (table <c>user_groups</c>).</summary>
public sealed class UserGroup
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("code")] public string Code { get; set; } = string.Empty;
    [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>user/model.PubIDChange</c> (table <c>user_pubid_changes</c>).</summary>
public sealed class PubIdChange
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("user_id")] public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("old_pub_id")] public string OldPubId { get; set; } = string.Empty;
    [JsonPropertyName("new_pub_id")] public string NewPubId { get; set; } = string.Empty;
    [JsonPropertyName("changed_at")] public DateTime ChangedAt { get; set; }
}
