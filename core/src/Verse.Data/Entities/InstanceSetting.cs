using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Verse.Data.Entities;

/// <summary>
/// Entity mapped to the <c>instance_settings</c> table.
/// Column names mirror the Go/GORM schema exactly so both stacks can share
/// one database during the migration window.
/// </summary>
[Table("instance_settings")]
public sealed class InstanceSetting
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("key")]
    [MaxLength(255)]
    public string Key { get; set; } = string.Empty;

    [Column("value")]
    public string Value { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;
}
