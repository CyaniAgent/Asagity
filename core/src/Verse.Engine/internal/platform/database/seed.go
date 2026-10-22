package database

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	usermodel "github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/module/user/model"
	"github.com/CyaniAgent/Asagity/core/src/Verse.Engine/internal/platform/id"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AdministratorGroupID is the user-group id that marks administrator
// accounts. Seeding keys off this group: an instance that already has an
// administrator is never re-seeded.
const AdministratorGroupID = "admin"

// AdministratorGroupName is the human-readable name of that group.
const AdministratorGroupName = "Administrator"

// AccountSpec describes the account seeded on a fresh database.
type AccountSpec struct {
	// ID is the fixed primary key; empty means random.
	ID string
	// PubID is the fixed public id; empty means generated (usr_XXXXXXXX).
	PubID string
	// Username follows the ActivityPub/Misskey actor style "local@instance".
	Username string
	Email    string
	Password string
	Name     string
	// GroupID is the user-group id (defaults to AdministratorGroupID).
	GroupID string
}

// ProductionAdministrator is the default administrator of a production
// instance. The password is a documented bootstrap credential and should be
// rotated by the instance owner after the first login.
var ProductionAdministrator = AccountSpec{
	ID:       "00000000000000000000000000000001",
	PubID:    "usr_asagity0",
	Username: "asagity_admin",
	Email:    "admin@asagity.local",
	Password: "Asagity1234",
	Name:     "Asagity Administrator",
	GroupID:  AdministratorGroupID,
}

// LiteDeveloper is the default developer account of the developing lite
// mode. It is seeded into the local SQLite database so a fresh checkout can
// log in immediately; the fixed password is dev-only by design.
var LiteDeveloper = AccountSpec{
	Username: "Asagity-dev@asagity.example",
	Email:    "example@example.com",
	Password: "Asagity-dev1234",
	Name:     "Asagity Developer",
	GroupID:  AdministratorGroupID,
}

// userGroups are the built-in permission groups of every instance.
func userGroups() []usermodel.UserGroup {
	now := time.Now()
	return []usermodel.UserGroup{
		{ID: AdministratorGroupID, Name: AdministratorGroupName, Code: AdministratorGroupID, Description: "System administrators", CreatedAt: now},
		{ID: "moderator", Name: "Moderator", Code: "moderator", Description: "Content moderators", CreatedAt: now},
		{ID: "default", Name: "User", Code: "user", Description: "Regular users", CreatedAt: now},
	}
}

// SeedUserGroups creates the built-in permission groups when missing.
func SeedUserGroups(db *gorm.DB) error {
	var count int64
	if err := db.Model(&usermodel.UserGroup{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	groups := userGroups()
	return db.Create(&groups).Error
}

// HasAdministrator reports whether the instance already owns at least one
// account inside the administrator group. This is the seeding condition:
// the account is only created when the instance has no administrator at all.
func HasAdministrator(db *gorm.DB) (bool, error) {
	var count int64
	err := db.Model(&usermodel.User{}).Where("user_group_id = ?", AdministratorGroupID).Count(&count).Error
	return count > 0, err
}

// SeedAdministrator creates the administrator described by spec when the
// instance has no administrator yet. It reports whether a row was created.
//
// The password is hashed with bcrypt exactly like the registration flow, so
// seeded accounts can log in through the regular auth endpoints.
func SeedAdministrator(db *gorm.DB, spec AccountSpec) (bool, error) {
	exists, err := HasAdministrator(db)
	if err != nil {
		return false, err
	}
	if exists {
		return false, nil
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(spec.Password), bcrypt.DefaultCost)
	if err != nil {
		return false, err
	}

	groupID := spec.GroupID
	if groupID == "" {
		groupID = AdministratorGroupID
	}
	accountID := spec.ID
	if accountID == "" {
		accountID, err = randomID()
		if err != nil {
			return false, err
		}
	}
	pubID := spec.PubID
	if pubID == "" {
		pubID = id.GenerateUserPubID()
	}

	email := spec.Email
	account := &usermodel.User{
		ID:          accountID,
		PubID:       pubID,
		Username:    spec.Username,
		Email:       &email,
		PasswdHash:  string(hashed),
		Name:        spec.Name,
		UserGroupID: groupID,
		CreatedAt:   time.Now(),
	}

	if err := db.Create(account).Error; err != nil {
		return false, fmt.Errorf("seed administrator %q: %w", spec.Username, err)
	}
	return true, nil
}

// AdministratorInfo describes the seeded administrator account without ever
// exposing its password.
type AdministratorInfo struct {
	Username  string `json:"username"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	GroupID   string `json:"group_id"`
	GroupName string `json:"group"`
	PubID     string `json:"pub_id"`
}

// AdministratorAccount returns the first administrator account of the
// instance. The second return value is false when the instance has none.
func (c *Clients) AdministratorAccount() (AdministratorInfo, bool, error) {
	var account usermodel.User
	err := c.DB.Where("user_group_id = ?", AdministratorGroupID).Order("created_at asc").First(&account).Error
	if err == gorm.ErrRecordNotFound {
		return AdministratorInfo{}, false, nil
	}
	if err != nil {
		return AdministratorInfo{}, false, err
	}

	info := AdministratorInfo{
		Username:  account.Username,
		Name:      account.Name,
		GroupID:   account.UserGroupID,
		GroupName: AdministratorGroupName,
		PubID:     account.PubID,
	}
	if account.Email != nil {
		info.Email = *account.Email
	}

	var group usermodel.UserGroup
	if err := c.DB.Where("id = ?", account.UserGroupID).First(&group).Error; err == nil {
		info.GroupName = group.Name
	}

	return info, true, nil
}

// randomID returns a 32-character hex identifier.
func randomID() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}
