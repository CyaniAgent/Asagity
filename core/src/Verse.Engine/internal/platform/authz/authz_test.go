package authz

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/httpx"
)

func TestExpandImpliesRead(t *testing.T) {
	set := Expand([]string{"notes:write", "admin:users:write"})
	for _, want := range []string{"notes:write", "notes:read", "admin:users:write", "admin:users:read"} {
		if !set[want] {
			t.Errorf("expected %q in expanded set", want)
		}
	}
	if set["notes:delete"] {
		t.Error("unexpected scope notes:delete")
	}
}

func TestExpandKeepsUnknown(t *testing.T) {
	set := Expand([]string{"future:thing"})
	if !set["future:thing"] {
		t.Error("unknown scope should pass through")
	}
}

func TestRegistryCoversEnforcedScopes(t *testing.T) {
	// Every scope referenced by route wiring must be registered;
	// Require fails closed on unknown names.
	for _, name := range []string{
		"account:read", "account:write",
		"notes:read", "notes:write",
		"drive:read", "drive:write",
		"follow:read", "follow:write",
	} {
		if !Valid(name) {
			t.Errorf("enforced scope %q missing from registry", name)
		}
	}
}

func TestAdminScopeIndependence(t *testing.T) {
	if !IsAdminScope("admin:users:write") {
		t.Error("admin:users:write should be admin scope")
	}
	if IsAdminScope("notes:write") {
		t.Error("notes:write should not be admin scope")
	}
}

func ctxWith(userID, group, scopes, appID string) context.Context {
	ctx := context.Background()
	if userID != "" {
		ctx = context.WithValue(ctx, httpx.UserIDKey, userID)
	}
	if group != "" {
		ctx = context.WithValue(ctx, httpx.UserGroupKey, group)
	}
	if scopes != "" {
		ctx = context.WithValue(ctx, httpx.TokenScopesKey, scopes)
	}
	if appID != "" {
		ctx = context.WithValue(ctx, httpx.AppIDKey, appID)
	}
	return ctx
}

func TestSelfUserHasAllUserScopes(t *testing.T) {
	p := FromContext(ctxWith("u1", "default", "", ""))
	for _, s := range []string{"notes:read", "notes:write", "drive:read", "account:write"} {
		if !p.HasScope(s) {
			t.Errorf("self user should have %q", s)
		}
	}
	if p.HasScope("admin:system:read") {
		t.Error("non-admin self user must not have admin scopes")
	}
}

func TestSelfAdminHasAdminScopes(t *testing.T) {
	p := FromContext(ctxWith("u1", AdminGroupID, "", ""))
	if !p.HasScope("admin:system:read") {
		t.Error("admin self user should have admin scopes")
	}
}

func TestAppTokenIsRestricted(t *testing.T) {
	p := FromContext(ctxWith("u1", "default", "notes:read", "app-1"))
	if !p.HasScope("notes:read") {
		t.Error("app should have granted notes:read")
	}
	if p.HasScope("notes:write") {
		t.Error("app must not have ungranted notes:write")
	}
	if p.HasScope("drive:read") {
		t.Error("app must not have ungranted drive:read")
	}
}

func TestAppTokenWriteImpliesRead(t *testing.T) {
	p := FromContext(ctxWith("u1", "default", "drive:write", "app-1"))
	if !p.HasScope("drive:read") {
		t.Error("granted write should imply read")
	}
}

func TestAppTokenAdminGated(t *testing.T) {
	nonAdmin := FromContext(ctxWith("u1", "default", "admin:system:read", "app-1"))
	if nonAdmin.HasScope("admin:system:read") {
		t.Error("non-admin app must not hold admin scope")
	}
	admin := FromContext(ctxWith("u1", AdminGroupID, "admin:system:read", "app-1"))
	if !admin.HasScope("admin:system:read") {
		t.Error("admin app should hold granted admin scope")
	}
}

func TestUnauthenticatedHasNothing(t *testing.T) {
	p := FromContext(context.Background())
	if p.Authenticated() || p.HasScope("notes:read") {
		t.Error("anonymous caller must have no scopes")
	}
}

func okHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func TestRequireAllowsAndDenies(t *testing.T) {
	h := Require("notes:write")(http.HandlerFunc(okHandler))

	// self user passes
	req := httptest.NewRequest("POST", "/api/notes", nil).WithContext(ctxWith("u1", "default", "", ""))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("self user: got %d, want 200", rec.Code)
	}

	// anonymous → 401
	req = httptest.NewRequest("POST", "/api/notes", nil)
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("anonymous: got %d, want 401", rec.Code)
	}

	// scoped app without the scope → 403 naming the scope
	req = httptest.NewRequest("POST", "/api/notes", nil).WithContext(ctxWith("u1", "default", "notes:read", "app-1"))
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Errorf("under-scoped app: got %d, want 403", rec.Code)
	}
	if body := rec.Body.String(); !strings.Contains(body, "notes:write") {
		t.Errorf("403 body must name missing scope, got %q", body)
	}
}

func TestRequireUnknownScopeFailsClosed(t *testing.T) {
	h := Require("nope:missing")(http.HandlerFunc(okHandler))
	req := httptest.NewRequest("GET", "/", nil).WithContext(ctxWith("u1", "default", "", ""))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Errorf("unknown scope: got %d, want 403", rec.Code)
	}
}

func TestRequireAdmin(t *testing.T) {
	h := RequireAdmin()(http.HandlerFunc(okHandler))

	cases := []struct {
		name string
		ctx  context.Context
		want int
	}{
		{"anonymous", context.Background(), http.StatusUnauthorized},
		{"non-admin", ctxWith("u1", "default", "", ""), http.StatusForbidden},
		{"legacy token without grp", ctxWith("u1", "", "", ""), http.StatusForbidden},
		{"admin", ctxWith("u1", AdminGroupID, "", ""), http.StatusOK},
	}
	for _, c := range cases {
		req := httptest.NewRequest("GET", "/api/admin/system/instance", nil).WithContext(c.ctx)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != c.want {
			t.Errorf("%s: got %d, want %d", c.name, rec.Code, c.want)
		}
	}
}
