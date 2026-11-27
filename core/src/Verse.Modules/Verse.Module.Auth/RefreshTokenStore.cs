using System.Collections.Concurrent;

namespace Verse.Module.Auth;

/// <summary>
/// Refresh-token session store. Mirrors the Go engine's cache-backed
/// <c>refresh:&lt;token&gt; -&gt; userID</c> entries with rotation and revocation.
/// Implement this interface against a distributed store when the .NET API runs
/// with more than one replica.
/// </summary>
public interface IRefreshTokenStore
{
    void Store(string token, string userId, TimeSpan lifetime);
    bool TryGet(string token, out string userId);
    void Revoke(string token);
    void RevokeAll(string userId);
}

/// <summary>Process-local store with lazy expiry cleanup (single-replica default).</summary>
public sealed class InMemoryRefreshTokenStore : IRefreshTokenStore
{
    private sealed record Entry(string UserId, DateTimeOffset ExpiresAt);

    private readonly ConcurrentDictionary<string, Entry> _entries = new(StringComparer.Ordinal);
    private long _nextPurgeTicks;

    public void Store(string token, string userId, TimeSpan lifetime)
    {
        ArgumentException.ThrowIfNullOrEmpty(token);
        ArgumentException.ThrowIfNullOrEmpty(userId);
        PurgeIfDue();
        _entries[token] = new Entry(userId, DateTimeOffset.UtcNow.Add(lifetime));
    }

    public bool TryGet(string token, out string userId)
    {
        userId = string.Empty;
        if (string.IsNullOrEmpty(token) || !_entries.TryGetValue(token, out var entry))
        {
            return false;
        }

        if (entry.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            _entries.TryRemove(token, out _);
            return false;
        }

        userId = entry.UserId;
        return true;
    }

    public void Revoke(string token)
    {
        if (!string.IsNullOrEmpty(token))
        {
            _entries.TryRemove(token, out _);
        }
    }

    public void RevokeAll(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        foreach (var pair in _entries)
        {
            if (string.Equals(pair.Value.UserId, userId, StringComparison.Ordinal))
            {
                _entries.TryRemove(pair.Key, out _);
            }
        }
    }

    private void PurgeIfDue()
    {
        var now = DateTimeOffset.UtcNow.Ticks;
        if (now < Interlocked.Read(ref _nextPurgeTicks))
        {
            return;
        }

        Interlocked.Exchange(ref _nextPurgeTicks, now + TimeSpan.FromMinutes(1).Ticks);
        foreach (var pair in _entries)
        {
            if (pair.Value.ExpiresAt <= DateTimeOffset.UtcNow)
            {
                _entries.TryRemove(pair.Key, out _);
            }
        }
    }
}
