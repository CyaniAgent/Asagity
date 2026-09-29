package httpx

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "user_id"
const UserPubIDKey contextKey = "user_pubid"

// Group, token-scope and app bindings for the permission layer
// (internal/platform/authz). Absent on legacy tokens: getters below
// then yield "" / nil, i.e. a self-acting non-admin user.
const UserGroupKey contextKey = "user_group"
const TokenScopesKey contextKey = "token_scopes"
const AppIDKey contextKey = "app_id"

func Cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // For development, allow all
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func Auth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				next.ServeHTTP(w, r) // Some routes are optional. Protecting them happens later.
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			})

			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					ctx := r.Context()

					if userID, ok := claims["sub"].(string); ok {
						ctx = context.WithValue(ctx, UserIDKey, userID)
					}

					if pubID, ok := claims["pubid"].(string); ok {
						ctx = context.WithValue(ctx, UserPubIDKey, pubID)
					}

					if group, ok := claims["grp"].(string); ok {
						ctx = context.WithValue(ctx, UserGroupKey, group)
					}

					if scope, ok := claims["scope"].(string); ok {
						ctx = context.WithValue(ctx, TokenScopesKey, scope)
					}

					if appID, ok := claims["app"].(string); ok {
						ctx = context.WithValue(ctx, AppIDKey, appID)
					}

					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

func GetUserID(ctx context.Context) string {
	if userID, ok := ctx.Value(UserIDKey).(string); ok {
		return userID
	}
	return ""
}

func GetUserPubID(ctx context.Context) string {
	if pubID, ok := ctx.Value(UserPubIDKey).(string); ok {
		return pubID
	}
	return ""
}

// GetUserGroup returns the caller's user-group id ("admin" for
// administrators) or "" when the token carries none.
func GetUserGroup(ctx context.Context) string {
	if group, ok := ctx.Value(UserGroupKey).(string); ok {
		return group
	}
	return ""
}

// GetTokenScopes returns the space-separated scope list of scoped
// application tokens, or nil for self-acting user tokens.
func GetTokenScopes(ctx context.Context) []string {
	raw, _ := ctx.Value(TokenScopesKey).(string)
	if raw == "" {
		return nil
	}
	return strings.Fields(raw)
}

// GetAppID returns the bound application id of scoped tokens,
// or "" for self-acting user tokens.
func GetAppID(ctx context.Context) string {
	if appID, ok := ctx.Value(AppIDKey).(string); ok {
		return appID
	}
	return ""
}
