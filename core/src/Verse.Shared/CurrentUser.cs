namespace Verse.Shared;

/// <summary>Authenticated caller resolved from <c>HttpContext.Items</c> (set by JwtMiddleware).</summary>
public sealed record CurrentUser(string UserId, string PubId)
{
    public static CurrentUser? From(HttpContext http)
    {
        if (http.Items["user_id"] is string userId && userId.Length > 0)
            return new CurrentUser(userId, http.Items["user_pubid"] as string ?? string.Empty);
        return null;
    }
}
