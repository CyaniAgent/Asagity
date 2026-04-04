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
- shared HTTP helpers and middleware exist under `internal/platform/httpx`
- these modules already have backend skeletons:
  - `instance`
  - `auth`
  - `user`
  - `asset`
- protocol placeholder packages already exist:
  - `internal/app/connections/activitypub/inbox`
  - `internal/app/connections/activitypub/deliver`
  - `internal/app/connections/neolinkage`
- basic endpoints already exist:
  - `GET /`
  - `GET /healthz`
  - `GET /api/meta/version`
  - `GET /api/meta/instance`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`

### Present but still placeholder-level

- `POST /api/auth/register/verify-email`
- `POST /api/auth/login/verify-email`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
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

- true refresh-token cookie flow
- Redis-backed registration context
- email challenge generation and verification
- pubid login path
- device trust management
- SSR refresh flow
- Drive and Drop modules
- queue runtime
- local social APIs
- federation logic

## Delivery Priorities

The current recommended order is:

1. stabilize auth and user foundation
2. complete instance metadata and settings
3. build Drive domain
4. build Drop resumable transfer
5. add queue and background jobs
6. build local social core
7. build notifications
8. build federation

This differs slightly from the earliest draft because auth and user are now partially implemented and are already blocking frontend progress.

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

### Exit Criteria

- backend starts with explicit validation
- health and readiness checks are both stable
- infrastructure concerns stop leaking into module code

## Phase 1: Auth, User, And Instance

### Status

In progress.

### Already done

- user model, group model, and pubid history model
- auth device, refresh token, and email challenge models
- instance version and instance metadata endpoints
- register, login, and me handlers

### Still needed

- register with optional email instead of mandatory email in prototype DTO
- pubid login support
- Redis registration context
- email verification flow for register and login
- refresh-token rotation
- logout and logout-all
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

Not started.

### Deliverables

- drive folder model
- drive file model
- hierarchy and path handling
- file listing and metadata
- usage statistics
- storage abstraction

### Suggested APIs

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

## Phase 5: Local Social Core

### Status

Not started.

### Deliverables

- user-facing profile endpoints
- note model
- local timeline
- replies, reposts, reactions
- media attachment references into Drive

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

1. finish auth DTO and service alignment with the confirmed product rules
2. implement Redis registration context and email challenges
3. implement refresh-token cookie flow
4. convert `instance` from bootstrap metadata to real settings-backed responses
5. begin `drive` module scaffolding after auth is usable

## Practical Milestones

### Milestone A: Auth Bootstrap

- complete Phase 0
- complete auth and user parts of Phase 1

### Milestone B: Drive MVP

- complete Phase 2
- start Phase 3

### Milestone C: Upload Reliability

- complete Phase 3
- complete Phase 4

### Milestone D: Local Social MVP

- complete Phase 5
- complete Phase 6

### Milestone E: Federation Alpha

- begin Phase 7 after local domains are stable
