package service

import (
	"errors"
	"time"

	followdto "github.com/CyaniAgent/Asagity/core/internal/module/follow/dto"
	followmodel "github.com/CyaniAgent/Asagity/core/internal/module/follow/model"
	followrepo "github.com/CyaniAgent/Asagity/core/internal/module/follow/repository"
	"github.com/google/uuid"
)

type FollowService struct {
	repo *followrepo.FollowRepository
}

func NewFollowService(repo *followrepo.FollowRepository) *FollowService {
	return &FollowService{repo: repo}
}

// FollowUser - 关注用户
func (s *FollowService) FollowUser(followerID, followingID string) (*followmodel.Follow, error) {
	// 检查是否是自己
	if followerID == followingID {
		return nil, errors.New(followdto.ErrCannotFollowSelf)
	}

	// 获取目标用户
	targetUser, err := s.repo.GetUserByID(followingID)
	if err != nil {
		return nil, errors.New("USER_NOT_FOUND")
	}

	// 检查是否已关注
	isFollowing, err := s.repo.IsFollowing(followerID, followingID)
	if err != nil {
		return nil, err
	}
	if isFollowing {
		return nil, errors.New(followdto.ErrAlreadyFollowing)
	}

	// 检查是否有待处理的请求
	hasPending, err := s.repo.HasFollowRequestPending(followerID, followingID)
	if err != nil {
		return nil, err
	}
	if hasPending {
		return nil, errors.New("PENDING_REQUEST_EXISTS")
	}

	// 创建关注关系
	follow := &followmodel.Follow{
		ID:          uuid.NewString(),
		FollowerID:  followerID,
		FollowingID: followingID,
		Status:      followmodel.FollowStatusAccepted, // 默认直接接受
		CreatedAt:   time.Now(),
	}

	// 如果对方开启了需要同意的功能，则设为pending
	if targetUser.FollowRequestsEnabled {
		follow.Status = followmodel.FollowStatusPending
	}

	if err := s.repo.Create(follow); err != nil {
		return nil, err
	}

	return follow, nil
}

// UnfollowUser - 取消关注
func (s *FollowService) UnfollowUser(followerID, followingID string) error {
	return s.repo.Delete(followerID, followingID)
}

// AcceptFollowRequest - 接受关注请求
func (s *FollowService) AcceptFollowRequest(userID, followID string) error {
	// 查找待处理的关注请求
	follow, err := s.repo.FindByID(followID)
	if err != nil {
		return errors.New(followdto.ErrFollowRequestNotFound)
	}

	// 验证权限
	if follow.FollowingID != userID {
		return errors.New("FORBIDDEN")
	}

	return s.repo.UpdateStatus(followID, followmodel.FollowStatusAccepted)
}

// RejectFollowRequest - 拒绝关注请求
func (s *FollowService) RejectFollowRequest(userID, followID string) error {
	// 查找待处理的关注请求
	follow, err := s.repo.FindByID(followID)
	if err != nil {
		return errors.New(followdto.ErrFollowRequestNotFound)
	}

	// 验证权限
	if follow.FollowingID != userID {
		return errors.New("FORBIDDEN")
	}

	return s.repo.UpdateStatus(followID, followmodel.FollowStatusRejected)
}

// GetFollowers - 获取粉丝列表
func (s *FollowService) GetFollowers(userID, currentUserID string, cursor string, limit int) ([]followdto.FollowUserResponse, *string, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	follows, nextCursor, err := s.repo.FindFollowers(userID, cursor, limit)
	if err != nil {
		return nil, nil, err
	}

	// 构建响应
	responses := make([]followdto.FollowUserResponse, 0, len(follows))
	for _, follow := range follows {
		user, err := s.repo.GetUserByID(follow.FollowerID)
		if err != nil {
			continue // 跳过
		}

		isFollowed, _ := s.repo.IsFollowing(currentUserID, follow.FollowerID)
		isFollowing, _ := s.repo.IsFollowing(follow.FollowerID, currentUserID)

		responses = append(responses, followdto.FollowUserResponse{
			User: followdto.UserBasic{
				ID:          user.ID,
				PubID:       user.PubID,
				Username:    user.Username,
				DisplayName: user.Name,
				Avatar:      user.AvatarURL,
			},
			Followed:  isFollowed,
			Following: isFollowing,
		})
	}

	var nextCursorPtr *string
	if nextCursor != "" {
		nextCursorPtr = &nextCursor
	}

	return responses, nextCursorPtr, nil
}

// GetFollowing - 获取关注列表
func (s *FollowService) GetFollowing(userID, currentUserID string, cursor string, limit int) ([]followdto.FollowUserResponse, *string, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	follows, nextCursor, err := s.repo.FindFollowing(userID, cursor, limit)
	if err != nil {
		return nil, nil, err
	}

	responses := make([]followdto.FollowUserResponse, 0, len(follows))
	for _, follow := range follows {
		user, err := s.repo.GetUserByID(follow.FollowingID)
		if err != nil {
			continue // 跳过
		}

		isFollowed, _ := s.repo.IsFollowing(currentUserID, follow.FollowingID)
		isFollowing, _ := s.repo.IsFollowing(follow.FollowingID, currentUserID)

		responses = append(responses, followdto.FollowUserResponse{
			User: followdto.UserBasic{
				ID:          user.ID,
				PubID:       user.PubID,
				Username:    user.Username,
				DisplayName: user.Name,
				Avatar:      user.AvatarURL,
			},
			Followed:  isFollowed,
			Following: isFollowing,
		})
	}

	var nextCursorPtr *string
	if nextCursor != "" {
		nextCursorPtr = &nextCursor
	}

	return responses, nextCursorPtr, nil
}

// GetFollowCount - 获取关注统计
func (s *FollowService) GetFollowCount(userID string) (*followdto.FollowCountResponse, error) {
	followersCount, _ := s.repo.CountFollowers(userID)
	followingCount, _ := s.repo.CountFollowing(userID)

	return &followdto.FollowCountResponse{
		FollowersCount: int(followersCount),
		FollowingCount: int(followingCount),
	}, nil
}

// GetPendingRequests - 获取待处理的关注请求
func (s *FollowService) GetPendingRequests(userID string) ([]followdto.FollowUserResponse, error) {
	follows, err := s.repo.FindAllPendingRequests(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]followdto.FollowUserResponse, 0, len(follows))
	for _, follow := range follows {
		user, err := s.repo.GetUserByID(follow.FollowerID)
		if err != nil {
			continue // 跳过
		}

		responses = append(responses, followdto.FollowUserResponse{
			User: followdto.UserBasic{
				ID:          user.ID,
				PubID:       user.PubID,
				Username:    user.Username,
				DisplayName: user.Name,
				Avatar:      user.AvatarURL,
			},
			Followed:  false,
			Following: false,
		})
	}

	return responses, nil
}

// IsFollowing - 检查是否关注
func (s *FollowService) IsFollowing(followerID, followingID string) (bool, error) {
	return s.repo.IsFollowing(followerID, followingID)
}

// GetFollowingUserIDs - 获取关注的用户ID（用于Home Timeline）
func (s *FollowService) GetFollowingUserIDs(userID string) ([]string, error) {
	return s.repo.GetFollowingUserIDs(userID)
}
