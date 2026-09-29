package authz

import (
	"context"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/httpx"
)

// AdminGroupID is the user-group identifier that grants administrator
// privileges (seeded in database.EnsureSeeded).
const AdminGroupID = "admin"

// Principal is the resolved caller of a request.
type Principal struct {
	UserID string
	Admin  bool
	// AppID is empty for self-acting user tokens and set for scoped
	// application tokens (AABP Bridge / future OAuth clients).
	AppID  string
	Scopes map[string]bool
}

// Authenticated reports whether the request carries a valid identity.
func (p Principal) Authenticated() bool {
	return p.UserID != ""
}

// HasScope enforces the scope model:
//
//   - unauthenticated callers have nothing;
//   - self-acting user tokens hold every non-admin scope, plus admin
//     scopes for administrators (users are not permission-constrained,
//     applications are);
//   - scoped application tokens hold exactly their granted (expanded)
//     scopes, with admin scopes additionally gated on Admin.
func (p Principal) HasScope(name string) bool {
	if !p.Authenticated() || !Valid(name) {
		return false
	}
	if p.AppID == "" {
		if IsAdminScope(name) {
			return p.Admin
		}
		return true
	}
	if IsAdminScope(name) {
		return p.Admin && p.Scopes[name]
	}
	return p.Scopes[name]
}

// FromContext resolves the caller from request context values populated
// by httpx.Auth (user id, group, token scopes, app id).
func FromContext(ctx context.Context) Principal {
	p := Principal{
		UserID: httpx.GetUserID(ctx),
		Admin:  httpx.GetUserGroup(ctx) == AdminGroupID,
		AppID:  httpx.GetAppID(ctx),
	}
	if p.AppID != "" {
		p.Scopes = Expand(httpx.GetTokenScopes(ctx))
	}
	return p
}
