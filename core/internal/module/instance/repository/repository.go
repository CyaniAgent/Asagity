package repository

import (
	"github.com/CyaniAgent/Asagity/core/internal/module/instance/model"
	"github.com/CyaniAgent/Asagity/core/internal/platform/database"
)

type DatabaseStat struct {
	Table      string `json:"table"`
	SizePretty string `json:"size_pretty"`
	SizeBytes  int64  `json:"size_bytes"`
	Rows       int64  `json:"rows"`
}

type Repository interface {
	GetAllSettings() ([]model.InstanceSetting, error)
	GetDatabaseStats() ([]DatabaseStat, error)
}

type repository struct {
	clients *database.Clients
}

func New(clients *database.Clients) Repository {
	return &repository{clients: clients}
}

func (r *repository) GetAllSettings() ([]model.InstanceSetting, error) {
	var settings []model.InstanceSetting
	err := r.clients.DB.Find(&settings).Error
	return settings, err
}

func (r *repository) GetDatabaseStats() ([]DatabaseStat, error) {
	var stats []DatabaseStat
	query := `SELECT relname AS table, pg_size_pretty(pg_total_relation_size(relid)) AS size_pretty, pg_total_relation_size(relid) as size_bytes, n_live_tup as rows FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC`
	err := r.clients.DB.Raw(query).Scan(&stats).Error
	return stats, err
}
