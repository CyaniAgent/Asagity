using Verse.Shared;
using Verse.Data;

namespace Verse.Module.Instance;

/// <summary>Route registration ported from Go <c>instance/module.go</c>.</summary>
public static class InstanceModule
{
    public static void AddServices(IServiceCollection services)
    {
        services.AddScoped<IInstanceRepository, InstanceRepository>();
        services.AddScoped<IInstanceService, InstanceService>();
    }

    public static void Register(WebApplication app)
    {
        app.MapGet("/", (IInstanceService svc) => ApiResults.Ok(svc.Root()));
        app.MapGet("/healthz", (IInstanceService svc) => ApiResults.Ok(svc.Health()));
        app.MapGet("/api/meta/version", (IInstanceService svc) => Guard(() => svc.Version()));
        app.MapGet("/api/meta/instance", (IInstanceService svc) => Guard(() => svc.Meta()));
        app.MapGet("/api/system/environment", (IInstanceService svc) => Guard(() => svc.SystemEnvironment()));
        app.MapGet("/api/system/developer-account", (IInstanceService svc) => Guard(() => svc.DeveloperAccount()));

        // Administrative surfaces require administrator privileges.
        app.MapGet("/api/admin/system/instance", (IInstanceService svc) => Guard(() => svc.GetAllSettings()))
            .RequireAdministrator();
        app.MapGet("/api/admin/system/database", (IInstanceService svc) => Guard(() => svc.GetDatabaseStats()))
            .RequireAdministrator();
    }

    private static IResult Guard<T>(Func<T> call)
    {
        try
        {
            return ApiResults.Ok(call());
        }
        catch (ModuleException ex)
        {
            return ApiResults.From(ex);
        }
        catch (Exception ex)
        {
            return ApiResults.Fail(StatusCodes.Status500InternalServerError, InstanceErrors.InternalError, ex.Message);
        }
    }
}
