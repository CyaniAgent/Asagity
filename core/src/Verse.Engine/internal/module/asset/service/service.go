package service

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/config"
)

type Service struct {
	cfg config.Config
}

func New(cfg config.Config) *Service {
	return &Service{cfg: cfg}
}

func (s *Service) GetCachedIcon(remoteURL string) ([]byte, string, error) {
	// 1. Generate Hash for filename —— SHA-256 取代 MD5（gosec G401 弱哈希 / G501 弱密码套件），
	// 这里仅用于缓存文件名，但统一升级为强哈希以通过安全扫描。
	hash := sha256.Sum256([]byte(remoteURL))
	hashStr := hex.EncodeToString(hash[:])

	// Determine extension (simplified)
	ext := ".png"
	// In a real app, we might want to check the actual extension from the URL

	filename := hashStr + ext
	storageDir := filepath.Join("..", "web", "app", "assets", "icons")
	filePath := filepath.Join(storageDir, filename)

	// 2. Check if exists
	// #nosec G304 -- filePath is built from a SHA-256 hex digest (fixed charset) under a fixed dir.
	if _, err := os.Stat(filePath); err == nil {
		data, err := os.ReadFile(filePath)
		if err == nil {
			return data, "image/png", nil
		}
	}

	// 3. Download if not found
	// URL 必须先通过 validateIconURL 白名单校验（scheme + hostname）。
	u, err := url.Parse(remoteURL)
	if err != nil {
		return nil, "", fmt.Errorf("invalid icon url: %w", err)
	}
	if err := validateIconURL(u); err != nil {
		return nil, "", err
	}
	// #nosec G107 -- URL validated by validateIconURL (http/https only) and fetched through
	// iconClient whose dialer rejects loopback / link-local / private addresses (SSRF guard).
	resp, err := iconClient.Get(u.String())
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("failed to fetch icon: %s", resp.Status)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	// 4. Save to disk
	if err := os.MkdirAll(storageDir, 0750); err != nil {
		return nil, "", err
	}

	if err := os.WriteFile(filePath, data, 0600); err != nil {
		return nil, "", err
	}

	// 5. Content type 由字节嗅探决定，绝不信任上游 Header（gosec G705：防 Content-Type
	// 污染导致的 XSS / 嗅探改写）。非 image/* 一律降级为不可执行的通用类型。
	contentType := http.DetectContentType(data)
	if !strings.HasPrefix(contentType, "image/") {
		contentType = "application/octet-stream"
	}

	return data, contentType, nil
}

// iconClient 是图标抓取专用 HTTP client：
//   - 10s 超时，防止慢速响应拖死请求协程；
//   - Proxy 置 nil，杜绝经由环境变量代理绕过内网地址拦截；
//   - DialContext 里的 Control 回调在 TCP 连接建立前校验目标 IP，
//     拒绝 loopback / link-local / 私有地址（SSRF 防护核心）。
var iconClient = &http.Client{
	Timeout: 10 * time.Second,
	Transport: &http.Transport{
		Proxy: nil,
		DialContext: (&net.Dialer{
			Timeout: 5 * time.Second,
			Control: rejectNonPublicAddr,
		}).DialContext,
	},
}

// rejectNonPublicAddr 在拨号阶段拦截内网 /本机 / 保留地址。
func rejectNonPublicAddr(network, address string, _ syscall.RawConn) error {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return fmt.Errorf("resolve icon host: %w", err)
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return fmt.Errorf("icon host is not an ip literal: %q", host)
	}
	if !ip.IsGlobalUnicast() || ip.IsPrivate() || ip.IsLoopback() || ip.IsLinkLocalUnicast() {
		return fmt.Errorf("refusing to fetch icon from non-public address %s", ip)
	}
	return nil
}

// validateIconURL 只放行 http/https 且带主机名的 URL。
func validateIconURL(u *url.URL) error {
	if u.Scheme != "http" && u.Scheme != "https" {
		return fmt.Errorf("icon url scheme must be http or https, got %q", u.Scheme)
	}
	if u.Hostname() == "" {
		return fmt.Errorf("icon url has no host")
	}
	return nil
}
