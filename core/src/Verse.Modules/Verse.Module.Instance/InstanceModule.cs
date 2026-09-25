using Verse.Shared;

namespace Verse.Module.Instance;

/// <summary>Route registration ported from Go <c>instance/module.go</c>.</summary>
public static class InstanceModule
{
    public static void AddServices(IServiceCollection services) =>
        services.AddSingleton<IInstanceService, NotImplementedInstanceService>();

    public static void Register(WebApplication app)
    {
        app.MapGet("/", () => ApiResults.Ok(new RootResponse("Asagity Core", "bootstrap")));
        app.MapGet("/healthz", () => ApiResults.Ok(new HealthResponse("ok")));
        app.MapGet("/api/meta/version", (IInstanceService svc) => Guard(() => svc.Version()));
        app.MapGet("/api/meta/instance", (IInstanceService svc) => Guard(() => svc.Meta()));
        app.MapGet("/api/admin/system/instance", (IInstanceService svc) => Guard(() => svc.GetAllSettings()));
        app.MapGet("/api/admin/system/database", (IInstanceService svc) => Guard(() => svc.GetDatabaseStats()));
        app.MapGet("/api/system/environment", (IInstanceService svc) => Guard(() => svc.SystemEnvironment()));
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
