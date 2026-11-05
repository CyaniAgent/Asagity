using Microsoft.AspNetCore.Builder;

namespace Verse.Shared;

/// <summary>Endpoint metadata requiring a core scope (docs/api/permissions.md).</summary>
public sealed record ScopeRequirement(string Scope);

/// <summary>Endpoint metadata requiring administrator privileges.</summary>
public sealed record AdministratorRequirement;

public static class ScopeEndpointExtensions
{
    /// <summary>
    /// Requires a core scope on the endpoint, mirroring the Go engine's
    /// <c>r.With(authz.Require("notes:write"))</c> wiring.
    /// </summary>
    public static TBuilder RequireScope<TBuilder>(this TBuilder builder, string scope)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.Add(endpointBuilder =>
            endpointBuilder.Metadata.Add(new ScopeRequirement(scope)));
        return builder;
    }

    /// <summary>Requires administrator privileges on the endpoint.</summary>
    public static TBuilder RequireAdministrator<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.Add(endpointBuilder =>
            endpointBuilder.Metadata.Add(new AdministratorRequirement()));
        return builder;
    }
}
