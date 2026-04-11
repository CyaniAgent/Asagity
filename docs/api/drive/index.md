# Drive API

## Purpose

Drive module provides file and folder management for Asagity Skyline Drive.

## Current Implementation Status

### Implemented endpoints

- `GET /api/drive/files` - List files and folders
- `GET /api/drive/files/:id` - Get file details
- `POST /api/drive/folders` - Create folder
- `PATCH /api/drive/files/:id` - Update file/folder
- `DELETE /api/drive/files/:id` - Delete file/folder
- `POST /api/drive/files/:id` - Move file/folder
- `GET /api/drive/usage` - Get storage usage

## Data Model

### `drive_files`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner user ID |
| `parent_id` | UUID | Parent folder ID (nullable) |
| `name` | string | File/folder name |
| `type` | enum | `folder` or `file` |
| `mime_type` | string | MIME type for files |
| `size` | int64 | File size in bytes |
| `hash` | string | SHA-256 hash |
| `storage_backend` | enum | `local`, `s3`, `webdav` |
| `storage_key` | string | Backend-specific storage key |
| `thumbnail_key` | string | Thumbnail storage key |
| `visibility` | enum | `private`, `public`, `instance` |
| `is_deleted` | bool | Soft delete flag |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update time |

### `drive_usage`

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | UUID | Primary key, user ID |
| `total_files` | int64 | Total file count |
| `total_folders` | int64 | Total folder count |
| `used_bytes` | int64 | Total storage used |
| `max_bytes` | int64 | Maximum storage quota (default 16GB) |

## API Reference

### List Files

```
GET /api/drive/files?parent_id={uuid}&type={file|folder}&search={query}&sort={field}&order={asc|desc}&limit={n}&offset={n}
```

Requires: Authentication

Query Parameters:
- `parent_id` (optional): Filter by parent folder
- `type` (optional): Filter by type (`file` or `folder`)
- `search` (optional): Search by name
- `sort` (optional): Sort field (default: `created_at`)
- `order` (optional): Sort order (`asc` or `desc`, default: `desc`)
- `limit` (optional): Page size (default: 50, max: 100)
- `offset` (optional): Pagination offset

Response:
```json
{
  "ok": true,
  "data": {
    "files": [
      {
        "id": "uuid",
        "parent_id": "uuid|null",
        "name": "filename.txt",
        "type": "file",
        "mime_type": "text/plain",
        "size": 1024,
        "storage_backend": "local",
        "visibility": "private",
        "created_at": "2026-04-11T12:00:00Z",
        "updated_at": "2026-04-11T12:00:00Z"
      }
    ],
    "folders": [
      {
        "id": "uuid",
        "parent_id": "uuid|null",
        "name": "My Folder",
        "created_at": "2026-04-11T12:00:00Z",
        "updated_at": "2026-04-11T12:00:00Z"
      }
    ],
    "total": 100,
    "has_more": true
  }
}
```

### Get File

```
GET /api/drive/files/:id
```

Requires: Authentication

Response:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "parent_id": "uuid|null",
    "name": "filename.txt",
    "type": "file",
    "mime_type": "text/plain",
    "size": 1024,
    "storage_backend": "local",
    "visibility": "private",
    "created_at": "2026-04-11T12:00:00Z",
    "updated_at": "2026-04-11T12:00:00Z"
  }
}
```

### Create Folder

```
POST /api/drive/folders
```

Requires: Authentication

Request:
```json
{
  "name": "New Folder",
  "parent_id": "uuid|null"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "folder": {
      "id": "uuid",
      "parent_id": "uuid|null",
      "name": "New Folder",
      "created_at": "2026-04-11T12:00:00Z",
      "updated_at": "2026-04-11T12:00:00Z"
    }
  }
}
```

### Update File/Folder

```
PATCH /api/drive/files/:id
```

Requires: Authentication

Request:
```json
{
  "name": "New Name",
  "parent_id": "uuid|null",
  "visibility": "public"
}
```

Response: Updated file/folder object

### Delete File/Folder

```
DELETE /api/drive/files/:id
```

Requires: Authentication

Response: 204 No Content

### Move File/Folder

```
POST /api/drive/files/:id
```

Requires: Authentication

Request:
```json
{
  "target_parent_id": "uuid|null"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "status": "ok"
  }
}
```

### Get Storage Usage

```
GET /api/drive/usage
```

Requires: Authentication

Response:
```json
{
  "ok": true,
  "data": {
    "used_bytes": 5368709120,
    "max_bytes": 17179869184,
    "used_percent": 31.25,
    "total_files": 150,
    "total_folders": 25
  }
}
```

## Storage Backends

Currently supported:
- `local`: Local filesystem storage (default)
- `s3`: S3-compatible object storage (planned)
- `webdav`: WebDAV mount (planned)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DRIVE_STORAGE_PATH` | `./storage/drive` | Local storage root path |
