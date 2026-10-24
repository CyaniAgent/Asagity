package authz

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/httpx"
)

// Require enforces one core scope on a route, preserving the existing
// unauthenticated behavior (401 UNAUTHORIZED) and denying with
// 403 PERMISSION_DENIED that names the missing scope, as required by
// the AABP error model (docs/aabp/spec.md §9).
func Require(scopeName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			p := FromContext(r.Context())
			if !p.Authenticated() {
				httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
				return
			}
			if !p.HasScope(scopeName) {
				httpx.WriteError(w, http.StatusForbidden, "PERMISSION_DENIED", "Missing required scope: "+scopeName)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAdmin enforces administrator privileges, closing routes such as
// /api/admin/* that previously performed no caller check at all.
func RequireAdmin() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			p := FromContext(r.Context())
			if !p.Authenticated() {
				httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
				return
			}
			if !p.Admin {
				httpx.WriteError(w, http.StatusForbidden, "PERMISSION_DENIED", "Administrator privileges required")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
