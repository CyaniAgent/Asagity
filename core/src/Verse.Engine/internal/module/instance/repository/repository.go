package repository

import (
	"fmt"

	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/instance/model"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/database"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/mode"
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
	GetAdministrator() (database.AdministratorInfo, bool, error)
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

// GetDatabaseStats returns per-table size and row counts. PostgreSQL uses
// pg_stat_user_tables; SQLite (lite mode) has no such view, so the same
// information is derived from sqlite_master plus a per-table COUNT.
func (r *repository) GetDatabaseStats() ([]DatabaseStat, error) {
	if r.clients.Mode == mode.Lite {
		return r.sqliteDatabaseStats()
	}

	var stats []DatabaseStat
	query := `SELECT relname AS table, pg_size_pretty(pg_total_relation_size(relid)) AS size_pretty, pg_total_relation_size(relid) as size_bytes, n_live_tup as rows FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC`
	err := r.clients.DB.Raw(query).Scan(&stats).Error
	return stats, err
}

func (r *repository) sqliteDatabaseStats() ([]DatabaseStat, error) {
	var tables []struct {
		Name string `gorm:"column:name"`
	}
	if err := r.clients.DB.Raw(
		`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
	).Scan(&tables).Error; err != nil {
		return nil, err
	}

	var pageCount, pageSize int64
	if err := r.clients.DB.Raw("PRAGMA page_count").Scan(&pageCount).Error; err != nil {
		return nil, err
	}
	if err := r.clients.DB.Raw("PRAGMA page_size").Scan(&pageSize).Error; err != nil {
		return nil, err
	}

	stats := make([]DatabaseStat, 0, len(tables))
	for _, t := range tables {
		var rows int64
		if err := r.clients.DB.Raw(
			fmt.Sprintf(`SELECT COUNT(*) FROM "%s"`, t.Name),
		).Scan(&rows).Error; err != nil {
			return nil, err
		}
		stats = append(stats, DatabaseStat{
			Table:      t.Name,
			SizePretty: fmt.Sprintf("%d bytes", pageCount*pageSize),
			SizeBytes:  pageCount * pageSize,
			Rows:       rows,
		})
	}
	return stats, nil
}

// GetAdministrator returns the seeded administrator account of the instance
// (the developer account in lite mode), without its password.
func (r *repository) GetAdministrator() (database.AdministratorInfo, bool, error) {
	return r.clients.AdministratorAccount()
}
