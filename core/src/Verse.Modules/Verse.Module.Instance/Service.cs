using Verse.Shared;

namespace Verse.Module.Instance;

/// <summary>Error codes ported from Go <c>instance/handler</c>.</summary>
public static class InstanceErrors
{
    public const string InternalError = "INTERNAL_ERROR";
}

/// <summary>Contract ported from Go <c>instance/service.Service</c>.</summary>
public interface IInstanceService
{
    VersionResponse Version();
    MetaResponse Meta();
    IReadOnlyList<InstanceSetting> GetAllSettings();
    IReadOnlyList<DatabaseStat> GetDatabaseStats();
    SystemEnvironmentResponse SystemEnvironment();
}

/// <summary>DI stub: every call returns 501 until the real service lands.</summary>
public sealed class NotImplementedInstanceService : IInstanceService
{
    private static ModuleException Todo() =>
        new(StatusCodes.Status501NotImplemented, "INSTANCE_NOT_IMPLEMENTED", "Instance service is not implemented yet.");

    public VersionResponse Version() => throw Todo();
    public MetaResponse Meta() => throw Todo();
    public IReadOnlyList<InstanceSetting> GetAllSettings() => throw Todo();
    public IReadOnlyList<DatabaseStat> GetDatabaseStats() => throw Todo();
    public SystemEnvironmentResponse SystemEnvironment() => throw Todo();
}
