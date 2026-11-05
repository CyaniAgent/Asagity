using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Verse.Shared;

namespace Verse.Api.Middlewares;

/// <summary>
/// Optional JWT authentication, ported from Go <c>httpx.Auth</c>:
/// a valid Bearer token populates <c>user_id</c>/<c>user_pubid</c> (plus the
/// group/scope/app claims used by the permission layer); otherwise the request
/// passes through and endpoints decide (401) themselves.
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
                    http.Items[CurrentUser.UserIdItem] = sub;
                    http.Items[CurrentUser.UserPubIdItem] = pubId ?? string.Empty;
                }

                var group = principal.FindFirst("grp")?.Value;
                if (!string.IsNullOrEmpty(group))
                {
                    http.Items[CurrentUser.UserGroupItem] = group;
                }

                var scope = principal.FindFirst("scope")?.Value;
                if (!string.IsNullOrEmpty(scope))
                {
                    http.Items[CurrentUser.TokenScopesItem] = scope;
                }

                var appId = principal.FindFirst("app")?.Value;
                if (!string.IsNullOrEmpty(appId))
                {
                    http.Items[CurrentUser.AppIdItem] = appId;
                }
            }
        }

        await next(http);
    }

    private System.Security.Claims.ClaimsPrincipal? Validate(string token)
    {
        try
        {
            // MapInboundClaims = false keeps the raw claim names ("sub", "pubid",
            // "grp", "scope", "app"); the default mapping rewrites "sub" to
            // ClaimTypes.NameIdentifier and breaks the contract with the Go engine.
            var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
            return handler.ValidateToken(token,
                new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    // HMAC-SHA256 needs a 256-bit key, while the shared secret is
                    // shorter. Both stacks derive the key as SHA-256(secret)
                    // (core/src/Verse.Engine/internal/platform/jwtx), so tokens
                    // stay interchangeable.
                    IssuerSigningKey = new SymmetricSecurityKey(
                        SHA256.HashData(Encoding.UTF8.GetBytes(_secret))),
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
