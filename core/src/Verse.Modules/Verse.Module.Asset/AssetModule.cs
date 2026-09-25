using Verse.Shared;

namespace Verse.Module.Asset;

/// <summary>Route registration ported from Go <c>asset/module.go</c>.</summary>
public static class AssetModule
{
    public static void AddServices(IServiceCollection services) =>
        services.AddSingleton<IAssetService, NotImplementedAssetService>();

    public static void Register(WebApplication app)
    {
        // GET /api/asset/icon?url=...
        app.MapGet("/api/asset/icon", (string? url, IAssetService svc, HttpContext http) =>
        {
            if (string.IsNullOrEmpty(url))
                return ApiResults.Fail(StatusCodes.Status400BadRequest, AssetErrors.MissingUrlParam, "Missing url parameter");

            try
            {
                var (data, contentType) = svc.GetCachedIcon(url);
                http.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
                return Results.Bytes(data, contentType);
            }
            catch (ModuleException ex)
            {
                return ApiResults.From(ex);
            }
            catch (Exception ex)
            {
                return ApiResults.Fail(StatusCodes.Status500InternalServerError, AssetErrors.FetchFailed, ex.Message);
            }
        });
    }
}
