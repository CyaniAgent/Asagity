using System.Text.Json.Serialization;

namespace Verse.Module.Drive;

/// <summary>String constants ported from Go <c>drive/model</c> enums (wire format stays lowercase).</summary>
public static class DriveFileTypes
{
    public const string Folder = "folder";
    public const string File = "file";
}

public static class DriveVisibility
{
    public const string Private = "private";
    public const string Public = "public";
    public const string Instance = "instance";
}

public static class DriveStorageBackends
{
    public const string Local = "local";
    public const string S3 = "s3";
    public const string WebDav = "webdav";
}

/// <summary>Entity ported from Go <c>drive/model.DriveFile</c> (table <c>drive_files</c>).</summary>
public sealed class DriveFile
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("user_id")] public Guid UserId { get; set; }
    [JsonPropertyName("parent_id")] public Guid? ParentId { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("type")] public string Type { get; set; } = DriveFileTypes.File;
    [JsonPropertyName("mime_type")] public string MimeType { get; set; } = string.Empty;
    [JsonPropertyName("size")] public long Size { get; set; }
    [JsonPropertyName("hash")] public string Hash { get; set; } = string.Empty;
    [JsonPropertyName("storage_backend")] public string StorageBackend { get; set; } = DriveStorageBackends.Local;
    [JsonPropertyName("storage_key")] public string StorageKey { get; set; } = string.Empty;
    [JsonPropertyName("thumbnail_key")] public string ThumbnailKey { get; set; } = string.Empty;
    [JsonPropertyName("visibility")] public string Visibility { get; set; } = DriveVisibility.Private;
    [JsonPropertyName("is_deleted")] public bool IsDeleted { get; set; }
    [JsonPropertyName("deleted_at")] public DateTime? DeletedAt { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("updated_at")] public DateTime UpdatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>drive/model.DriveUsage</c> (table <c>drive_usage</c>).</summary>
public sealed class DriveUsage
{
    [JsonPropertyName("user_id")] public Guid UserId { get; set; }
    [JsonPropertyName("total_files")] public long TotalFiles { get; set; }
    [JsonPropertyName("total_folders")] public long TotalFolders { get; set; }
    [JsonPropertyName("used_bytes")] public long UsedBytes { get; set; }
    [JsonPropertyName("max_bytes")] public long MaxBytes { get; set; } = 17179869184;
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("updated_at")] public DateTime UpdatedAt { get; set; }
}
