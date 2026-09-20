package model

type InstanceSetting struct {
	ID          uint   `gorm:"primaryKey"`
	Key         string `gorm:"uniqueIndex;not null"`
	Value       string `gorm:"type:text"`
	Description string
}
