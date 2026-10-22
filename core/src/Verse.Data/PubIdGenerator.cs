using System.Security.Cryptography;

namespace Verse.Data;

/// <summary>
/// Public-id generation, mirroring
/// core/src/Verse.Engine/internal/platform/id (usr_ / nt_ + 8 chars).
/// </summary>
public static class PubIdGenerator
{
    public const string UserPrefix = "usr_";
    public const string NotePrefix = "nt_";
    public const string FilePrefix = "file_";
    public const string FolderPrefix = "folder_";

    public const int MaxPubIdChangesPerMonth = 5;
    public const int MaxCustomPubIdLength = 30;

    /// <summary>Generates a public id such as <c>usr_A1b2C3d4</c>.</summary>
    public static string Generate(string prefix)
    {
        var alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
        var chars = new char[8];
        for (var i = 0; i < chars.Length; i++)
        {
            chars[i] = alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
        }

        return prefix + new string(chars);
    }

    public static string GenerateUserPubId() => Generate(UserPrefix);
    public static string GenerateNotePubId() => Generate(NotePrefix);
    public static string GenerateFilePubId() => Generate(FilePrefix);
    public static string GenerateFolderPubId() => Generate(FolderPrefix);

    /// <summary>
    /// Validates a user-chosen public id: 1-30 characters, alphanumeric plus
    /// <c>_</c>, <c>-</c> and <c>.</c> (mirrors Go's ValidateCustomPubID).
    /// </summary>
    public static bool IsValidCustomPubId(string id)
    {
        if (string.IsNullOrEmpty(id) || id.Length > MaxCustomPubIdLength)
        {
            return false;
        }

        foreach (var c in id)
        {
            var ok = char.IsAsciiLetterOrDigit(c) || c is '_' or '-' or '.';
            if (!ok)
            {
                return false;
            }
        }

        return true;
    }
}
