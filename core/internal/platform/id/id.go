package id

import (
	"crypto/rand"
	"encoding/base64"
	"strings"
)

const (
	// ID prefixes
	PrefixUser   = "usr_"
	PrefixNote   = "nt_"
	PrefixFile   = "file_"
	PrefixFolder = "folder_"
)

// GeneratePubID generates a public-facing ID with given prefix
// Format: prefix + 8 random alphanumeric characters
// Example: usr_abc12345, nt_xy789zz
func GeneratePubID(prefix string) string {
	// Generate 6 bytes = 8 characters in base64url (no padding)
	bytes := make([]byte, 6)
	_, err := rand.Read(bytes)
	if err != nil {
		// Fallback to time-based
		return prefix + generateFallback(8)
	}

	encoded := base64.URLEncoding.EncodeToString(bytes)
	// Remove padding and convert to alphanumeric only
	encoded = strings.ReplaceAll(encoded, "-", "")
	encoded = strings.ReplaceAll(encoded, "_", "")

	// Ensure we have exactly 8 characters
	if len(encoded) < 8 {
		encoded = encoded + generateFallback(8-len(encoded))
	}

	return prefix + encoded[:8]
}

// GenerateUserPubID generates a user public ID
func GenerateUserPubID() string {
	return GeneratePubID(PrefixUser)
}

// GenerateNotePubID generates a note public ID
func GenerateNotePubID() string {
	return GeneratePubID(PrefixNote)
}

// GenerateFilePubID generates a file public ID
func GenerateFilePubID() string {
	return GeneratePubID(PrefixFile)
}

// GenerateFolderPubID generates a folder public ID
func GenerateFolderPubID() string {
	return GeneratePubID(PrefixFolder)
}

// generateFallback generates a fallback ID based on time
func generateFallback(length int) string {
	// Simple fallback using fixed chars
	chars := "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = chars[i%len(chars)]
	}
	return string(result)
}

// ValidatePubID validates a public ID format
func ValidatePubID(id string) bool {
	if len(id) < 4 {
		return false
	}

	// Check prefix
	validPrefixes := []string{PrefixUser, PrefixNote, PrefixFile, PrefixFolder}
	hasPrefix := false
	for _, p := range validPrefixes {
		if strings.HasPrefix(id, p) {
			hasPrefix = true
			break
		}
	}

	if !hasPrefix {
		return false
	}

	// Check remaining chars are alphanumeric
	parts := strings.SplitN(id, "_", 2)
	if len(parts) != 2 {
		return false
	}

	remaining := parts[1]
	if len(remaining) < 4 || len(remaining) > 16 {
		return false
	}

	for _, c := range remaining {
		if !((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) {
			return false
		}
	}

	return true
}

// ToUserPubID converts to user pubid format if needed
func ToUserPubID(input string) string {
	if strings.HasPrefix(input, PrefixUser) {
		return input
	}
	return PrefixUser + input
}

// ToNotePubID converts to note pubid format if needed
func ToNotePubID(input string) string {
	if strings.HasPrefix(input, PrefixNote) {
		return input
	}
	return PrefixNote + input
}

// ParsePubID extracts prefix and ID from a pubid
func ParsePubID(pubid string) (prefix, id string, valid bool) {
	if !ValidatePubID(pubid) {
		return "", "", false
	}

	parts := strings.SplitN(pubid, "_", 2)
	return parts[0], parts[1], true
}
