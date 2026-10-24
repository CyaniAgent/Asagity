namespace Verse.Shared;

/// <summary>
/// Authenticated caller resolved from the request context (populated by the
/// JWT middleware). Mirrors core/src/Verse.Engine/internal/platform/authz/principal.go.
/// </summary>
public sealed class CurrentUser
{
    public const string UserIdItem = "user_id";
    public const string UserPubIdItem = "user_pubid";
    public const string UserGroupItem = "user_group";
    public const string TokenScopesItem = "token_scopes";
    public const string AppIdItem = "app_id";

    public string UserId { get; init; } = string.Empty;
    public string PubId { get; init; } = string.Empty;
    public string Group { get; init; } = string.Empty;
    public string AppId { get; init; } = string.Empty;

    /// <summary>Scopes granted to a scoped application token (empty for self-acting users).</summary>
    public IReadOnlyCollection<string> GrantedScopes { get; init; } = Array.Empty<string>();

    public bool Authenticated => UserId.Length > 0;
    public bool IsAdmin => Group == Scopes.AdministratorGroupId;

    /// <summary>True when the caller acts as an application rather than as itself.</summary>
    public bool IsScopedApplication => AppId.Length > 0;

    /// <summary>Resolves the caller from the request context.</summary>
    public static CurrentUser From(HttpContext http)
    {
        static string Str(HttpContext ctx, string key) =>
            ctx.Items.TryGetValue(key, out var value) ? value as string ?? string.Empty : string.Empty;

        var scopes = Str(http, TokenScopesItem);
        return new CurrentUser
        {
            UserId = Str(http, UserIdItem),
            PubId = Str(http, UserPubIdItem),
            Group = Str(http, UserGroupItem),
            AppId = Str(http, AppIdItem),
            GrantedScopes = scopes.Length == 0
                ? Array.Empty<string>()
                : scopes.Split(' ', StringSplitOptions.RemoveEmptyEntries),
        };
    }

    /// <summary>
    /// Enforces the scope model:
    /// self-acting users hold every non-admin scope (plus admin scopes when
    /// they are administrators); scoped application tokens hold exactly their
    /// granted and expanded scopes, with admin scopes additionally gated on
    /// the administrator group.
    /// </summary>
    public bool HasScope(string name)
    {
        if (!Authenticated || !Scopes.Names.Contains(name))
        {
            return false;
        }

        if (!IsScopedApplication)
        {
            return Scopes.IsAdminScope(name) ? IsAdmin : true;
        }

        if (Scopes.IsAdminScope(name))
        {
            return IsAdmin && Scopes.Expand(GrantedScopes).Contains(name);
        }

        return Scopes.Expand(GrantedScopes).Contains(name);
    }
}
