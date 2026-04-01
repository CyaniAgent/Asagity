package httpx

import (
	"encoding/json"
	"net/http"
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
