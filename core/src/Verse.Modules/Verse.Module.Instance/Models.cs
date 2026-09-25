using System.Text.Json.Serialization;

namespace Verse.Module.Instance;

/// <summary>Entity ported from Go <c>instance/model.InstanceSetting</c> (table <c>instance_settings</c>).</summary>
public sealed class InstanceSetting
{
    [JsonPropertyName("id")] public uint Id { get; set; }
    [JsonPropertyName("key")] public string Key { get; set; } = string.Empty;
    [JsonPropertyName("value")] public string Value { get; set; } = string.Empty;
    [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
}
