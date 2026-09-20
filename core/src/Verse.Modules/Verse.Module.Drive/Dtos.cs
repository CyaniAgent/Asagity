using System.Text.Json.Serialization;

namespace Verse.Module.Drive;

/// <summary>Ported from Go <c>drive/dto.FileResponse</c>.</summary>
public sealed record FileResponse(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("parent_id")] Guid? ParentId,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("mime_type")] string? MimeType,
    [property: JsonPropertyName("size")] long Size,
    [property: JsonPropertyName("hash")] string? Hash,
    [property: JsonPropertyName("storage_backend")] string StorageBackend,
    [property: JsonPropertyName("visibility")] string Visibility,
    [property: JsonPropertyName("created_at")] DateTime CreatedAt,
    [property: JsonPropertyName("updated_at")] DateTime UpdatedAt);

/// <summary>Ported from Go <c>drive/dto.FolderResponse</c>.</summary>
public sealed record FolderResponse(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("parent_id")] Guid? ParentId,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("created_at")] DateTime CreatedAt,
    [property: JsonPropertyName("updated_at")] DateTime UpdatedAt);

/// <summary>Ported from Go <c>drive/dto.ListFilesRequest</c> (query-bound).</summary>
public sealed record ListFilesRequest(
    Guid? ParentId,
    string? Type,
    string? Search,
    string? Sort,
    string? Order,
    int Limit,
    int Offset);

/// <summary>Ported from Go <c>drive/dto.ListFilesResponse</c>.</summary>
public sealed record ListFilesResponse(
    [property: JsonPropertyName("files")] IReadOnlyList<FileResponse> Files,
    [property: JsonPropertyName("folders")] IReadOnlyList<FolderResponse> Folders,
    [property: JsonPropertyName("total")] long Total,
    [property: JsonPropertyName("has_more")] bool HasMore);

/// <summary>Ported from Go <c>drive/dto.CreateFolderRequest</c>.</summary>
public sealed record CreateFolderRequest(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("parent_id")] Guid? ParentId);

/// <summary>Ported from Go <c>drive/dto.CreateFolderResponse</c>.</summary>
public sealed record CreateFolderResponse(
    [property: JsonPropertyName("folder")] FolderResponse Folder);

/// <summary>Ported from Go <c>drive/dto.UpdateFileRequest</c>.</summary>
public sealed record UpdateFileRequest(
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("parent_id")] Guid? ParentId,
    [property: JsonPropertyName("visibility")] string? Visibility);

/// <summary>Ported from Go <c>drive/dto.MoveFileRequest</c>.</summary>
public sealed record MoveFileRequest(
    [property: JsonPropertyName("target_parent_id")] Guid? TargetParentId);

/// <summary>Ported from Go <c>drive/dto.UsageResponse</c>.</summary>
public sealed record UsageResponse(
    [property: JsonPropertyName("used_bytes")] long UsedBytes,
    [property: JsonPropertyName("max_bytes")] long MaxBytes,
    [property: JsonPropertyName("used_percent")] double UsedPercent,
    [property: JsonPropertyName("total_files")] long TotalFiles,
    [property: JsonPropertyName("total_folders")] long TotalFolders);

/// <summary>Ported from Go <c>drive/dto.UploadInitRequest</c> (chunked-upload handshake).</summary>
public sealed record UploadInitRequest(
    [property: JsonPropertyName("filename")] string Filename,
    [property: JsonPropertyName("size")] long Size,
    [property: JsonPropertyName("mime_type")] string MimeType,
    [property: JsonPropertyName("parent_id")] Guid? ParentId,
    [property: JsonPropertyName("visibility")] string Visibility,
    [property: JsonPropertyName("chunked")] bool Chunked,
    [property: JsonPropertyName("chunk_size")] long? ChunkSize,
    [property: JsonPropertyName("total_chunks")] int? TotalChunks);

/// <summary>Ported from Go <c>drive/dto.UploadInitResponse</c>.</summary>
public sealed record UploadInitResponse(
    [property: JsonPropertyName("file_id")] Guid FileId,
    [property: JsonPropertyName("upload_id")] Guid UploadId,
    [property: JsonPropertyName("chunk_size")] long ChunkSize,
    [property: JsonPropertyName("expires_at")] DateTime ExpiresAt);
