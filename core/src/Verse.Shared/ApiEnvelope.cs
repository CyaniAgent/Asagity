namespace Verse.Shared;

/// <summary>Domain error that maps 1:1 to the Go <c>httpx.WriteError</c> envelope.</summary>
public sealed class ModuleException(int statusCode, string code, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string Code { get; } = code;
}

/// <summary>JSON envelope helpers mirroring Go <c>httpx.WriteJSON/WriteError</c>.</summary>
public static class ApiResults
{
    public static IResult Ok(object? data) =>
        Results.Json(new { ok = true, data });

    public static IResult Created(object? data) =>
        Results.Json(new { ok = true, data }, statusCode: StatusCodes.Status201Created);

    public static IResult NoContent() => Results.StatusCode(StatusCodes.Status204NoContent);

    public static IResult Raw(int statusCode, object? data) =>
        Results.Json(new { ok = true, data }, statusCode: statusCode);

    public static IResult Fail(int statusCode, string code, string message) =>
        Results.Json(new { ok = false, error = new { code, message } }, statusCode: statusCode);

    public static IResult From(ModuleException ex) => Fail(ex.StatusCode, ex.Code, ex.Message);

    public static IResult Guard(Action action)
    {
        try
        {
            action();
            return Ok(new { status = "ok" });
        }
        catch (ModuleException ex)
        {
            return From(ex);
        }
    }
}
