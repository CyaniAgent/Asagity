using Verse.Shared;

namespace Verse.Module.Drive;

/// <summary>Route registration ported from Go <c>drive/module.go</c>.</summary>
public static class DriveModule
{
    public static void AddServices(IServiceCollection services) =>
        services.AddSingleton<IDriveService, NotImplementedDriveService>();

    public static void Register(WebApplication app)
    {
        var group = app.MapGroup("/api/drive");
        group.MapGet("/files", ListFiles);
        group.MapGet("/files/{id:guid}", GetFile);
        group.MapPost("/folders", CreateFolder);
        group.MapPatch("/files/{id:guid}", UpdateFile);
        group.MapDelete("/files/{id:guid}", DeleteFile);
        group.MapPost("/files/{id:guid}/move", MoveFile);
        group.MapGet("/usage", GetUsage);
    }

    private static IResult RequireUser(HttpContext http, out CurrentUser user)
    {
        var current = CurrentUser.From(http);
        if (current is null)
        {
            user = null!;
            return ApiResults.Fail(StatusCodes.Status401Unauthorized, DriveErrors.Unauthorized, "user not authenticated");
        }
        user = current;
        return null!;
    }

    private static IResult ListFiles(
        string? parent_id, string? type, string? search, string? sort, string? order,
        int? limit, int? offset, IDriveService svc, HttpContext http)
    {
        // TODO(skeleton): confirm Go list defaults (limit/offset) when porting the service.
        var guard = RequireUser(http, out var user);
        if (guard is not null) return guard;
        try
        {
            return ApiResults.Ok(svc.ListFiles(user.UserId, new ListFilesRequest(
                Guid.TryParse(parent_id, out var pid) ? pid : null,
                type, search, sort, order, limit ?? 50, offset ?? 0)));
        }
        catch (ModuleException ex) { return ApiResults.From(ex); }
        catch (Exception ex) { return ApiResults.Fail(500, DriveErrors.InternalError, ex.Message); }
    }

    private static IResult GetFile(Guid id, IDriveService svc, HttpContext http)
    {
        var guard = RequireUser(http, out var user);
        if (guard is not null) return guard;
        try { return ApiResults.Ok(svc.GetFile(user.UserId, id)); }
        catch (ModuleException ex) { return ApiResults.From(ex); }
        catch (KeyNotFoundException) { return ApiResults.Fail(404, DriveErrors.FileNotFound, "file not found"); }
        catch (Exception ex) { return ApiResults.Fail(500, DriveErrors.InternalError, ex.Message); }
    }

    private static IResult CreateFolder(CreateFolderRequest? req, IDriveService svc, HttpContext http)
    {
        var guard = RequireUser(http, out var user);
        if (guard is not null) return guard;
        if (req is null)
            return ApiResults.Fail(400, DriveErrors.InvalidRequest, "invalid request body");
        try { return ApiResults.Ok(svc.CreateFolder(user.UserId, req)); }
        catch (ModuleException ex) { return ApiResults.From(ex); }
        catch (Exception ex) { return ApiResults.Fail(500, DriveErrors.InternalError, ex.Message); }
    }

    private static IResult UpdateFile(Guid id, UpdateFileRequest? req, IDriveService svc, HttpContext http)
    {
        var guard = RequireUser(http, out var user);
        if (guard is not null) return guard;
        if (req is null)
            return ApiResults.Fail(400, DriveErrors.InvalidRequest, "invalid request body");
        try { return ApiResults.Ok(svc.UpdateFile(user.UserId, id, req)); }
        catch (ModuleException ex) { return ApiResults.From(ex); }
        catch (Exception ex) { return ApiResults.Fail(500, DriveErrors.InternalError, ex.Message); }
    }

    private static IResult DeleteFile(Guid id, IDriveService svc, HttpContext http)
    {
        var guard = RequireUser(http, out var user);
        if (guard is not null) return guard;
        try
        {
            svc.DeleteFile(user.UserId, id);
            return ApiResults.NoContent();
        }
        catch (ModuleException ex) { return ApiResults.From(ex); }
        catch (Exception ex) { return ApiResults.Fail(500, DriveErrors.InternalError, ex.Message); }
    }

    private static IResult MoveFile(Guid id, MoveFileRequest? req, IDriveService svc, HttpContext http)
    {
        var guard = RequireUser(http, out var user);
        if (guard is not null) return guard;
        if (req is null)
            return ApiResults.Fail(400, DriveErrors.InvalidRequest, "invalid request body");
        try
        {
            svc.MoveFile(user.UserId, id, req);
            return ApiResults.Ok(new { status = "ok" });
        }
        catch (ModuleException ex) { return ApiResults.From(ex); }
        catch (Exception ex) { return ApiResults.Fail(500, DriveErrors.InternalError, ex.Message); }
    }

    private static IResult GetUsage(IDriveService svc, HttpContext http)
    {
        var guard = RequireUser(http, out var user);
        if (guard is not null) return guard;
        try { return ApiResults.Ok(svc.GetUsage(user.UserId)); }
        catch (ModuleException ex) { return ApiResults.From(ex); }
        catch (Exception ex) { return ApiResults.Fail(500, DriveErrors.InternalError, ex.Message); }
    }
}
