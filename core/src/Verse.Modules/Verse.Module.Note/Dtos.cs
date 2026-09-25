using System.Text.Json.Serialization;

namespace Verse.Module.Note;

/// <summary>Ported from Go <c>note/dto.CreateNoteRequest</c> (content ≤ 10000 chars).</summary>
public sealed record CreateNoteRequest(
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("visibility")] string Visibility,
    [property: JsonPropertyName("cw")] string? Cw,
    [property: JsonPropertyName("media_ids")] IReadOnlyList<string>? MediaIds,
    [property: JsonPropertyName("poll")] CreatePollRequest? Poll,
    [property: JsonPropertyName("parent_id")] string? ParentId,
    [property: JsonPropertyName("root_id")] string? RootId);

/// <summary>Ported from Go <c>note/dto.CreatePollRequest</c> (1-20 options).</summary>
public sealed record CreatePollRequest(
    [property: JsonPropertyName("multiple")] bool Multiple,
    [property: JsonPropertyName("expires_at")] string? ExpiresAt,
    [property: JsonPropertyName("options")] IReadOnlyList<string> Options);

/// <summary>Ported from Go <c>note/dto.UpdateNoteRequest</c>.</summary>
public sealed record UpdateNoteRequest(
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("cw")] string? Cw);

/// <summary>Ported from Go <c>note/dto.UserBasic</c>.</summary>
public sealed record UserBasic(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("pubid")] string PubId,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("display_name")] string DisplayName,
    [property: JsonPropertyName("avatar")] string Avatar);

/// <summary>Ported from Go <c>note/dto.MediaResponse</c>.</summary>
public sealed record MediaResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("url")] string Url,
    [property: JsonPropertyName("thumbnail")] string? Thumbnail,
    [property: JsonPropertyName("alt")] string? Alt,
    [property: JsonPropertyName("sensitive")] bool Sensitive);

/// <summary>Ported from Go <c>note/dto.PollOptionResult</c>.</summary>
public sealed record PollOptionResult(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("text")] string Text,
    [property: JsonPropertyName("votes")] int Votes,
    [property: JsonPropertyName("percent")] double Percent);

/// <summary>Ported from Go <c>note/dto.PollResponse</c>.</summary>
public sealed record PollResponse(
    [property: JsonPropertyName("multiple")] bool Multiple,
    [property: JsonPropertyName("expires_at")] string? ExpiresAt,
    [property: JsonPropertyName("options")] IReadOnlyList<PollOptionResult> Options,
    [property: JsonPropertyName("voted")] IReadOnlyList<string> Voted,
    [property: JsonPropertyName("total_votes")] int TotalVotes);

/// <summary>Ported from Go <c>note/dto.ReactionSummary</c>.</summary>
public sealed record ReactionSummary(
    [property: JsonPropertyName("emoji")] string Emoji,
    [property: JsonPropertyName("count")] int Count,
    [property: JsonPropertyName("users")] IReadOnlyList<string> Users);

/// <summary>Ported from Go <c>note/dto.NoteMetrics</c>.</summary>
public sealed record NoteMetrics(
    [property: JsonPropertyName("replies")] int Replies,
    [property: JsonPropertyName("reposts")] int Reposts,
    [property: JsonPropertyName("likes")] int Likes);

/// <summary>Ported from Go <c>note/dto.NoteResponse</c>.</summary>
public sealed record NoteResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("pubid")] string PubId,
    [property: JsonPropertyName("user")] UserBasic? User,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("cw")] string? Cw,
    [property: JsonPropertyName("visibility")] string Visibility,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("root_id")] string? RootId,
    [property: JsonPropertyName("parent_id")] string? ParentId,
    [property: JsonPropertyName("media")] IReadOnlyList<MediaResponse> Media,
    [property: JsonPropertyName("poll")] PollResponse? Poll,
    [property: JsonPropertyName("reactions")] IReadOnlyList<ReactionSummary> Reactions,
    [property: JsonPropertyName("metrics")] NoteMetrics Metrics,
    [property: JsonPropertyName("created_at")] string CreatedAt,
    [property: JsonPropertyName("edited_at")] string? EditedAt,
    [property: JsonPropertyName("reply_count")] int ReplyCount,
    [property: JsonPropertyName("repost_count")] int RepostCount);

/// <summary>Ported from Go <c>note/dto.ReactionRequest</c>.</summary>
public sealed record ReactionRequest(
    [property: JsonPropertyName("emoji")] string Emoji);

/// <summary>Ported from Go <c>note/dto.VoteRequest</c> (1-20 options).</summary>
public sealed record VoteRequest(
    [property: JsonPropertyName("option_ids")] IReadOnlyList<string> OptionIds);

/// <summary>Ported from Go <c>note/dto.NoteEditResponse</c>.</summary>
public sealed record NoteEditResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("cw")] string Cw,
    [property: JsonPropertyName("created_at")] string CreatedAt);

/// <summary>Ported from Go <c>note/dto.TimelineRequest</c> (query-bound, limit defaults to 20).</summary>
public sealed record TimelineRequest(int Limit, string Cursor, string Since, string Until);

/// <summary>Ported from Go <c>note/dto.NoteListResponse</c>.</summary>
public sealed record NoteListResponse(
    [property: JsonPropertyName("notes")] IReadOnlyList<NoteResponse> Notes,
    [property: JsonPropertyName("next_cursor")] string? NextCursor,
    [property: JsonPropertyName("prev_cursor")] string? PrevCursor);

/// <summary>Ported from Go <c>note/dto.TimelineNoteResponse</c>.</summary>
public sealed record TimelineNoteResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("pubid")] string PubId,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("cw")] string? Cw,
    [property: JsonPropertyName("visibility")] string Visibility,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("root_id")] string? RootId,
    [property: JsonPropertyName("parent_id")] string? ParentId,
    [property: JsonPropertyName("source")] string? Source,
    [property: JsonPropertyName("created_at")] string CreatedAt,
    [property: JsonPropertyName("updated_at")] string UpdatedAt,
    [property: JsonPropertyName("author")] UserBasic? Author,
    [property: JsonPropertyName("metrics")] NoteMetrics Metrics);

/// <summary>Ported from Go <c>note/dto.NoteSearchRequest</c> (query-bound).</summary>
public sealed record NoteSearchRequest(
    string Query,
    int Limit,
    string Cursor,
    string User,
    string Media,
    string Language);
