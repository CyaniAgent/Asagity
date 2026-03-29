# Backend Roadmap

## Purpose

This document defines the backend delivery route for Asagity.
It is based on the current repository state:

- `core` currently contains only bootstrap code, database wiring, and instance settings
- `web` already contains product-facing pages for timeline, drive, drop, notifications, panel, and settings
- `docs/api/drive/drop.md` already defines the first concrete backend draft for upload ingest

The goal is to avoid building the backend as a set of disconnected APIs.
Instead, the backend should grow in layers: foundation first, then file capabilities, then social core, then federation.

## Current State

### Already present

- Go backend bootstrap
- PostgreSQL connection via GORM
- Redis connection
- instance settings model and default seed

### Not yet present

- API routing structure
- authentication and session model
- user model
- drive and drop persistence
- storage backend abstraction
- task queue workers
- timeline, post, reaction, follow, and notification APIs
- ActivityPub implementation

## Backend Priorities

The recommended order is:

1. establish backend foundation and API conventions
2. expose instance and settings APIs
3. implement Skyline Drive file domain
4. implement Drop upload sessions and resumable transfer
5. add asynchronous processing with queue workers
6. implement local social core
7. implement notification center
8. implement federation and ActivityPub delivery

This order is intentional:

- Drive and Drop are already documented and clearly scoped
- the frontend can be connected to real data early
- social federation is the most complex part and depends on stable local models first

## Phase 0: Foundation

### Target

Turn `core` from a bootstrap program into a structured service.

### Deliverables

- consistent HTTP router and route grouping
- config loader and environment validation
- structured error response format
- request logging and request ID middleware
- health check and readiness endpoints
- shared database and Redis access patterns
- repository and service layer conventions

### Suggested APIs

- `GET /healthz`
- `GET /readyz`
- `GET /api/meta/version`

### Exit Criteria

- backend starts with explicit config validation
- APIs return a stable JSON envelope
- new modules can be added without editing unrelated startup code

## Phase 1: Instance Metadata And Settings

### Why first

The frontend layout already depends on instance name, alias, description, version, and logo.
This is the smallest useful slice to replace hardcoded frontend state.

### Deliverables

- public instance metadata endpoint
- admin or owner settings read/update endpoints
- logo and branding metadata fields
- cached instance settings reads

### Suggested APIs

- `GET /api/meta/instance`
- `GET /api/settings/instance`
- `PATCH /api/settings/instance`

### Data scope

- instance name
- short alias
- description
- version label
- logo URL
- privacy policy URL
- terms of service URL
- contact URI

### Exit Criteria

- frontend instance store can switch from mock state to server data
- panel and settings pages can read and update instance-level metadata

## Phase 2: Skyline Drive Core

### Why next

Drive is one of the clearest product promises in the README and already has a dedicated page in the frontend.
Before resumable upload, the backend needs a file domain and a storage abstraction.

### Deliverables

- drive folder model
- drive file model
- path and hierarchy support
- file and folder listing
- capacity usage statistics
- folder creation and metadata update
- file metadata retrieval
- storage backend abstraction for local and S3-compatible storage

### Suggested APIs

- `GET /api/drive/files`
- `GET /api/drive/files/:id`
- `POST /api/drive/folders`
- `PATCH /api/drive/files/:id`
- `DELETE /api/drive/files/:id`
- `GET /api/drive/usage`

### Exit Criteria

- drive page can render real folders and files
- usage bar and breadcrumb navigation can be backed by server data
- storage writes and file records are no longer mixed into one-off code paths

## Phase 3: Drop Upload Sessions

### Why next

Drop is already documented and has stronger backend requirements than the rest of the UI.
It also establishes patterns needed later for media attachments in posts.

### Non-negotiable constraints

- authenticated users only
- internet transfer, not LAN discovery for now
- resumable upload is required
- sender, receiver, and management concepts all exist, but initial implementation can focus on session and upload plumbing first

### Deliverables

- upload intent creation
- upload session persistence
- chunked upload endpoints
- upload progress tracking
- resume support
- complete, cancel, and expire flows
- final file commit into drive storage

### Suggested APIs

- `POST /api/drop/sender/sessions`
- `GET /api/drop/sender/sessions/:id`
- `PUT /api/drop/sender/sessions/:id/parts/:partNumber`
- `POST /api/drop/sender/sessions/:id/complete`
- `POST /api/drop/sender/sessions/:id/cancel`
- `GET /api/drop/receiver/inbox`
- `GET /api/drop/session/:id`

### Exit Criteria

- large file upload works with interruption and resume
- upload session status survives process restarts
- completed uploads create drive file records

## Phase 4: Queue And Background Processing

### Why after Drop

As soon as uploads exist, synchronous request handlers become the wrong place for expensive follow-up work.
The README already points to Asynq, so this phase should formalize that direction.

### Deliverables

- Asynq integration
- task producer and worker separation
- upload finalize jobs
- hash verification jobs
- cleanup jobs for expired sessions and stale parts
- media inspection or thumbnail generation hooks

### Suggested job groups

- `drop.finalize`
- `drop.cleanup_expired`
- `drive.generate_preview`
- `drive.verify_object`
- `federation.deliver`

### Exit Criteria

- request latency is decoupled from heavy background work
- retries and failure handling are visible and controlled

## Phase 5: Local Social Core

### Why only now

Federation should not be the first social milestone.
The project needs correct local models first: users, posts, reactions, follows, timelines, and media attachments.

### Deliverables

- user model
- account profile endpoints
- note or post model
- local timeline query
- reply support
- repost support
- reaction support
- attachment references into drive files

### Suggested APIs

- `GET /api/users/:id`
- `GET /api/timeline/home`
- `GET /api/timeline/local`
- `POST /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes/:id/reply`
- `POST /api/notes/:id/repost`
- `POST /api/notes/:id/reactions`

### Exit Criteria

- timeline page can run on real backend data
- post detail and user profile views can be connected without frontend-only mocks

## Phase 6: Notifications

### Why separate from social core

Notifications depend on social events but should remain its own module.
The frontend already expects typed notifications with read state and filtering.

### Deliverables

- notification persistence
- unread counters
- mark-read and mark-all-read operations
- typed notification rendering payloads

### Suggested APIs

- `GET /api/notifications`
- `POST /api/notifications/:id/read`
- `POST /api/notifications/read-all`
- `GET /api/notifications/unread-count`

### Exit Criteria

- notification center can replace frontend mock data
- timeline actions generate user-visible notification events

## Phase 7: Federation

### Why last

ActivityPub is core to the product vision but should be built on top of stable local domains.
Trying to build federation before local drive, post, user, and queue infrastructure will create avoidable rework.

### Deliverables

- actor representation
- inbox and outbox handling
- object serialization
- remote fetch and delivery workers
- signature verification
- idempotency and retry handling
- remote account and remote object persistence

### Exit Criteria

- local posts can be delivered outward
- remote activities can be accepted and applied safely
- queue-backed federation retries are operational

## Cross-Cutting Work

These concerns should be introduced early and expanded phase by phase:

- authentication and authorization
- audit logging for destructive actions
- API versioning rules
- rate limiting
- object storage policy
- observability and metrics
- test strategy for repository, service, and HTTP layers

## Suggested Milestone Cuts

### Milestone A: Service Base

- Phase 0
- Phase 1

### Milestone B: Drive MVP

- Phase 2
- minimum of Phase 3

### Milestone C: Upload Production Readiness

- full Phase 3
- Phase 4

### Milestone D: Local Social MVP

- Phase 5
- Phase 6

### Milestone E: Federation Alpha

- Phase 7

## Immediate Next Work

The next backend work should focus on:

1. defining the backend module structure
2. defining route ownership by module
3. introducing a service and repository split
4. implementing instance metadata APIs
5. preparing the Drive and Drop modules as the first real business domains
