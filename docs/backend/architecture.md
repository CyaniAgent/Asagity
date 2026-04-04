# Backend Architecture

## Purpose

This document defines the target backend structure for Asagity Core.
It is not a description of the current codebase only.
It is a working architecture guide for how the backend should evolve as new modules are added.

The main design goal is to keep business logic out of HTTP handlers and out of infrastructure glue.
The backend should be modular enough for Drive, Drop, social features, and federation to grow independently without fragmenting the codebase.

## Current Code Status

The repository is already on the modular-monolith path described here.

Implemented structure now includes:

- `core/cmd/api`
- `core/cmd/worker`
- `core/internal/app`
- `core/internal/platform/config`
- `core/internal/platform/database`
- `core/internal/platform/httpx`
- `core/internal/module/instance`
- `core/internal/module/auth`
- `core/internal/module/user`
- `core/internal/module/asset`
- `core/internal/app/connections/activitypub/inbox`
- `core/internal/app/connections/activitypub/deliver`
- `core/internal/app/connections/neolinkage`

Currently registered modules in the API process are:

- `instance`
- `auth`
- `user`

`asset` exists in the tree as an early utility module, but is not yet a major domain anchor in the roadmap.

The backend currently exposes a minimal health path through the `instance` module:

- `GET /healthz`

The frontend development path now assumes:

```text
browser -> Nuxt dev server (:2000) -> dev proxy -> Go API (:2048)
```

That is why health and API routes should stay stable and should not be duplicated across modules.

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

## Recommended Top-Level Layout

The backend should evolve toward a structure similar to:

```text
core/
  cmd/
    api/
    worker/
  internal/
    app/
      connections/
        activitypub/
        neolinkage/
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

Within this project, `internal/app` should also host protocol connection packages.
These are not generic infrastructure utilities.
They are application-facing protocol adapters that translate between Asagity's internal domain model and external federation protocols.

### `internal/app/connections`

Protocol connection layer.

Recommended structure:

```text
core/internal/app/connections/
  activitypub/
    inbox/
    deliver/
  neolinkage/
```

Responsibilities:

- protocol-specific serialization and deserialization
- inbound and outbound protocol message handling
- protocol verification and signing helpers
- mapping between internal domain objects and external protocol objects
- shared transport-facing logic that belongs to a protocol, not to a business module

This project explicitly targets two protocols:

- `activitypub`: the public standard federated protocol
- `neolinkage`: the future Asagity-native protocol

These two packages should stay parallel in structure even if Neo Linkage starts as a placeholder.
That prevents ActivityPub assumptions from leaking into the Neo Linkage design later.

For ActivityPub specifically, the preferred split is:

```text
core/internal/app/connections/activitypub/
  inbox/
  deliver/
```

- `inbox/` handles inbound ActivityPub activities, validation, parsing, and dispatch
- `deliver/` handles outbound delivery, signing, target resolution, retry handoff, and transport-facing send logic

This is preferred over keeping most files directly at the protocol root.
Misskey's flatter ActivityPub layout is workable, but for this project it would make the protocol layer harder to grow cleanly.

For Neo Linkage, the directory should exist now but remain a placeholder until the protocol itself is ready to be designed and implemented.

## Auth And Identity Notes

The authentication design currently assumes:

- open registration is allowed without requiring an email address
- if a user registers with an email address, registration must complete a 6-digit email verification step
- login supports `username`, `pubid`, and `email`
- internal user id and public user id are different fields
- `pubid` is the external-facing identifier for display, search, and user-facing login
- `pubid` follows the format `usr_` + 8 random characters
- `pubid` is mutable, but can only be changed 5 times per natural month
- old `pubid` values are permanently non-reusable
- `username` is not mutable in the current design
- access token is returned to the frontend and stored in memory
- refresh token is stored in an `HttpOnly` cookie
- access token lifetime is `30m`
- refresh token lifetime is `30d`
- `/api/auth/me` only relies on access token
- `/api/auth/refresh` is the only refresh endpoint
- temporary registration context between register and email verification is stored in Redis
- email verification code lifetime is `15m`
- 5 failed email verification attempts disable email-based login for `15m`
- during email-login cooldown, the account can still log in by `pubid + password`
- during email-login cooldown, `username + password` and `email + password` are both blocked
- failed email verification attempts are counted at the account level
- pubid monthly change quota should use the database as source of truth, with Redis only as a cache

This means the user domain should distinguish between:

- internal id: backend-owned primary identity key
- public id: externally visible user-facing identifier

Suggested field split:

- `id`: internal backend id
- `pubid`: public user-facing id
- `username`: human-readable local account name

For the current project, `auth` and `user` should be the first modules that move from placeholder status into actual implementation.
`instance` is already ahead of them in terms of bootstrap endpoints, but still needs real settings-backed behavior.

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

### `internal/module`

Domain modules live here.
Each module should own its HTTP handlers, services, repositories, models, and queue hooks where applicable.

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

In this project, the federation domain and the protocol connection layer should be related but separate:

- `module/federation` owns unified federation business rules and remote state application
- `app/connections/activitypub` owns ActivityPub-specific protocol behavior
- `app/connections/neolinkage` owns Neo Linkage-specific protocol behavior

This separation keeps protocol details out of the core domain logic while still giving protocol integrations a first-class place in the architecture.

`module/federation` should be treated as the shared federation domain for this project.
That means common operations such as:

- broadcasting posts
- receiving remote social events
- resolving remote identities
- deciding which protocol paths to use for outbound fan-out

should be modeled once in the federation domain, then delegated to the appropriate protocol connection package.

## Infrastructure Modules

The following should exist in `internal/platform` rather than business modules.

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

1. create `cmd/api` and move current startup there
2. move database and Redis setup into `internal/platform`
3. convert current settings model into an `instance` module
4. move protocol integration code into `internal/app/connections/activitypub` and `internal/app/connections/neolinkage`
5. introduce shared HTTP response and error helpers
6. add module registration points in `internal/app`
7. start `drive` and `drop` as the first full domain modules

For ActivityPub, that move should immediately create at least:

- `internal/app/connections/activitypub/inbox`
- `internal/app/connections/activitypub/deliver`

For Neo Linkage, only create the placeholder package path for now.

## Architecture Decisions For Current Project

Given the current repository and product direction, the following decisions are recommended now:

- use a modular monolith, not microservices
- keep one API process and one worker process
- separate Drive and Drop into two modules
- keep ActivityPub and Neo Linkage under `internal/app/connections`
- split ActivityPub into `inbox` and `deliver` subpackages from the start
- keep Neo Linkage as a placeholder package until its protocol design exists
- keep `module/federation` as the unified federation domain reused by both protocols
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

- `auth` module completion
- `user` module completion
- `instance` settings completion
- `drive` module scaffolding
- `drop` module scaffolding
- `app/connections/activitypub/inbox`
- `app/connections/activitypub/deliver`
- `platform/storage`
- `platform/queue`

That order reflects the current repository more accurately:

- `instance` already exposes bootstrap endpoints
- `auth` and `user` already have models and routes, but still need real business completion
- `drive` and `drop` are the next major untouched domains
