using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Verse.Api.Middlewares;

/// <summary>
/// Optional JWT authentication, ported from Go <c>httpx.Auth</c>:
/// a valid Bearer token populates <c>user_id</c>/<c>user_pubid</c> items,
/// otherwise the request passes through and endpoints decide (401) themselves.
/// </summary>
public sealed class JwtMiddleware(RequestDelegate next, IConfiguration config)
{
    private readonly string _secret =
        config["JWT_SECRET"]
        ?? Environment.GetEnvironmentVariable("JWT_SECRET")
        ?? "asagity_secret_miku_39";

    public async Task InvokeAsync(HttpContext http)
    {
        var header = http.Request.Headers.Authorization.ToString();
        if (header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var token = header["Bearer ".Length..].Trim();
            var principal = Validate(token);
            if (principal is not null)
            {
                var sub = principal.FindFirst("sub")?.Value;
                var pubId = principal.FindFirst("pubid")?.Value;
                if (!string.IsNullOrEmpty(sub))
                {
                    http.Items["user_id"] = sub;
                    http.Items["user_pubid"] = pubId ?? string.Empty;
                }
            }
        }

        await next(http);
    }

    private System.Security.Claims.ClaimsPrincipal? Validate(string token)
    {
        try
        {
            return new JwtSecurityTokenHandler().ValidateToken(token,
                new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret)),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                },
                out _);
        }
        catch
        {
            return null;
        }
    }
}
