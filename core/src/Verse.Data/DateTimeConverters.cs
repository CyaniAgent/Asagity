using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Verse.Data;

/// <summary>
/// Date/time mapping shared by both providers.
///
/// The Go engine (GORM) writes timestamps as
/// "2026-10-21 06:03:18.016999146+08:00" while EF Core expects
/// "2026-10-21 06:03:18.0169991". During the migration window both stacks
/// read and write the same tables, so the .NET side parses the Go format as
/// well and always writes a round-trippable UTC value.
/// </summary>
public static class DateTimeConverters
{
    private const string StorageFormat = "yyyy-MM-dd HH:mm:ss.fffffff";

    private static readonly string[] ReadFormats =
    [
        "yyyy-MM-dd HH:mm:ss.fffffffzzz",
        "yyyy-MM-dd HH:mm:ss.fffffffZ",
        "yyyy-MM-dd HH:mm:ss.fffffff",
        "yyyy-MM-dd HH:mm:ss.fff",
        "yyyy-MM-ddTHH:mm:ss.fffffff",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-ddTHH:mm:ss",
    ];

    /// <summary>Converter storing UTC timestamps in a sortable text format.</summary>
    public static readonly ValueConverter<DateTime, string> UtcText =
        new(
            v => v.ToUniversalTime().ToString(StorageFormat, CultureInfo.InvariantCulture),
            v => Parse(v));

    /// <summary>Parses the timestamp formats written by either stack.</summary>
    public static DateTime Parse(string raw)
    {
        if (DateTime.TryParseExact(raw, ReadFormats, CultureInfo.InvariantCulture,
                DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var exact))
        {
            return DateTime.SpecifyKind(exact, DateTimeKind.Utc);
        }

        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture,
                DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var loose))
        {
            return DateTime.SpecifyKind(loose, DateTimeKind.Utc);
        }

        throw new FormatException($"unrecognized timestamp format: {raw}");
    }
}
