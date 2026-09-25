using Verse.Shared;

namespace Verse.Module.Note;

/// <summary>Error codes ported from Go <c>note/dto</c> constants and <c>note/handler</c>.</summary>
public static class NoteErrors
{
    public const string NoteNotFound = "ERR 17311";
    public const string NoteDeleted = "ERR 21101";
    public const string NoteForbidden = "ERR 20000";
    public const string InvalidContent = "ERR 26110";
    public const string InvalidPoll = "ERR 26120";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string InvalidId = "INVALID_ID";
    public const string InvalidRequest = "INVALID_REQUEST";
    public const string InvalidQuery = "INVALID_QUERY";
    public const string InvalidPattern = "INVALID_PATTERN";
    public const string PollNotFound = "POLL_NOT_FOUND";
    public const string CreateFailed = "CREATE_FAILED";
    public const string UpdateFailed = "UPDATE_FAILED";
    public const string DeleteFailed = "DELETE_FAILED";
    public const string ListFailed = "LIST_FAILED";
    public const string FetchFailed = "FETCH_FAILED";
    public const string ReactionFailed = "REACTION_FAILED";
    public const string VoteFailed = "VOTE_FAILED";
    public const string SearchFailed = "SEARCH_FAILED";
    public const string SuggestFailed = "SUGGEST_FAILED";
    public const string SearchUnavailable = "SEARCH_UNAVAILABLE";
}

/// <summary>Contract ported from Go <c>note/service.NoteService</c> public surface.</summary>
public interface INoteService
{
    Note CreateNote(CreateNoteRequest request, string userId);
    Note UpdateNote(string id, string userId, UpdateNoteRequest request);
    void DeleteNote(string id, string userId);
    NoteResponse GetNoteDetail(string id, string currentUserId);
    IReadOnlyList<NoteEditResponse> GetNoteEdits(string noteId);
    (IReadOnlyList<TimelineNoteResponse> Notes, string? NextCursor) ListTimeline(string timelineType, string userId, TimelineRequest request);
    void AddReaction(string noteId, string userId, string emoji);
    void RemoveReaction(string noteId, string userId, string emoji);
    IReadOnlyList<Note> SearchNotes(NoteSearchRequest request);
    IReadOnlyList<string> SuggestSearch(string query, int limit);
    IReadOnlyList<Note> SearchNotesRegexp(string pattern, int limit);
    Poll CreatePoll(string noteId, CreatePollRequest request);
    void VoteOnPoll(string noteId, string userId, IReadOnlyList<string> optionIds);
    PollResponse GetPollResults(string noteId, string userId);
}

/// <summary>DI stub: every call returns 501 until the real service lands.</summary>
public sealed class NotImplementedNoteService : INoteService
{
    private static ModuleException Todo() =>
        new(StatusCodes.Status501NotImplemented, "NOTE_NOT_IMPLEMENTED", "Note service is not implemented yet.");

    public Note CreateNote(CreateNoteRequest request, string userId) => throw Todo();
    public Note UpdateNote(string id, string userId, UpdateNoteRequest request) => throw Todo();
    public void DeleteNote(string id, string userId) => throw Todo();
    public NoteResponse GetNoteDetail(string id, string currentUserId) => throw Todo();
    public IReadOnlyList<NoteEditResponse> GetNoteEdits(string noteId) => throw Todo();
    public (IReadOnlyList<TimelineNoteResponse> Notes, string? NextCursor) ListTimeline(string timelineType, string userId, TimelineRequest request) => throw Todo();
    public void AddReaction(string noteId, string userId, string emoji) => throw Todo();
    public void RemoveReaction(string noteId, string userId, string emoji) => throw Todo();
    public IReadOnlyList<Note> SearchNotes(NoteSearchRequest request) => throw Todo();
    public IReadOnlyList<string> SuggestSearch(string query, int limit) => throw Todo();
    public IReadOnlyList<Note> SearchNotesRegexp(string pattern, int limit) => throw Todo();
    public Poll CreatePoll(string noteId, CreatePollRequest request) => throw Todo();
    public void VoteOnPoll(string noteId, string userId, IReadOnlyList<string> optionIds) => throw Todo();
    public PollResponse GetPollResults(string noteId, string userId) => throw Todo();
}
