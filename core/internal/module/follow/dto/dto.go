package dto

// 错误常量
const (
	ErrAlreadyFollowing      = "ALREADY_FOLLOWING"
	ErrFollowNotAllowed      = "FOLLOW_NOT_ALLOWED"
	ErrCannotFollowSelf      = "CANNOT_FOLLOW_SELF"
	ErrFollowRequestNotFound = "FOLLOW_REQUEST_NOT_FOUND"
	ErrNotFollowing          = "NOT_FOLLOWING"
)

// FollowResponse - 关注关系响应
type FollowResponse struct {
	ID        string    `json:"id"`
	Follower  UserBasic `json:"follower"`
	Following UserBasic `json:"following"`
	Status    string    `json:"status"`
	CreatedAt string    `json:"created_at"`
}

// UserBasic - 用户基本信息
type UserBasic struct {
	ID          string `json:"id"`
	PubID       string `json:"pub_id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Avatar      string `json:"avatar"`
}

// FollowListResponse - 关注列表响应
type FollowListResponse struct {
	Followers []FollowResponse `json:"followers"`
	Following []FollowResponse `json:"following"`
	Cursor    *string          `json:"cursor,omitempty"`
}

// PaginationRequest - 分页请求
type PaginationRequest struct {
	Cursor string `json:"cursor"`
	Limit  int    `json:"limit"`
}

// FollowResponse - 关注关系响应（用于列表）
type FollowUserResponse struct {
	User      UserBasic `json:"user"`
	Followed  bool      `json:"followed"`  // 当前用户是否关注他
	Following bool      `json:"following"` // 他是否关注当前用户
}

// FollowCountResponse - 关注统计
type FollowCountResponse struct {
	FollowersCount int `json:"followers_count"`
	FollowingCount int `json:"following_count"`
}
