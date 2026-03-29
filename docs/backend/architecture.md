# Backend Architecture

## Purpose

This document defines the target backend structure for Asagity Core.
It is not a description of the current codebase only.
It is a working architecture guide for how the backend should evolve as new modules are added.

The main design goal is to keep business logic out of HTTP handlers and out of infrastructure glue.
The backend should be modular enough for Drive, Drop, social features, and federation to grow independently without fragmenting the codebase.

## Current `core` Structure

The current backend directory is still early, but it already shows the intended concerns:

```text
core/
  api/
  assets/
  components/
    drive/
    drop/
  config/
  connections/
    activitypub/
    neolinkage/
  database/
  models/
  services/
  main.go
```

This is useful because it means the project is not starting from a blank folder.
The existing structure already suggests:

- `api` as HTTP-facing entrypoints
- `config` as configuration management
- `database` as persistence bootstrap
- `models` as shared data models
- `services` as business logic
- `connections` as protocol or external integration adapters
- `components/drive` and `components/drop` as early domain placeholders

The architecture below should therefore be read as an evolution path from this structure, not as an instruction to immediately discard it.

## Design Principles

### 1. Domain-first modules

Backend code should be grouped by domain capability, not only by technical layer.
For example:

- `instance`
- `auth`
- `drive`
- `drop`
- `timeline`
- `note`
- `notification`
- `federation`

This keeps each module cohesive and makes ownership clearer.

### 2. Handlers are thin

HTTP handlers should:

- parse input
- call a service
- map service results to JSON responses

Handlers should not:

- embed business rules
- directly orchestrate multiple storage backends
- manage queue semantics

### 3. Services hold business rules

Services are the real center of the backend.
They decide:

- validation beyond basic input shape
- permission checks
- state transitions
- transactional boundaries
- whether to write to cache, database, storage, or queue

### 4. Repositories isolate persistence

Repositories should be responsible for:

- database reads and writes
- query composition
- transactional helpers

Repositories should not:

- decide product behavior
- call unrelated external systems

### 5. Infrastructure stays replaceable

Storage backends, queue clients, cache clients, and federation transport should be abstracted behind interfaces where business domains depend on them.
This is especially important for Drive and Drop because the product already promises multiple storage backends.

## Recommended Evolution Direction

The backend should evolve from the current flat layout toward a clearer modular layout.
The likely long-term destination is:

```text
core/
  cmd/
    api/
    worker/
  internal/
    app/
    platform/
    module/
      instance/
      auth/
      drive/
      drop/
      user/
      note/
      timeline/
      notification/
      federation/
  migrations/
  pkg/
```

In practical terms, the migration path should be gradual:

1. keep the current top-level folders working
2. make `api`, `services`, `models`, and `connections` more disciplined
3. move domain-specific code out of generic folders and into module-owned packages
4. split API runtime and worker runtime when queue processing becomes real

That means the current structure is acceptable as a transitional stage.
The real issue is not folder names alone, but whether ownership and dependencies stay clean.

## Layer Overview

### `cmd/api`

API process entrypoint.

Responsibilities:

- load config
- initialize shared dependencies
- register HTTP routes
- start HTTP server

### `cmd/worker`

Background worker process entrypoint.

Responsibilities:

- initialize shared dependencies
- register Asynq handlers
- run background jobs

This separation matters because API servers and workers have different runtime behavior and scaling needs.

### `internal/app`

Application composition layer.

Responsibilities:

- wire modules together
- assemble route groups
- inject shared dependencies
- expose module registration hooks

This layer should know about modules, but not contain domain logic itself.

In the current codebase, some of this responsibility is still implicitly inside `main.go`.
That is fine for now, but it should eventually be extracted out of bootstrap code.

### `internal/platform`

Shared infrastructure layer.

Suggested subpackages:

- `config`
- `database`
- `cache`
- `queue`
- `httpx`
- `logger`
- `storage`
- `clock`
- `id`

Responsibilities:

- infrastructure clients
- cross-cutting middleware
- generic utilities
- external adapter implementations

In the current `core` structure, the closest existing folders are:

- `config`
- `database`
- part of `connections`

These can be treated as the present-day seeds of `internal/platform`.

### `internal/module`

Domain modules live here.
Each module should own its HTTP handlers, services, repositories, models, and queue hooks where applicable.

In the current `core` structure, `components/drive` and `components/drop` already point in this direction.
Those folders should be treated as the first domain modules rather than as generic utility components.

## Module Shape

Each business module should follow a consistent internal structure.

Example:

```text
internal/module/drive/
  handler/
  service/
  repository/
  model/
  dto/
  job/
  errors.go
  module.go
```

Suggested responsibilities:

- `handler/`: HTTP entrypoints
- `service/`: business logic
- `repository/`: persistence logic
- `model/`: database entities and domain state objects
- `dto/`: request and response payloads
- `job/`: queue task producers and consumers for that module
- `module.go`: route registration and dependency wiring for the module

Not every module needs every folder on day one, but the structure should be reserved.

For the current repository, a shorter transitional shape is acceptable.
For example, during the first refactor a module may temporarily look like:

```text
core/components/drop/
  api/
  service/
  model/
```

or:

```text
core/components/drive/
  handler/
  service/
  repository/
```

The important point is not exact naming.
The important point is that Drive code lives with Drive, and Drop code lives with Drop, instead of being spread across unrelated top-level folders.

## Core Runtime Flows

### API request flow

```text
HTTP Request
  -> Middleware
  -> Handler
  -> Service
  -> Repository / Storage / Queue
  -> Response
```

### Background job flow

```text
Queue Task
  -> Worker Handler
  -> Module Service
  -> Repository / Storage / External Delivery
  -> Retry or Complete
```

The important rule is that both HTTP and worker flows should converge on the same service layer.
That avoids duplicate business logic.

## Recommended Initial Modules

## `instance`

Purpose:

- serve public instance metadata
- manage instance configuration

Key responsibilities:

- instance name and alias
- descriptions and links
- branding assets
- public meta endpoint

This module already has a partial model and should be the first to become a full module.

Given the current structure, `instance` can begin by growing out of:

- `models/setting.go`
- `database/db.go`
- a future `api` handler for instance metadata

## `auth`

Purpose:

- authenticate users and secure private APIs

Key responsibilities:

- login session or token validation
- current user resolution
- permission checks

Even if full auth is not implemented immediately, a placeholder module should exist because Drive and Drop are authenticated features.

## `drive`

Purpose:

- represent persistent files and folders in Skyline Drive

Key responsibilities:

- folder hierarchy
- file metadata
- capacity usage
- file deletion and movement
- file attachment lookup for other domains

Dependencies:

- storage abstraction
- repository layer
- optional queue hooks for previews and verification

## `drop`

Purpose:

- ingest uploads into Drive through resumable sessions

Key responsibilities:

- sender-side upload session creation
- receiver-side visibility and acceptance concepts
- session state transitions
- chunk handling
- finalize and cancellation
- expiration cleanup

The Drop module should be treated as adjacent to Drive, not merged into it.
Drive owns persistent files.
Drop owns transfer sessions.

That separation prevents upload protocol concerns from leaking into normal file browsing logic.

Suggested internal subdomains:

- `sender`
- `receiver`
- `session`

The API may expose sender and receiver routes, but the service layer should still share one session model.

## `user`

Purpose:

- account identity and profile data

Key responsibilities:

- local user profile
- remote account representation later
- avatar and banner references
- profile preferences needed by UI

## `note`

Purpose:

- posts, replies, reposts, reactions, and attachments

Key responsibilities:

- create and fetch notes
- reply and repost relationships
- reaction counting
- attachment linking to drive files

## `timeline`

Purpose:

- produce assembled views over notes

Key responsibilities:

- home timeline
- local timeline
- filtered feeds later

Why separate from `note`:

- note is write-oriented and object-oriented
- timeline is query-oriented and presentation-oriented

This distinction becomes more important once federation or ranking enters the picture.

## `notification`

Purpose:

- user-facing event delivery and read state

Key responsibilities:

- notification generation
- unread counts
- filter views
- mark-read operations

## `federation`

Purpose:

- ActivityPub inbound and outbound behavior

Key responsibilities:

- actor and object serialization
- inbox and outbox handling
- remote delivery
- signature verification
- remote entity persistence

This module should depend on local domains like `user`, `note`, and `drive`, but those domains should not depend on federation internals.

Given the current structure, `connections/activitypub` is the obvious seed for this module.
It should eventually be folded into a more explicit federation-owned package structure rather than remaining a loose integration folder.

## Infrastructure Modules

The following should exist in `internal/platform` rather than business modules.

Until the backend is refactored into `internal/platform`, the current mapping can be treated like this:

- `core/config` -> future `platform/config`
- `core/database` -> future `platform/database`
- `core/connections` -> future `platform` adapters or federation-owned transport packages, depending on the integration
- `core/services` -> temporary service layer until services are moved into module ownership

## `config`

Responsibilities:

- parse environment variables
- validate required fields
- expose typed configuration

## `database`

Responsibilities:

- GORM setup
- transaction helpers
- migration hooks

## `cache`

Responsibilities:

- Redis client
- cache key helpers if useful

## `queue`

Responsibilities:

- Asynq client and server setup
- queue naming conventions
- retry policy helpers

## `storage`

Responsibilities:

- unified object storage interface
- local storage implementation
- S3-compatible implementation
- WebDAV implementation later

This is critical for Asagity because storage backend selection is a product feature, not a hidden implementation detail.

## `httpx`

Responsibilities:

- shared JSON response helpers
- request decoding helpers
- error mapping

## `logger`

Responsibilities:

- structured logs
- request correlation fields

## Recommended Dependency Direction

The intended direction is:

```text
handler -> service -> repository
handler -> service -> platform interfaces
job handler -> service -> repository
module -> platform
platform -> external libraries
```

Avoid the reverse:

- repositories calling handlers
- platform code depending on domain modules
- one domain module importing another module's handlers

Cross-module interaction should happen through services or explicit interfaces, not through leaking internal package details.

## Data Ownership

Each module should own its primary tables and records.

Examples:

- `instance` owns instance settings
- `drive` owns file and folder metadata
- `drop` owns upload and transfer session records
- `note` owns posts and reactions
- `notification` owns notification state
- `federation` owns remote actor or delivery state records

Shared references between modules should be made explicit through IDs, not through hidden coupling.

## Route Ownership

Routes should be grouped by module.

Suggested route prefixes:

- `/api/meta`
- `/api/settings`
- `/api/auth`
- `/api/drive`
- `/api/drop`
- `/api/users`
- `/api/notes`
- `/api/timeline`
- `/api/notifications`
- `/api/federation`

This makes route registration and ownership obvious.

## Queue Ownership

Queue producers and consumers should also be module-owned.

Examples:

- `drop` produces and consumes upload lifecycle jobs
- `drive` produces preview and integrity jobs
- `federation` produces delivery and retry jobs
- `notification` can produce fan-out or digest jobs later

The queue runtime is shared, but job semantics belong to the module that owns the business process.

## Suggested First Refactor Steps

To move from the current codebase to this structure, the first refactor should be:

1. keep `main.go` as the only entrypoint for now, but stop putting more composition logic into it
2. formalize `api`, `services`, `models`, and `connections` responsibilities so they do not overlap
3. convert current settings model into an `instance` module
4. treat `components/drive` and `components/drop` as real domain modules and move new code there first
5. introduce shared HTTP response and error helpers in the API layer
6. only after that, consider extracting `cmd/api`, `cmd/worker`, and `internal/platform`

## Architecture Decisions For Current Project

Given the current repository and product direction, the following decisions are recommended now:

- use a modular monolith, not microservices
- keep one API process and one worker process
- separate Drive and Drop into two modules
- evolve from the current `core` layout incrementally instead of rewriting folder structure up front
- make queue processing a first-class runtime, not an afterthought
- delay federation until local social and file domains are stable
- keep handlers thin and place real logic in services

## What This Architecture Is Trying To Prevent

This structure is mainly designed to avoid these failure modes:

- HTTP handlers becoming the only place where business logic exists
- upload logic being mixed directly into file listing code
- synchronous request handlers doing finalize and media work inline
- federation concerns leaking into every local domain too early
- storage backend code being scattered across unrelated packages
- frontend-shaped JSON responses defining backend structure by accident

## Immediate Focus

The next concrete backend implementation should start from:

- `instance` module
- `drive` module
- `drop` module
- `platform/storage`
- `platform/queue`

That set provides the best path from current code to a usable backend without premature federation complexity.
