using System.Text.Json.Serialization;

namespace Verse.Module.User;

public sealed record MessageResponse(
    [property: JsonPropertyName("message")] string Message);

/// <summary>Ported from Go <c>user/dto.ChangePubIDRequest</c>.</summary>
public sealed record ChangePubIdRequest(
    [property: JsonPropertyName("new_pub_id")] string NewPubId);

/// <summary>Ported from Go <c>user/dto.ChangePubIDResponse</c>.</summary>
public sealed record ChangePubIdResponse(
    [property: JsonPropertyName("pub_id")] string PubId,
    [property: JsonPropertyName("changes_left")] int ChangesLeft,
    [property: JsonPropertyName("reset_date")] string ResetDate);

/// <summary>Ported from Go <c>user/dto.PubIDChangeHistoryItem</c>.</summary>
public sealed record PubIdChangeHistoryItem(
    [property: JsonPropertyName("old_pub_id")] string OldPubId,
    [property: JsonPropertyName("new_pub_id")] string NewPubId,
    [property: JsonPropertyName("changed_at")] string ChangedAt);

/// <summary>Ported from Go <c>user/dto.PubIDChangeHistoryResponse</c>.</summary>
public sealed record PubIdChangeHistoryResponse(
    [property: JsonPropertyName("history")] IReadOnlyList<PubIdChangeHistoryItem> History,
    [property: JsonPropertyName("total")] int Total);
