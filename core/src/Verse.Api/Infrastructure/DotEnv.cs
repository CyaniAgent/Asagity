namespace Verse.Api.Infrastructure;

/// <summary>
/// Loads a repository-root <c>.env</c> file into the process environment.
///
/// Rules (mirroring the Go engine's loader):
/// <list type="bullet">
///   <item>the file is looked up by walking up from the working directory and
///         the binary directory until a directory containing
///         <c>core/src/Verse.slnx</c> (or a plain <c>.env</c>) is found;</item>
///   <item>real environment variables win over file values, so the Verse tool
///         can inject ports and paths per run (12-factor behaviour);</item>
///   <item>the file is never allowed to override an already-set variable.</item>
/// </list>
/// </summary>
public static class DotEnv
{
    public static string? Load()
    {
        foreach (var dir in CandidateDirectories())
        {
            var path = Path.Combine(dir, ".env");
            if (!File.Exists(path))
            {
                continue;
            }

            Apply(path);
            return path;
        }

        return null;
    }

    private static IEnumerable<string> CandidateDirectories()
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);

        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            var dir = start;
            for (var i = 0; i < 8; i++)
            {
                if (seen.Add(dir))
                {
                    yield return dir;
                }

                var parent = Path.GetDirectoryName(dir);
                if (string.IsNullOrEmpty(parent) || parent == dir)
                {
                    break;
                }

                dir = parent;
            }
        }
    }

    private static void Apply(string path)
    {
        foreach (var raw in File.ReadLines(path))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            if (line.StartsWith("export ", StringComparison.Ordinal))
            {
                line = line["export ".Length..].Trim();
            }

            var separator = line.IndexOf('=');
            if (separator <= 0)
            {
                continue;
            }

            var key = line[..separator].Trim();
            var value = line[(separator + 1)..].Trim().Trim('"', '\'');
            if (key.Length == 0)
            {
                continue;
            }

            // Real environment variables win over the file.
            if (Environment.GetEnvironmentVariable(key) is null)
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}
