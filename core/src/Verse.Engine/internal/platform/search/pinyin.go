package search

import (
	"strings"

	pinyin "github.com/mozillazg/go-pinyin"
)

// TextToPinyin converts Chinese text to pinyin without tones
// Used for pinyin-based search indexing
func TextToPinyin(text string) string {
	args := pinyin.NewArgs()
	args.Style = pinyin.Normal

	result := pinyin.Pinyin(text, args)

	var parts []string
	for _, p := range result {
		if len(p) > 0 && p[0] != "" {
			parts = append(parts, p[0])
		}
	}

	return strings.Join(parts, " ")
}

// TextToPinyinInitials converts Chinese text to pinyin initials (first letters)
// Used for quick pinyin search (e.g., "zg" for "中国")
func TextToPinyinInitials(text string) string {
	args := pinyin.NewArgs()
	args.Style = pinyin.FirstLetter

	result := pinyin.Pinyin(text, args)

	var parts []string
	for _, p := range result {
		if len(p) > 0 && p[0] != "" {
			parts = append(parts, p[0])
		}
	}

	return strings.Join(parts, "")
}
