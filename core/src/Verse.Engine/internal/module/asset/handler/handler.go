package handler

import (
	"net/http"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/asset/service"
)

type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Icon(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")
	if url == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	data, contentType, err := h.svc.GetCachedIcon(url)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	// 阻止浏览器对响应体做 MIME 嗅探改写，配合 service 侧的 image/* 白名单（gosec G705）。
	w.Header().Set("X-Content-Type-Options", "nosniff")
	// #nosec G705 -- Content-Type is derived from byte sniffing in the service (image/* only)
	// and X-Content-Type-Options: nosniff blocks browser MIME sniffing.
	_, _ = w.Write(data)
}
