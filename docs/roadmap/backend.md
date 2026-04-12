# Backend Roadmap

## Purpose

This document tracks the backend delivery route for Asagity based on the repository state as of now.
It is no longer only a speculative plan.
It records what already exists, what is partially in place, and what should be built next.

## Current State

### Implemented now

- `core/cmd/api` and `core/cmd/worker` entrypoints exist
- `core/internal/app` assembles module registration
- PostgreSQL and Redis are initialized through `internal/platform/database`
- database auto-migration already includes:
  - `instance_settings`
  - `users`
  - `user_groups`
  - `user_pubid_changes`
  - `auth_devices`
  - `auth_refresh_tokens`
  - `auth_email_challenges`
  - `drive_files` (files, folders, usage tracking)
- shared HTTP helpers and middleware exist under `internal/platform/httpx`
- host system info endpoint (`/api/system/environment`) in Go backend
- Container configurations for both Docker and Podman:
  - `container/docker/docker-compose.yaml`
  - `container/podman/podman-compose.yaml` with startup scripts
- these modules already have backend skeletons:
  - `instance`
  - `auth`
  - `user`
  - `asset`
  - `drive` (full CRUD implemented)
- protocol placeholder packages already exist:
  - `internal/app/connections/activitypub/inbox`
  - `internal/app/connections/activitypub/deliver`
  - `internal/app/connections/neolinkage`
- full endpoints implemented:
  - `GET /`
  - `GET /healthz`
  - `GET /api/meta/version`
  - `GET /api/meta/instance`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `POST /api/auth/logout-all`
  - `GET /api/system/environment`

### Present but still placeholder-level

- `POST /api/auth/register/verify-email`
- `POST /api/auth/login/verify-email`
- `GET /api/users/me`

These routes compile and register, but some still return `501 Not Implemented` or simplified bootstrap responses.

### Frontend-backend integration status

- frontend dev server runs on port `2000`
- backend API runs on port `2048`
- Nuxt dev proxy now forwards:
  - `/api` -> `http://localhost:2048`
  - `/healthz` -> `http://localhost:2048/healthz`
- frontend health heartbeat depends on `GET /healthz`

This means the basic connectivity path is now:

```text
browser -> Nuxt dev server (:2000) -> dev proxy -> Go API (:2048)
```

## What Is Still Missing

- email verification flow (register/login)
- pubid login path
- device trust management
- SSR refresh flow
- Drop resumable upload sessions
- queue runtime (Asynq integration)
- **Note module (notes, timeline, reactions, reposts)**
- **Bleve search with multi-language segmentation (zh/ja/ko)**
- preview card generation
- federation logic

## Delivery Priorities

The current recommended order is:

1. stabilize auth and user foundation
2. complete instance metadata and settings
3. build Drive domain
4. build Drop resumable transfer
5. add queue and background jobs
6. **build Note module (local social core + Bleve search)**
7. build notifications
8. build federation

This differs slightly from the earliest draft because auth and user are now partially implemented and are already blocking frontend progress.

**Note Module Development Flow:**

```
Phase 5.1: Core Note Structure
  ├── model/models.go (Note, NoteEdit, Reaction)
  ├── dto/dto.go (CreateNote, NoteResponse, etc.)
  ├── repository/repository.go (CRUD + queries)
  ├── service/service.go (business logic)
  ├── handler/handler.go (HTTP endpoints)
  └── module.go (route registration)

Phase 5.2: Interactions
  ├── Repost (pure)
  ├── Quote repost
  ├── Reactions (unlimited emoji)
  └── Reply chain (root_id, parent_id)

Phase 5.3: Media & Polls
  ├── Media attachments (link to Drive)
  ├── Polls (max 20 options)
  └── Preview cards (OG tags)

Phase 5.4: Timelines
  ├── Home timeline (TopRank)
  ├── Local timeline
  ├── Public timeline
  └── Hashtag timeline

Phase 5.5: Search & Federation
  ├── Bleve indexing with multi-language tokenizer
  ├── Search API (title, content, user, hashtag)
  ├── ActivityPub delivery
  └── Neo Linkage delivery
```

## Phase 0: Service Foundation

### Status

Partially complete.

### Already done

- startup split into `cmd/api` and `cmd/worker`
- shared config loader
- database and Redis bootstrap
- JSON envelope helpers
- auth middleware skeleton
- health check endpoint
- module registration through `internal/app`

### Still needed

- request logging
- request ID middleware
- readiness endpoint `GET /readyz`
- stronger config validation
- cleaner error mapping and typed domain errors
- Bleve index initialization and health check

### Exit Criteria

- backend starts with explicit validation
- health and readiness checks are both stable
- infrastructure concerns stop leaking into module code

## Phase 1: Auth, User, And Instance

### Status

Mostly complete.

### Already done

- user model, group model, and pubid history model
- auth device, refresh token, and email challenge models
- instance version and instance metadata endpoints
- register, login, and me handlers
- refresh-token rotation with 30min access / 30day refresh
- logout and logout-all handlers
- Redis-backed refresh token storage
- initial user seeding (username: `instance`, password: `Asagity1234`)
- host system info endpoint via `/api/system/environment`

### Still needed

- register with optional email instead of mandatory email in prototype DTO
- pubid login support
- email verification flow for register and login
- trusted device logic
- owner/setup-wizard bootstrap relationship
- real instance settings update endpoints

### Suggested APIs

- `GET /api/meta/instance`
- `GET /api/meta/version`
- `GET /api/settings/instance`
- `PATCH /api/settings/instance`
- `POST /api/auth/register`
- `POST /api/auth/register/verify-email`
- `POST /api/auth/login`
- `POST /api/auth/login/verify-email`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/me`

### Exit Criteria

- frontend login and registration pages can use real backend flows
- SSR session restoration works
- instance store can stop relying on mock metadata

## Phase 2: Skyline Drive Core

### Status

Complete.

### Already done

- drive folder model with hierarchy support
- drive file model with metadata
- file listing and metadata endpoints
- usage statistics (`GET /api/drive/usage`)
- storage abstraction with local storage
- full CRUD operations:
  - `GET /api/drive/files`
  - `GET /api/drive/files/:id`
  - `POST /api/drive/folders`
  - `PATCH /api/drive/files/:id`
  - `DELETE /api/drive/files/:id`
  - `POST /api/drive/files/:id` (upload)
- local storage priority with configurable path
- Drop page UI with solar system layout

### Suggested APIs (implemented)

- `GET /api/drive/files`
- `GET /api/drive/files/:id`
- `POST /api/drive/folders`
- `PATCH /api/drive/files/:id`
- `DELETE /api/drive/files/:id`
- `GET /api/drive/usage`

## Phase 3: Drop Upload Sessions

### Status

Documented, not implemented.

### Hard requirements

- authenticated users only
- internet transfer only for now
- resumable upload is mandatory
- sender, receiver, and session concepts all exist

### Suggested APIs

- `POST /api/drop/sender/sessions`
- `GET /api/drop/sender/sessions/:id`
- `PUT /api/drop/sender/sessions/:id/parts/:partNumber`
- `POST /api/drop/sender/sessions/:id/complete`
- `POST /api/drop/sender/sessions/:id/cancel`
- `GET /api/drop/receiver/inbox`
- `GET /api/drop/session/:id`

## Phase 4: Queue And Background Processing

### Status

Not started.

### Deliverables

- Asynq integration
- upload finalize jobs
- expired-session cleanup
- object verification
- media inspection hooks

## Phase 5: Local Social Core (Note Module)

### Status

Not started.

### Infrastructure Dependencies

- **Search Engine**: Bleve (Pure Go, no external service required)
- **Segmentation Libraries**: Multi-language support

#### Search Stack

| Language | Library | Package |
|----------|---------|---------|
| Chinese | gse | `github.com/go-ego/gse` |
| Japanese | sudachi | `github.com/shogo82148/sudachi` |
| Korean | Open Korean Text | `github.com/open-korean-text/opentokenizer` |
| English (default) | Bleve built-in | `github.com/blevesearch/bleve` |

#### Search Index Storage

```go
// Local file-based index storage
indexPath := "./storage/search/notes"
index, _ := bleve.New(indexPath, bleve.NewIndexMapping())
```

#### Config Fields

```go
type Config struct {
    SearchIndexPath string  // default: ./storage/search
    SearchEnabled   bool    // default: true
    SearchWorkers   int     // default: runtime.NumCPU()
}
```

### Note Module Data Model

#### Core Fields
- `id`: Internal primary key
- `pubid`: Public-facing ID (`nt_` + 8 random chars)
- `user_id`: Author reference
- `root_id`: Root post ID (for reply chains)
- `parent_id`: Direct parent post ID (for replies)
- `title`: Optional title (max 200 chars)
- `content`: Post body (max 10000 chars)
- `cw`: Content Warning text (optional)

#### Visibility
- `visibility`: `public` | `unlisted` | `private` | `direct`
- `visible_users`: Array of user IDs for circle-style visibility

#### Post Types
- `type`: `note` | `repost` | `quote` | `reply`

#### State
- `is_draft`: Boolean for draft posts
- `scheduled_at`: Scheduled publish time (nullable)
- `deleted_at`: Soft delete timestamp (nullable)

#### Media & Attachments
- `media_ids`: Array of drive file IDs
- Each media has: type (image/video/audio/poll), sensitive flag, alt text

#### Reactions
- Type: OpenMoji / FluentUI Emoji support
- User can add unlimited reactions
- Real-time count updates

#### Polls
- Max 20 options
- Duration: permanent to configurable
- Vote tracking per user

### Note Module API Design

```
POST   /api/notes              # Create note (supports draft/scheduled)
GET    /api/notes/:id          # Get single note
PATCH  /api/notes/:id          # Update note (creates edit history)
DELETE /api/notes/:id          # Soft delete

POST   /api/notes/:id/repost  # Pure repost
POST   /api/notes/:id/quote   # Quote repost with comment
POST   /api/notes/:id/react   # Add reaction
DELETE /api/notes/:id/react   # Remove reaction

GET    /api/notes/:id/replies # Get reply chain
GET    /api/notes/:id/reactions # Get reaction list

GET    /api/timeline/home     # Home timeline (following)
GET    /api/timeline/local    # Local timeline (instance only)
GET    /api/timeline/public   # Public timeline
GET    /api/timeline/tag/:tag  # Hashtag timeline

GET    /api/search/notes      # Search notes (Bleve)
```

### Note Module Features

#### Draft & Scheduled Posts
- Draft expiration based on user settings
- Scheduled posts processed by background job

#### Preview Cards (Open Graph)
- Synchronous fetch on note creation
- 30-day cache in Redis
- No card shown on fetch failure
- Queue job for background refresh

#### Timeline Algorithm (TopRank)
```
score = (likes + reposts + replies + reactions) * 6 - time_diff
time_diff = minutes_since_post * 0.1  (minimum 0.1 per 6 seconds)
```
- Sort by score descending
- Secondary sort by recency for tied scores

#### Soft Delete & Edit History
- Deleted notes return 410 Gone
- Edit history preserved in separate table
- Original content accessible via API

#### Media Processing
- Thumbnail generation (images, video frames)
- Video transcoding (configurable resolutions)
- Background job queue via Asynq

### Deliverables

- note model with full field support
- local timeline with TopRank algorithm
- replies, reposts (pure + quote), reactions
- media attachment references into Drive
- Bleve full-text search with multi-language segmentation
- preview card generation and caching
- draft and scheduled post handling
- edit history preservation
- soft delete with 410 Gone response

## Phase 6: Notifications

### Status

Not started.

### Deliverables

- notification persistence
- unread counts
- read operations

## Phase 7: Federation

### Status

Directory structure prepared, implementation not started.

### Deliverables

- shared federation domain
- ActivityPub inbox handling
- ActivityPub delivery
- remote actor/object persistence
- retryable outbound queue flow
- Neo Linkage remains placeholder until protocol design exists

## Immediate Next Work

The next backend work should be:

1. implement email verification flow (register/login)
2. implement pubid login support
3. build Drop module for resumable upload sessions
4. integrate Asynq queue for background jobs (thumbnail generation, media scanning)
 5. **build Note module (local social core) with Bleve search**
   6. build notifications system

### Phase 5 Implementation Order

1. **Phase 5.1: Core Note Structure**
   - Create `internal/module/note/` directory
   - Implement note model with all fields
   - Basic CRUD handlers (create, read, update, soft delete)
   - Repository layer with GORM

2. **Phase 5.2: Interactions**
   - Repost and quote repost
   - Reactions (add/remove)
   - Reply chain with root_id/parent_id

3. **Phase 5.3: Media & Polls**
   - Media attachment handling (link to drive files)
   - Poll creation and voting
   - Preview card generation

4. **Phase 5.4: Timelines**
   - Home timeline (following)
   - Local timeline (instance only)
   - Public timeline
   - Hashtag timeline
   - TopRank algorithm implementation

 5. **Phase 5.5: Search & Federation**
   - Bleve search integration with multi-language tokenizer
   - Note indexing (public/unlisted only)
   - Search API (title, content, user, hashtag)
   - ActivityPub note delivery

## Practical Milestones

### Milestone A: Auth Bootstrap ✅

- complete Phase 0 ✅
- complete auth and user parts of Phase 1 (mostly ✅)

### Milestone B: Drive MVP ✅

- complete Phase 2 ✅
- start Phase 3 (pending)

### Milestone C: Upload Reliability

- complete Phase 3 (Drop resumable upload)
- complete Phase 4 (Queue integration)

### Milestone D: Local Social MVP

- complete Phase 5.1 (core note structure)
- complete Phase 5.2 (reposts, reactions, replies)
- complete Phase 5.3 (media, polls, preview cards)
- complete Phase 5.4 (timelines with TopRank)
- complete Phase 6 (notifications)

### Milestone E: Search & Intelligence

- complete Bleve search integration
- complete multi-language tokenizer (zh, ja, ko)
- complete Phase 5.5 (search API)
- implement smart search with filters

### Milestone F: Federation Alpha

- begin Phase 7 after local domains are stable
- ActivityPub note delivery
- Neo Linkage placeholder
