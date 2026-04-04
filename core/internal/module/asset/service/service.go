package service

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
)

type Service struct {
	cfg config.Config
}

func New(cfg config.Config) *Service {
	return &Service{cfg: cfg}
}

func (s *Service) GetCachedIcon(remoteURL string) ([]byte, string, error) {
	// 1. Generate Hash for filename
	hash := md5.Sum([]byte(remoteURL))
	hashStr := hex.EncodeToString(hash[:])
	
	// Determine extension (simplified)
	ext := ".png"
	// In a real app, we might want to check the actual extension from the URL
	
	filename := hashStr + ext
	storageDir := filepath.Join("..", "web", "app", "assets", "icons")
	filePath := filepath.Join(storageDir, filename)

	// 2. Check if exists
	if _, err := os.Stat(filePath); err == nil {
		data, err := os.ReadFile(filePath)
		if err == nil {
			return data, "image/png", nil
		}
	}

	// 3. Download if not found
	resp, err := http.Get(remoteURL)
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
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		return nil, "", err
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return nil, "", err
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/png"
	}

	return data, contentType, nil
}
