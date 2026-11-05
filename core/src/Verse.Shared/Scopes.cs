namespace Verse.Shared;

/// <summary>Status mirrors the markers of docs/api/permissions.md.</summary>
public static class ScopeStatus
{
    public const string Implemented = "implemented";
    public const string Partial = "partial";
    public const string Reserved = "reserved";
}

/// <summary>Minimum trust tier that may hold a scope (docs/aabp/trust.md).</summary>
public static class TrustLevel
{
    public const string Sandbox = "L1";
    public const string Sql = "L2";
    public const string Global = "L3";
}

/// <summary>One registered core scope.</summary>
public sealed record ScopeDefinition(
    string Name,
    string Description,
    string MinTrust,
    string Status);

/// <summary>
/// The core scope registry — the .NET mirror of
/// core/src/Verse.Engine/internal/platform/authz/scope.go.
/// Single source of truth: docs/api/permissions.md.
/// </summary>
public static class Scopes
{
    public const string AccountRead = "account:read";
    public const string AccountWrite = "account:write";
    public const string NotesRead = "notes:read";
    public const string NotesWrite = "notes:write";
    public const string DriveRead = "drive:read";
    public const string DriveWrite = "drive:write";
    public const string FollowRead = "follow:read";
    public const string FollowWrite = "follow:write";
    public const string BlocksRead = "blocks:read";
    public const string BlocksWrite = "blocks:write";
    public const string MutesRead = "mutes:read";
    public const string MutesWrite = "mutes:write";
    public const string AssetRead = "asset:read";
    public const string MusicRead = "music:read";
    public const string ShellExecute = "shell:execute";
    public const string TopicsRead = "topics:read";
    public const string TopicsWrite = "topics:write";
    public const string NotificationsRead = "notifications:read";
    public const string NotificationsWrite = "notifications:write";
    public const string MessagingRead = "messaging:read";
    public const string MessagingWrite = "messaging:write";
    public const string FavoritesRead = "favorites:read";
    public const string FavoritesWrite = "favorites:write";
    public const string AdminMetaRead = "admin:meta:read";
    public const string AdminSystemRead = "admin:system:read";
    public const string AdminUsersRead = "admin:users:read";
    public const string AdminUsersWrite = "admin:users:write";
    public const string AdminDriveRead = "admin:drive:read";
    public const string AdminFederationRead = "admin:federation:read";
    public const string AdminFederationWrite = "admin:federation:write";

    /// <summary>User-group id that marks administrator accounts.</summary>
    public const string AdministratorGroupId = "admin";

    public static IReadOnlyList<ScopeDefinition> Registry { get; } =
    [
        new(AccountRead, "查看自身账户与公开资料", TrustLevel.Sandbox, ScopeStatus.Implemented),
        new(AccountWrite, "修改自身资料（含 pubid）", TrustLevel.Sandbox, ScopeStatus.Implemented),
        new(NotesRead, "读取动态、时间线、投票结果、搜索", TrustLevel.Sandbox, ScopeStatus.Implemented),
        new(NotesWrite, "发布/编辑/删除动态、回应、投票", TrustLevel.Sandbox, ScopeStatus.Implemented),
        new(DriveRead, "列取文件、查看用量", TrustLevel.Sandbox, ScopeStatus.Implemented),
        new(DriveWrite, "建夹/改名/移动/删除/上传", TrustLevel.Sandbox, ScopeStatus.Partial),
        new(FollowRead, "查看关注者/正在关注/计数/待处理请求", TrustLevel.Sandbox, ScopeStatus.Implemented),
        new(FollowWrite, "关注/取关/处理关注请求", TrustLevel.Sandbox, ScopeStatus.Implemented),
        new(BlocksRead, "查看黑名单（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(BlocksWrite, "编辑黑名单（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(MutesRead, "查看屏蔽列表（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(MutesWrite, "编辑屏蔽列表（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(AssetRead, "远端图标代理", TrustLevel.Sandbox, ScopeStatus.Implemented),
        new(MusicRead, "音质标签查询", TrustLevel.Sandbox, ScopeStatus.Implemented),
        new(ShellExecute, "执行 Termity 后端命令", TrustLevel.Global, ScopeStatus.Partial),
        new(TopicsRead, "话题发现/趋势（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(TopicsWrite, "话题运营操作（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(NotificationsRead, "查看通知（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(NotificationsWrite, "管理通知（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(MessagingRead, "查看私信（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(MessagingWrite, "发送/删除私信（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(FavoritesRead, "查看收藏（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(FavoritesWrite, "编辑收藏（预留）", TrustLevel.Sandbox, ScopeStatus.Reserved),
        new(AdminMetaRead, "查看实例元信息", TrustLevel.Global, ScopeStatus.Implemented),
        new(AdminSystemRead, "查看系统环境与数据库统计", TrustLevel.Global, ScopeStatus.Implemented),
        new(AdminUsersRead, "查看用户管理信息（预留）", TrustLevel.Global, ScopeStatus.Reserved),
        new(AdminUsersWrite, "用户管理操作（预留）", TrustLevel.Global, ScopeStatus.Reserved),
        new(AdminDriveRead, "查看用户网盘信息（预留）", TrustLevel.Global, ScopeStatus.Reserved),
        new(AdminFederationRead, "查看联邦信息（预留）", TrustLevel.Global, ScopeStatus.Reserved),
        new(AdminFederationWrite, "联邦管理操作（预留）", TrustLevel.Global, ScopeStatus.Reserved),
    ];

    /// <summary>All registered scope names.</summary>
    public static IReadOnlySet<string> Names { get; } =
        Registry.Select(d => d.Name).ToHashSet(StringComparer.Ordinal);

    /// <summary>Looks a scope definition up by name.</summary>
    public static ScopeDefinition? ByName(string name) =>
        Registry.FirstOrDefault(d => d.Name == name);

    /// <summary>Whether the scope is part of the admin family (independent from user scopes).</summary>
    public static bool IsAdminScope(string name) =>
        name.StartsWith("admin:", StringComparison.Ordinal);

    /// <summary>
    /// Expands a granted set: within one domain, write implies read
    /// ("notes:write" → "notes:read"). Unknown names pass through.
    /// </summary>
    public static HashSet<string> Expand(IEnumerable<string> granted)
    {
        var result = new HashSet<string>(StringComparer.Ordinal);
        foreach (var raw in granted)
        {
            var name = raw.Trim();
            if (name.Length == 0)
            {
                continue;
            }

            result.Add(name);
            var idx = name.LastIndexOf(':');
            if (idx > 0 && name[(idx + 1)..] == "write")
            {
                result.Add(name[..idx] + ":read");
            }
        }

        return result;
    }
}
