using Verse.Shared;
using Verse.Data;
using Verse.Data.Entities;

namespace Verse.Module.Instance;

/// <summary>Error codes ported from Go <c>instance/handler</c>.</summary>
public static class InstanceErrors
{
    public const string InternalError = "INTERNAL_ERROR";
}

/// <summary>Contract ported from Go <c>instance/service.Service</c>.</summary>
public interface IInstanceService
{
    RootResponse Root();
    HealthResponse Health();
    VersionResponse Version();
    MetaResponse Meta();
    IReadOnlyList<InstanceSetting> GetAllSettings();
    IReadOnlyList<DatabaseStat> GetDatabaseStats();
    SystemEnvironmentResponse SystemEnvironment();
    DeveloperAccountResponse DeveloperAccount();
}
