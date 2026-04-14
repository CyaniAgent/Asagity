package httpx

import (
	"encoding/json"
	"net/http"
	"strings"
)

type SuccessEnvelope struct {
	OK   bool `json:"ok"`
	Data any  `json:"data"`
}

type ErrorEnvelope struct {
	OK    bool        `json:"ok"`
	Error ErrorObject `json:"error"`
}

type ErrorObject struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func WriteJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(SuccessEnvelope{
		OK:   true,
		Data: data,
	})
}

func WriteError(w http.ResponseWriter, status int, code string, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(ErrorEnvelope{
		OK: false,
		Error: ErrorObject{
			Code:    code,
			Message: message,
		},
	})
}

func GetPathParam(r *http.Request, key string) string {
	path := r.URL.Path
	parts := strings.Split(path, "/")
	for i, part := range parts {
		if key == part && i+1 < len(parts) {
			return parts[i+1]
		}
	}
	// Fallback: try to find by last segment
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return ""
}
