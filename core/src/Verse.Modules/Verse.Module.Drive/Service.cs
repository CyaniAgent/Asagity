using Verse.Shared;

namespace Verse.Module.Drive;

/// <summary>Error codes ported from Go <c>drive/handler</c>.</summary>
public static class DriveErrors
{
    public const string Unauthorized = "UNAUTHORIZED";
    public const string InternalError = "INTERNAL_ERROR";
    public const string InvalidFileId = "INVALID_FILE_ID";
    public const string FileNotFound = "FILE_NOT_FOUND";
    public const string InvalidRequest = "INVALID_REQUEST";
}

/// <summary>
/// Contract ported from Go <c>drive/service.Service</c>.
/// NOTE: the Go service takes <c>uuid.UUID</c> user ids while the user domain
/// uses string ids; the C# contract keeps <c>string userId</c> and converts at the boundary.
/// </summary>
public interface IDriveService
{
    ListFilesResponse ListFiles(string userId, ListFilesRequest request);
    FileResponse GetFile(string userId, Guid fileId);
    CreateFolderResponse CreateFolder(string userId, CreateFolderRequest request);
    FileResponse UpdateFile(string userId, Guid fileId, UpdateFileRequest request);
    void DeleteFile(string userId, Guid fileId);
    void MoveFile(string userId, Guid fileId, MoveFileRequest request);
    UsageResponse GetUsage(string userId);
}

/// <summary>DI stub: every call returns 501 until the real service lands.</summary>
public sealed class NotImplementedDriveService : IDriveService
{
    private static ModuleException Todo() =>
        new(StatusCodes.Status501NotImplemented, "DRIVE_NOT_IMPLEMENTED", "Drive service is not implemented yet.");

    public ListFilesResponse ListFiles(string userId, ListFilesRequest request) => throw Todo();
    public FileResponse GetFile(string userId, Guid fileId) => throw Todo();
    public CreateFolderResponse CreateFolder(string userId, CreateFolderRequest request) => throw Todo();
    public FileResponse UpdateFile(string userId, Guid fileId, UpdateFileRequest request) => throw Todo();
    public void DeleteFile(string userId, Guid fileId) => throw Todo();
    public void MoveFile(string userId, Guid fileId, MoveFileRequest request) => throw Todo();
    public UsageResponse GetUsage(string userId) => throw Todo();
}
