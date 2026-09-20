using Verse.Shared;

namespace Verse.Module.Asset;

/// <summary>Error codes ported from Go <c>asset/handler</c> (plain-text errors mapped to the envelope).</summary>
public static class AssetErrors
{
    public const string MissingUrlParam = "MISSING_URL_PARAM";
    public const string FetchFailed = "FETCH_FAILED";
}

/// <summary>Contract ported from Go <c>asset/service.Service</c>.</summary>
public interface IAssetService
{
    /// <returns>PNG bytes + content type, served from disk cache or fetched remotely.</returns>
    (byte[] Data, string ContentType) GetCachedIcon(string remoteUrl);
}

/// <summary>DI stub: every call returns 501 until the real service lands.</summary>
public sealed class NotImplementedAssetService : IAssetService
{
    public (byte[] Data, string ContentType) GetCachedIcon(string remoteUrl) =>
        throw new ModuleException(StatusCodes.Status501NotImplemented, "ASSET_NOT_IMPLEMENTED", "Asset service is not implemented yet.");
}
