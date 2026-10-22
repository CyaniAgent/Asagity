using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Verse.Data.Entities;

namespace Verse.Data;

/// <summary>
/// The Asagity data context. Entity mappings mirror the Go/GORM schema
/// column-for-column so the .NET API and the Go engine can share one
/// database during the migration window.
/// </summary>
public sealed class VerseDbContext(DbContextOptions<VerseDbContext> options) : DbContext(options)
{
    public DbSet<InstanceSetting> InstanceSettings => Set<InstanceSetting>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserGroup> UserGroups => Set<UserGroup>();
    public DbSet<PubIdChange> PubIdChanges => Set<PubIdChange>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InstanceSetting>(entity =>
        {
            entity.ToTable("instance_settings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Key).HasColumnName("key").HasMaxLength(255);
            entity.Property(e => e.Value).HasColumnName("value");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.HasIndex(e => e.Key).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(64);
            entity.Property(e => e.PubId).HasColumnName("pub_id").HasMaxLength(30);
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255);
            entity.Property(e => e.Username).HasColumnName("username").HasMaxLength(64);
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(320);
            entity.Property(e => e.PasswdHash).HasColumnName("passwd_hash");
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.UserGroupId).HasColumnName("user_group_id").HasMaxLength(64);
            entity.Property(e => e.FollowRequestsEnabled).HasColumnName("follow_requests_enabled");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasConversion(DateTimeConverters.UtcText);
            entity.HasIndex(e => e.PubId).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
        });

        modelBuilder.Entity<UserGroup>(entity =>
        {
            entity.ToTable("user_groups");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(64);
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255);
            entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(64);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasConversion(DateTimeConverters.UtcText);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<PubIdChange>(entity =>
        {
            // GORM names this table "pub_id_changes" (not "user_pubid_changes").
            entity.ToTable("pub_id_changes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(64);
            entity.Property(e => e.UserId).HasColumnName("user_id").HasMaxLength(64);
            entity.Property(e => e.OldPubId).HasColumnName("old_pub_id").HasMaxLength(30);
            entity.Property(e => e.NewPubId).HasColumnName("new_pub_id").HasMaxLength(30);
            entity.Property(e => e.ChangedAt).HasColumnName("changed_at").HasConversion(DateTimeConverters.UtcText);
        });
    }
}
