// Package jwtx derives the HMAC signing key shared by both stacks.
//
// The raw secret is usually shorter than 256 bits ("asagity_secret_miku_39"),
// which .NET rejects for HMAC-SHA256 while Go accepts it. Both stacks
// therefore derive the signing key as SHA-256(secret), so tokens stay
// interchangeable between the Go engine and the .NET API.
package jwtx

import "crypto/sha256"

// DeriveKey returns the 32-byte HMAC-SHA256 signing key for a secret.
func DeriveKey(secret string) []byte {
	sum := sha256.Sum256([]byte(secret))
	return sum[:]
}
