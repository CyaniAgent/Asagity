using Verse.Data;
using Verse.Data.Entities;
using Verse.Shared;

namespace Verse.Module.Instance;

public sealed class InstanceService(
    IInstanceRepository repository,
    IConfiguration configuration,
    DataOptions dataOptions) : IInstanceService
{
    public RootResponse Root() => new("Asagity Core", "bootstrap");

    public HealthResponse Health() => new("ok");

    public VersionResponse Version() =>
        new("Asagity Core", configuration["APP_VERSION"] ?? "dev");

    public MetaResponse Meta() =>
        new("Asagity", string.Empty, "Asagity instance metadata is not configured yet.");

    public IReadOnlyList<InstanceSetting> GetAllSettings() =>
        repository.GetAllSettingsAsync().GetAwaiter().GetResult();

    public IReadOnlyList<DatabaseStat> GetDatabaseStats() =>
        repository.GetDatabaseStatsAsync().GetAwaiter().GetResult();

    public SystemEnvironmentResponse SystemEnvironment() => new(
        Environment.GetEnvironmentVariable("HOST_HOSTNAME") ?? string.Empty,
        Environment.GetEnvironmentVariable("HOST_OS") ?? string.Empty,
        Environment.GetEnvironmentVariable("HOST_OS_VERSION") ?? string.Empty,
        Environment.GetEnvironmentVariable("HOST_ARCH") ?? string.Empty,
        Environment.GetEnvironmentVariable("HOST_CPU") ?? string.Empty,
        Environment.GetEnvironmentVariable("HOST_MEMORY") ?? string.Empty,
        !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HOST_HOSTNAME")));

    public DeveloperAccountResponse DeveloperAccount()
    {
        var response = new DeveloperAccountResponse { Mode = dataOptions.Mode.ToString().ToLowerInvariant() };

        var (account, groupName) = repository.GetAdministratorAsync().GetAwaiter().GetResult();
        if (account is null)
        {
            return response;
        }

        response.Exists = true;
        response.Username = account.Username;
        response.Email = account.Email ?? string.Empty;
        response.Name = account.Name;
        response.Group = groupName;
        response.GroupId = account.UserGroupId;
        response.PubId = account.PubId;
        response.SeededBy = "VerseDataSeeder.EnsureSeededAsync";
        return response;
    }
}
