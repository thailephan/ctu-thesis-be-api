package pkg

import (
	"crypto/md5"
	"encoding/hex"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
	"os"
	"unicode"
)

// Exists check whether file or folder existed
// https://stackoverflow.com/questions/10510691/how-to-check-whether-a-file-or-directory-exists
func Exists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

// RemoveAccents replace accent character of every language into alphabet character
// https://twin.sh/articles/33/remove-accents-from-characters-in-go
func RemoveAccents(s string) string {
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	output, _, e := transform.String(t, s)
	if e != nil {
		panic(e)
	}
	return output
}

func GetMD5Hash(text string) string {
	hash := md5.Sum([]byte(text))
	return hex.EncodeToString(hash[:])
}
