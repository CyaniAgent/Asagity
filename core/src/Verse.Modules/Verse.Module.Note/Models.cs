using System.Text.Json.Serialization;

namespace Verse.Module.Note;

/// <summary>String constants ported from Go <c>note/model</c> enums (wire format stays lowercase).</summary>
public static class NoteTypes
{
    public const string Note = "note";
    public const string Reply = "reply";
    public const string Repost = "repost";
    public const string Quote = "quote";
}

public static class NoteVisibilities
{
    public const string Public = "public";
    public const string Unlisted = "unlisted";
    public const string Private = "private";
    public const string Direct = "direct";
}

/// <summary>Entity ported from Go <c>note/model.Note</c> (table <c>notes</c>).</summary>
public sealed class Note
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("pubid")] public string PubId { get; set; } = string.Empty;
    [JsonPropertyName("user_id")] public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("root_id")] public string? RootId { get; set; }
    [JsonPropertyName("parent_id")] public string? ParentId { get; set; }
    [JsonPropertyName("type")] public string Type { get; set; } = NoteTypes.Note;
    [JsonPropertyName("content")] public string Content { get; set; } = string.Empty;
    [JsonPropertyName("cw")] public string? Cw { get; set; }
    [JsonPropertyName("visibility")] public string Visibility { get; set; } = NoteVisibilities.Public;
    [JsonPropertyName("source")] public string? Source { get; set; }
    [JsonPropertyName("is_draft")] public bool IsDraft { get; set; }
    [JsonPropertyName("is_deleted")] public bool IsDeleted { get; set; }
    [JsonPropertyName("deleted_at")] public DateTime? DeletedAt { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("updated_at")] public DateTime UpdatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>note/model.NoteEdit</c> (table <c>note_edits</c>).</summary>
public sealed class NoteEdit
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("note_id")] public string NoteId { get; set; } = string.Empty;
    [JsonPropertyName("content")] public string Content { get; set; } = string.Empty;
    [JsonPropertyName("cw")] public string? Cw { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>note/model.NoteReaction</c> (table <c>note_reactions</c>).</summary>
public sealed class NoteReaction
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("note_id")] public string NoteId { get; set; } = string.Empty;
    [JsonPropertyName("user_id")] public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("emoji")] public string Emoji { get; set; } = string.Empty;
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>note/model.NoteMedia</c> (table <c>note_media</c>).</summary>
public sealed class NoteMedia
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("note_id")] public string NoteId { get; set; } = string.Empty;
    [JsonPropertyName("file_id")] public string FileId { get; set; } = string.Empty;
    [JsonPropertyName("type")] public string Type { get; set; } = string.Empty;
    [JsonPropertyName("alt")] public string? Alt { get; set; }
    [JsonPropertyName("is_sensitive")] public bool IsSensitive { get; set; }
    [JsonPropertyName("position")] public int Position { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>note/model.Poll</c> (table <c>polls</c>).</summary>
public sealed class Poll
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("note_id")] public string NoteId { get; set; } = string.Empty;
    [JsonPropertyName("multiple")] public bool Multiple { get; set; }
    [JsonPropertyName("expires_at")] public DateTime? ExpiresAt { get; set; }
    [JsonPropertyName("hide_until")] public DateTime? HideUntil { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>note/model.PollOption</c> (table <c>poll_options</c>).</summary>
public sealed class PollOption
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("poll_id")] public string PollId { get; set; } = string.Empty;
    [JsonPropertyName("text")] public string Text { get; set; } = string.Empty;
    [JsonPropertyName("votes")] public int Votes { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}

/// <summary>Entity ported from Go <c>note/model.PollVote</c> (table <c>poll_votes</c>).</summary>
public sealed class PollVote
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("poll_id")] public string PollId { get; set; } = string.Empty;
    [JsonPropertyName("option_id")] public string OptionId { get; set; } = string.Empty;
    [JsonPropertyName("user_id")] public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
}
