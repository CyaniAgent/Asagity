package database

import (
	"testing"

	usermodel "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/user/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&usermodel.User{}, &usermodel.UserGroup{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	return db
}

func TestSeedUserGroups(t *testing.T) {
	db := newTestDB(t)

	if err := SeedUserGroups(db); err != nil {
		t.Fatalf("SeedUserGroups: %v", err)
	}
	var groups []usermodel.UserGroup
	if err := db.Find(&groups).Error; err != nil {
		t.Fatalf("find groups: %v", err)
	}
	if len(groups) != 3 {
		t.Fatalf("expected 3 groups, got %d", len(groups))
	}
	if groups[0].ID != AdministratorGroupID || groups[0].Name != AdministratorGroupName {
		t.Errorf("unexpected administrator group: %+v", groups[0])
	}

	// Idempotent: a second call must not duplicate.
	if err := SeedUserGroups(db); err != nil {
		t.Fatalf("SeedUserGroups again: %v", err)
	}
	db.Find(&groups)
	if len(groups) != 3 {
		t.Errorf("groups duplicated: got %d", len(groups))
	}
}

func TestSeedAdministratorCreatesDevAccount(t *testing.T) {
	db := newTestDB(t)
	if err := SeedUserGroups(db); err != nil {
		t.Fatalf("SeedUserGroups: %v", err)
	}

	created, err := SeedAdministrator(db, LiteDeveloper)
	if err != nil {
		t.Fatalf("SeedAdministrator: %v", err)
	}
	if !created {
		t.Fatal("expected the developer account to be created")
	}

	var user usermodel.User
	if err := db.Where("username = ?", LiteDeveloper.Username).First(&user).Error; err != nil {
		t.Fatalf("developer account missing: %v", err)
	}
	if user.UserGroupID != AdministratorGroupID {
		t.Errorf("group = %q, want %q", user.UserGroupID, AdministratorGroupID)
	}
	if user.Email == nil || *user.Email != LiteDeveloper.Email {
		t.Errorf("email = %v, want %q", user.Email, LiteDeveloper.Email)
	}
	if user.PasswdHash == LiteDeveloper.Password {
		t.Error("password must be hashed, not stored in clear text")
	}
	if user.PubID == "" {
		t.Error("pubid must be generated")
	}
}

func TestSeedAdministratorSkipsWhenAdminExists(t *testing.T) {
	db := newTestDB(t)
	if err := SeedUserGroups(db); err != nil {
		t.Fatalf("SeedUserGroups: %v", err)
	}
	if _, err := SeedAdministrator(db, LiteDeveloper); err != nil {
		t.Fatalf("first seed: %v", err)
	}

	// A second administrator must suppress any further seeding.
	created, err := SeedAdministrator(db, ProductionAdministrator)
	if err != nil {
		t.Fatalf("second seed: %v", err)
	}
	if created {
		t.Error("seeding must be skipped when an administrator already exists")
	}

	var count int64
	db.Model(&usermodel.User{}).Count(&count)
	if count != 1 {
		t.Errorf("expected exactly 1 user, got %d", count)
	}
}

func TestSeedAdministratorConditionIgnoresPlainUsers(t *testing.T) {
	db := newTestDB(t)
	if err := SeedUserGroups(db); err != nil {
		t.Fatalf("SeedUserGroups: %v", err)
	}
	// A regular user does not satisfy the "has administrator" condition.
	if err := db.Create(&usermodel.User{
		ID:          "regular-1",
		PubID:       "usr_regular1",
		Username:    "regular",
		PasswdHash:  "x",
		UserGroupID: "default",
	}).Error; err != nil {
		t.Fatalf("create regular user: %v", err)
	}

	created, err := SeedAdministrator(db, LiteDeveloper)
	if err != nil {
		t.Fatalf("SeedAdministrator: %v", err)
	}
	if !created {
		t.Error("developer account must still be seeded when only plain users exist")
	}
}

func TestAdministratorAccount(t *testing.T) {
	db := newTestDB(t)
	if err := SeedUserGroups(db); err != nil {
		t.Fatalf("SeedUserGroups: %v", err)
	}
	if _, err := SeedAdministrator(db, LiteDeveloper); err != nil {
		t.Fatalf("SeedAdministrator: %v", err)
	}

	clients := &Clients{DB: db}
	info, exists, err := clients.AdministratorAccount()
	if err != nil {
		t.Fatalf("AdministratorAccount: %v", err)
	}
	if !exists {
		t.Fatal("expected an administrator account")
	}
	if info.Username != LiteDeveloper.Username {
		t.Errorf("username = %q, want %q", info.Username, LiteDeveloper.Username)
	}
	if info.GroupName != AdministratorGroupName {
		t.Errorf("group = %q, want %q", info.GroupName, AdministratorGroupName)
	}
	if info.Email != LiteDeveloper.Email {
		t.Errorf("email = %q, want %q", info.Email, LiteDeveloper.Email)
	}
}

func TestAdministratorAccountMissing(t *testing.T) {
	db := newTestDB(t)
	clients := &Clients{DB: db}
	_, exists, err := clients.AdministratorAccount()
	if err != nil {
		t.Fatalf("AdministratorAccount: %v", err)
	}
	if exists {
		t.Error("expected no administrator account")
	}
}
