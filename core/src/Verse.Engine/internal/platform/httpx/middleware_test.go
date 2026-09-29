package httpx

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func signTestToken(t *testing.T, claims jwt.MapClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatal(err)
	}
	return signed
}

func TestAuthParsesExtendedClaims(t *testing.T) {
	signed := signTestToken(t, jwt.MapClaims{
		"sub":   "u1",
		"pubid": "usr_test",
		"grp":   "admin",
		"scope": "notes:read drive:write",
		"app":   "app-1",
	})

	var gotUser, gotGroup, gotApp string
	var gotScopes []string
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUser = GetUserID(r.Context())
		gotGroup = GetUserGroup(r.Context())
		gotScopes = GetTokenScopes(r.Context())
		gotApp = GetAppID(r.Context())
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	Auth("test-secret")(next).ServeHTTP(httptest.NewRecorder(), req)

	if gotUser != "u1" || gotGroup != "admin" || gotApp != "app-1" {
		t.Errorf("got user=%q group=%q app=%q", gotUser, gotGroup, gotApp)
	}
	if len(gotScopes) != 2 || gotScopes[0] != "notes:read" || gotScopes[1] != "drive:write" {
		t.Errorf("got scopes %q", gotScopes)
	}
}

func TestAuthLegacyTokenKeepsOldBehavior(t *testing.T) {
	signed := signTestToken(t, jwt.MapClaims{"sub": "u1", "pubid": "usr_test"})

	var gotGroup, gotApp string
	var gotScopes []string
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotGroup = GetUserGroup(r.Context())
		gotScopes = GetTokenScopes(r.Context())
		gotApp = GetAppID(r.Context())
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	Auth("test-secret")(next).ServeHTTP(httptest.NewRecorder(), req)

	if gotGroup != "" || gotApp != "" || gotScopes != nil {
		t.Errorf("legacy token must yield empty group/app/scopes, got %q %q %q", gotGroup, gotApp, gotScopes)
	}
}
