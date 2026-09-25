using Verse.Shared;

namespace Verse.Module.Note;

/// <summary>Route registration ported from Go <c>note/module.go</c>.</summary>
public static class NoteModule
{
    public static void AddServices(IServiceCollection services) =>
        services.AddSingleton<INoteService, NotImplementedNoteService>();

    public static void Register(WebApplication app)
    {
        app.MapPost("/api/notes", (CreateNoteRequest? req, INoteService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                if (req is null)
                    throw new ModuleException(400, NoteErrors.InvalidContent, "Invalid request body");
                return ApiResults.Created(svc.CreateNote(req, user.UserId));
            }, NoteErrors.CreateFailed));

        app.MapGet("/api/notes/{id}", (string id, INoteService svc, HttpContext http) =>
            Guard(() =>
            {
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, NoteErrors.InvalidId, "Note ID required");
                var current = CurrentUser.From(http)?.UserId ?? string.Empty;
                try
                {
                    return ApiResults.Ok(svc.GetNoteDetail(id, current));
                }
                catch (ModuleException ex) when (ex.Code == NoteErrors.NoteNotFound)
                {
                    return ApiResults.Fail(404, ex.Code, ex.Message);
                }
                catch (ModuleException ex) when (ex.Code == NoteErrors.NoteDeleted)
                {
                    return ApiResults.Fail(410, ex.Code, ex.Message);
                }
                catch (ModuleException ex) when (ex.Code == NoteErrors.NoteForbidden)
                {
                    return ApiResults.Fail(403, ex.Code, ex.Message);
                }
            }, NoteErrors.FetchFailed));

        app.MapPatch("/api/notes/{id}", (string id, UpdateNoteRequest? req, INoteService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, NoteErrors.InvalidId, "Note ID required");
                if (req is null)
                    throw new ModuleException(400, NoteErrors.InvalidContent, "Invalid request body");
                return ApiResults.Ok(svc.UpdateNote(id, user.UserId, req));
            }, NoteErrors.UpdateFailed));

        app.MapDelete("/api/notes/{id}", (string id, INoteService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, NoteErrors.InvalidId, "Note ID required");
                svc.DeleteNote(id, user.UserId);
                return ApiResults.Ok(new { status = "ok" });
            }, NoteErrors.DeleteFailed));

        app.MapGet("/api/timeline/{type}", (string type, int? limit, string? cursor, string? since, string? until, INoteService svc, HttpContext http) =>
            Guard(() =>
            {
                var current = CurrentUser.From(http)?.UserId ?? string.Empty;
                var (notes, next) = svc.ListTimeline(type, current,
                    new TimelineRequest(limit is > 0 ? limit.Value : 20, cursor ?? string.Empty, since ?? string.Empty, until ?? string.Empty));
                return ApiResults.Ok(new { notes, next_cursor = next });
            }, NoteErrors.ListFailed));

        app.MapPost("/api/notes/{id}/react", (string id, ReactionRequest? req, INoteService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, NoteErrors.InvalidId, "Note ID required");
                if (req is null || string.IsNullOrEmpty(req.Emoji))
                    throw new ModuleException(400, NoteErrors.InvalidRequest, "Invalid request body");
                svc.AddReaction(id, user.UserId, req.Emoji);
                return ApiResults.Ok(new { status = "ok" });
            }, NoteErrors.ReactionFailed));

        // Go reads the emoji from the query string and answers {status: unreacted}.
        app.MapDelete("/api/notes/{id}/react", (string id, string? emoji, INoteService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, NoteErrors.InvalidId, "Note ID required");
                svc.RemoveReaction(id, user.UserId, emoji ?? string.Empty);
                return ApiResults.Ok(new { status = "unreacted" });
            }, NoteErrors.ReactionFailed));

        app.MapPost("/api/notes/{id}/vote", (string id, VoteRequest? req, INoteService svc, HttpContext http) =>
            Guard(() =>
            {
                var user = RequireUser(http);
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, NoteErrors.InvalidId, "Note ID required");
                if (req is null || req.OptionIds.Count == 0)
                    throw new ModuleException(400, NoteErrors.InvalidRequest, "Invalid request body");
                svc.VoteOnPoll(id, user.UserId, req.OptionIds);
                return ApiResults.Ok(new { status = "ok" });
            }, NoteErrors.VoteFailed));

        app.MapGet("/api/notes/{id}/poll", (string id, INoteService svc, HttpContext http) =>
            Guard(() =>
            {
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, NoteErrors.InvalidId, "Note ID required");
                var current = CurrentUser.From(http)?.UserId ?? string.Empty;
                try
                {
                    return ApiResults.Ok(svc.GetPollResults(id, current));
                }
                catch (ModuleException ex) when (ex.Code == NoteErrors.PollNotFound)
                {
                    return ApiResults.Fail(404, ex.Code, ex.Message);
                }
            }, NoteErrors.FetchFailed));

        app.MapGet("/api/notes/{id}/edits", (string id, INoteService svc) =>
            Guard(() =>
            {
                if (string.IsNullOrEmpty(id))
                    throw new ModuleException(400, NoteErrors.InvalidId, "Note ID required");
                return ApiResults.Ok(svc.GetNoteEdits(id));
            }, NoteErrors.FetchFailed));

        app.MapGet("/api/search/notes", (string? q, int? limit, string? cursor, string? user, string? media, string? lang, INoteService svc) =>
            Guard(() =>
            {
                if (string.IsNullOrEmpty(q))
                    throw new ModuleException(400, NoteErrors.InvalidQuery, "Search query required");
                return ApiResults.Ok(svc.SearchNotes(new NoteSearchRequest(
                    q, limit is > 0 ? limit.Value : 20, cursor ?? string.Empty,
                    user ?? string.Empty, media ?? string.Empty, lang ?? string.Empty)));
            }, NoteErrors.SearchFailed));

        app.MapGet("/api/search/suggest", (string? q, int? limit, INoteService svc) =>
            Guard(() =>
            {
                if (string.IsNullOrEmpty(q))
                    throw new ModuleException(400, NoteErrors.InvalidQuery, "Search query required");
                return ApiResults.Ok(svc.SuggestSearch(q, limit is > 0 ? limit.Value : 10));
            }, NoteErrors.SuggestFailed));

        app.MapGet("/api/search/notes/regexp", (string? pattern, int? limit, INoteService svc) =>
            Guard(() =>
            {
                if (string.IsNullOrEmpty(pattern))
                    throw new ModuleException(400, NoteErrors.InvalidPattern, "Regex pattern required");
                return ApiResults.Ok(svc.SearchNotesRegexp(pattern, limit is > 0 ? limit.Value : 20));
            }, NoteErrors.SearchFailed));
    }

    private static CurrentUser RequireUser(HttpContext http) =>
        CurrentUser.From(http)
        ?? throw new ModuleException(401, NoteErrors.Unauthorized, "User not authenticated");

    private static IResult Guard(Func<IResult> call, string fallbackCode)
    {
        try
        {
            return call();
        }
        catch (ModuleException ex)
        {
            return ApiResults.From(ex);
        }
        catch (Exception ex)
        {
            return ApiResults.Fail(500, fallbackCode, ex.Message);
        }
    }
}
