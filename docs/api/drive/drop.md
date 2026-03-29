# Drive Drop API Draft

## Purpose

`drive/drop` is the entrypoint for submitting files into Asagity Drive.
It should support the product direction described in the README:

- multi-backend storage
- large file uploads
- resumable or chunked transfer
- future federation-aware file metadata handling

## Proposed Scope

This draft currently assumes `drop` means an upload-ingest flow, not a public file sharing page.
The backend service can be split into these responsibilities:

- accept upload intents and validate request metadata
- create an upload session
- receive file chunks or single-part bodies
- persist upload state in database and cache
- commit the final object into the configured storage backend
- create a Drive file record for later browse, share, or attach actions

## Suggested Flow

### 1. Create Drop Session

Client sends file metadata before uploading content.

Suggested fields:

- `filename`
- `size`
- `mime_type`
- `sha256` (optional but recommended)
- `parent_id`
- `visibility`
- `storage_policy`

Server returns:

- `drop_id`
- `upload_mode`
- `chunk_size`
- `expires_at`
- `upload_urls` or `part_tokens`

### 2. Upload Content

Two modes can coexist:

- direct single request upload for small files
- chunked upload for large files

For chunked upload, each chunk should carry:

- `drop_id`
- `part_number`
- `offset`
- `content_length`
- chunk checksum

### 3. Complete Drop

Client asks server to finalize the upload.

Server should:

- verify all chunks are present
- verify final size and optional hash
- assemble or commit object in storage backend
- create a file record
- emit background jobs for thumbnail, media probe, or antivirus scanning

## Suggested Status Model

- `pending`
- `uploading`
- `processing`
- `completed`
- `failed`
- `expired`
- `cancelled`

## Suggested Data Model

### `drive_drops`

- `id`
- `user_id`
- `parent_id`
- `storage_backend`
- `storage_key`
- `filename`
- `mime_type`
- `declared_size`
- `actual_size`
- `declared_hash`
- `final_hash`
- `status`
- `chunk_size`
- `total_parts`
- `uploaded_parts`
- `expires_at`
- `completed_at`
- `error_code`
- `error_message`
- timestamps

### `drive_drop_parts`

- `id`
- `drop_id`
- `part_number`
- `offset`
- `size`
- `checksum`
- `uploaded_at`

## Open Design Points

- whether `drop` is authenticated user upload only, or also supports anonymous inbound drops
- whether storage writes are proxied by Asagity Core, or signed direct-to-S3 style uploads are allowed
- whether WebDAV-backed storage is first-class for writes, or read-only mount in early versions
- whether duplicate detection should happen before upload, after upload, or both
- whether uploads need moderation and media scanning before becoming visible

## Backend Notes

Given the current backend stack in `core`:

- PostgreSQL can store durable upload session state
- Redis can track hot upload progress and expiration
- Asynq can run finalize, hash verify, thumbnail, transcode, and cleanup jobs

## Current Decision Placeholder

Until clarified, this document assumes:

- authenticated uploads only
- session-based chunked upload as the default
- local storage and S3-compatible storage as first targets
- WebDAV support can come after the first stable upload pipeline
