using System.Text.Json.Serialization;

namespace Verse.Module.Auth;

/// <summary>Entity ported from Go <c>auth/model.Device</c> (table <c>auth_devices</c>).</summary>
public sealed class Device
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("user_id")] public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("device_fingerprint")] public string DeviceFingerprint { get; set; } = string.Empty;
    [JsonPropertyName("device_name")] public string DeviceName { get; set; } = string.Empty;
    [JsonPropertyName("user_agent")] public string UserAgent { get; set; } = string.Empty;
    [JsonPropertyName("ip_address")] public string IpAddress { get; set; } = string.Empty;
    [JsonPropertyName("last_seen_at")] public DateTime LastSeenAt { get; set; }
    [JsonPropertyName("trusted_at")] public DateTime? TrustedAt { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>auth/model.RefreshToken</c> (table <c>auth_refresh_tokens</c>).</summary>
public sealed class RefreshToken
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("user_id")] public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("device_id")] public string DeviceId { get; set; } = string.Empty;
    [JsonPropertyName("expires_at")] public DateTime ExpiresAt { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("revoked_at")] public DateTime? RevokedAt { get; set; }
    [JsonPropertyName("replaced_by_token_id")] public string? ReplacedByTokenId { get; set; }
}

/// <summary>Entity ported from Go <c>auth/model.EmailChallenge</c> (table <c>auth_email_challenges</c>).</summary>
public sealed class EmailChallenge
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("user_id")] public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("device_fingerprint")] public string DeviceFingerprint { get; set; } = string.Empty;
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("purpose")] public string Purpose { get; set; } = string.Empty;
    [JsonPropertyName("attempt_count")] public int AttemptCount { get; set; }
    [JsonPropertyName("cooldown_until")] public DateTime? CooldownUntil { get; set; }
    [JsonPropertyName("resend_available_at")] public DateTime? ResendAvailableAt { get; set; }
    [JsonPropertyName("expires_at")] public DateTime ExpiresAt { get; set; }
    [JsonPropertyName("verified_at")] public DateTime? VerifiedAt { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}
