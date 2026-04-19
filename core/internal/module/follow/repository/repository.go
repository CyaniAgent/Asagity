package repository

import (
	followmodel "github.com/CyaniAgent/Asagity/core/internal/module/follow/model"
	usermodel "github.com/CyaniAgent/Asagity/core/internal/module/user/model"
	"gorm.io/gorm"
)

type FollowRepository struct {
	DB *gorm.DB
}

func NewFollowRepository(db *gorm.DB) *FollowRepository {
	return &FollowRepository{DB: db}
}

func (r *FollowRepository) AutoMigrate() error {
	return r.DB.AutoMigrate(
		&followmodel.Follow{},
	)
}

// Create - 创建关注关系
func (r *FollowRepository) Create(follow *followmodel.Follow) error {
	return r.DB.Create(follow).Error
}

// Find - 查找关注关系
func (r *FollowRepository) Find(followerID, followingID string) (*followmodel.Follow, error) {
	var follow followmodel.Follow
	err := r.DB.Where("follower_id = ? AND following_id = ?", followerID, followingID).First(&follow).Error
	if err != nil {
		return nil, err
	}
	return &follow, nil
}

// FindAllPendingRequests - 查找待处理的关注请求
func (r *FollowRepository) FindAllPendingRequests(userID string) ([]followmodel.Follow, error) {
	var follows []followmodel.Follow
	err := r.DB.Where("following_id = ? AND status = ?", userID, followmodel.FollowStatusPending).Find(&follows).Error
	return follows, err
}

// FindFollowers - 查找用户的粉丝
func (r *FollowRepository) FindFollowers(userID string, cursor string, limit int) ([]followmodel.Follow, string, error) {
	var follows []followmodel.Follow
	query := r.DB.Where("following_id = ? AND status = ?", userID, followmodel.FollowStatusAccepted)

	if cursor != "" {
		query = query.Where("id < ?", cursor)
	}

	err := query.Order("id DESC").Limit(limit + 1).Find(&follows).Error

	if err != nil {
		return nil, "", err
	}

	nextCursor := ""
	if len(follows) > limit {
		nextCursor = follows[limit].ID
		follows = follows[:limit]
	}

	return follows, nextCursor, nil
}

// FindFollowing - 查找用户关注的人
func (r *FollowRepository) FindFollowing(userID string, cursor string, limit int) ([]followmodel.Follow, string, error) {
	var follows []followmodel.Follow
	query := r.DB.Where("follower_id = ? AND status = ?", userID, followmodel.FollowStatusAccepted)

	if cursor != "" {
		query = query.Where("id < ?", cursor)
	}

	err := query.Order("id DESC").Limit(limit + 1).Find(&follows).Error

	if err != nil {
		return nil, "", err
	}

	nextCursor := ""
	if len(follows) > limit {
		nextCursor = follows[limit].ID
		follows = follows[:limit]
	}

	return follows, nextCursor, nil
}

// GetUserByID - 查找用户
func (r *FollowRepository) GetUserByID(userID string) (*usermodel.User, error) {
	var user usermodel.User
	err := r.DB.Where("id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Delete - 删除关注关系
func (r *FollowRepository) Delete(followerID, followingID string) error {
	return r.DB.Where("follower_id = ? AND following_id = ?", followerID, followingID).Delete(&followmodel.Follow{}).Error
}

// UpdateStatus - 更新关注状态
func (r *FollowRepository) UpdateStatus(followID string, status followmodel.FollowStatus) error {
	return r.DB.Model(&followmodel.Follow{}).Where("id = ?", followID).Update("status", status).Error
}

// CountFollowers - 统计粉丝数
func (r *FollowRepository) CountFollowers(userID string) (int64, error) {
	var count int64
	err := r.DB.Model(&followmodel.Follow{}).Where("following_id = ? AND status = ?", userID, followmodel.FollowStatusAccepted).Count(&count).Error
	return count, err
}

// CountFollowing - 统计关注数
func (r *FollowRepository) CountFollowing(userID string) (int64, error) {
	var count int64
	err := r.DB.Model(&followmodel.Follow{}).Where("follower_id = ? AND status = ?", userID, followmodel.FollowStatusAccepted).Count(&count).Error
	return count, err
}

// IsFollowing - 检查是否已关注
func (r *FollowRepository) IsFollowing(followerID, followingID string) (bool, error) {
	var count int64
	err := r.DB.Model(&followmodel.Follow{}).Where("follower_id = ? AND following_id = ? AND status = ?", followerID, followingID, followmodel.FollowStatusAccepted).Count(&count).Error
	return count > 0, err
}

// HasFollowRequestPending - 检查是否有待处理的关注请求
func (r *FollowRepository) HasFollowRequestPending(followerID, followingID string) (bool, error) {
	var count int64
	err := r.DB.Model(&followmodel.Follow{}).Where("follower_id = ? AND following_id = ? AND status = ?", followerID, followingID, followmodel.FollowStatusPending).Count(&count).Error
	return count > 0, err
}

// GetFollowingUserIDs - 获取用户关注的所有用户ID（用于Home Timeline）
func (r *FollowRepository) GetFollowingUserIDs(userID string) ([]string, error) {
	var follows []followmodel.Follow
	err := r.DB.Where("follower_id = ? AND status = ?", userID, followmodel.FollowStatusAccepted).Find(&follows).Error
	if err != nil {
		return nil, err
	}

	ids := make([]string, 0, len(follows)+1)
	ids = append(ids, userID) // 包含自己的帖子
	for _, f := range follows {
		ids = append(ids, f.FollowingID)
	}
	return ids, nil
}

// FindByID - 通过ID查找关注关系
func (r *FollowRepository) FindByID(followID string) (*followmodel.Follow, error) {
	var follow followmodel.Follow
	err := r.DB.Where("id = ?", followID).First(&follow).Error
	if err != nil {
		return nil, err
	}
	return &follow, nil
}
