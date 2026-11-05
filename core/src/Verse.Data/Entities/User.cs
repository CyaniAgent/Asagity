using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Verse.Data.Entities;

/// <summary>Entity mapped to the <c>users</c> table (Go/GORM compatible).</summary>
[Table("users")]
public sealed class User
{
    [Key]
    [Column("id")]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Column("pub_id")]
    [MaxLength(30)]
    public string PubId { get; set; } = string.Empty;

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("username")]
    [MaxLength(64)]
    public string Username { get; set; } = string.Empty;

    [Column("email")]
    [MaxLength(320)]
    public string? Email { get; set; }

    [Column("passwd_hash")]
    public string PasswdHash { get; set; } = string.Empty;

    [Column("avatar_url")]
    public string AvatarUrl { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("user_group_id")]
    [MaxLength(64)]
    public string UserGroupId { get; set; } = string.Empty;

    [Column("follow_requests_enabled")]
    public bool FollowRequestsEnabled { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

/// <summary>Entity mapped to the <c>user_groups</c> table.</summary>
[Table("user_groups")]
public sealed class UserGroup
{
    [Key]
    [Column("id")]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("code")]
    [MaxLength(64)]
    public string Code { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

/// <summary>Entity mapped to the <c>user_pubid_changes</c> table.</summary>
[Table("user_pubid_changes")]
public sealed class PubIdChange
{
    [Key]
    [Column("id")]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Column("user_id")]
    [MaxLength(64)]
    public string UserId { get; set; } = string.Empty;

    [Column("old_pub_id")]
    [MaxLength(30)]
    public string OldPubId { get; set; } = string.Empty;

    [Column("new_pub_id")]
    [MaxLength(30)]
    public string NewPubId { get; set; } = string.Empty;

    [Column("changed_at")]
    public DateTime ChangedAt { get; set; }
}
