# Auth API

## Purpose

This document describes both:

- the confirmed target design for Asagity authentication
- the current implementation status in the repository

These two are intentionally kept together because the code is still in a bootstrap phase.

## Current Implementation Status

### Implemented endpoints

- `POST /api/auth/register` ✅
- `POST /api/auth/register/with-email` ✅ (new)
- `POST /api/auth/register/verify-email` ✅ (new)
- `POST /api/auth/login` ✅
- `POST /api/auth/login/verify-email` ✅ (placeholder)
- `POST /api/auth/refresh` ✅ (new - cookie based)
- `POST /api/auth/logout` ✅ (new - cookie based)
- `POST /api/auth/logout-all` ✅ (new)
- `GET /api/auth/me` ✅

### Implemented Features

- registration without email (direct completion)
- registration with email (two-step: send code → verify → complete)
- login supports `username`, `email`, and `pubid`
- refresh token stored in HttpOnly cookie
- automatic token rotation on refresh
- logout (current device) and logout-all (all devices)
- 6-digit verification code with 15-minute expiry
- 5 attempts limit before cooldown
- 15-minute cooldown after max attempts

### Current prototype limitations

- email verification code delivery requires SMTP configuration
- device trust flow is not implemented yet
- login email verification (new device) is placeholder

## Confirmed Target Rules

- login must support `username`, `pubid`, and `email`
- internal `id` and public `pubid` are different fields
- `pubid` format is `usr_` + 8 random characters
- `pubid` is mutable, but only 5 times per natural month
- old `pubid` values are permanently non-reusable
- `username` is currently immutable
- registration without email must be allowed
- registration with email must complete a 6-digit email verification step
- registration success should auto-login the user
- access token is returned to the frontend and stored in memory
- refresh token is stored in an `HttpOnly` cookie
- access token lifetime is `30m`
- refresh token lifetime is `30d`
- `/api/auth/me` only uses access token
- `/api/auth/refresh` is the only refresh endpoint
- device identity uses both frontend fingerprint and backend-observed metadata
- new-device login with a bound email requires email verification
- failed email verification attempts are counted at the account level
- after 5 wrong codes, `username` and `email` login are blocked for 15 minutes
- `pubid + password` remains available during the cooldown window
- resending a code must create a new challenge and invalidate the previous one
- temporary registration context is stored in Redis
- monthly pubid quota uses the database as source of truth and Redis only as cache
- the first administrator is created by Setup Wizard, not by normal registration

## Current Route Set

### `POST /api/auth/register`

**Status**: Implemented

Registration without email completes immediately.

Request (without email):
```json
{
  "username": "syskuku",
  "password": "plain-password"
}
```

Request (with email - same endpoint, redirects to verification):
```json
{
  "username": "syskuku",
  "email": "syskuku@asagity.net",
  "password": "plain-password"
}
```

Response (success):
```json
{
  "ok": true,
  "data": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "user": {
      "id": "internal-id",
      "pub_id": "usr_A1b2C3d4",
      "username": "syskuku",
      "name": "",
      "avatar_url": ""
    }
  }
}
```

Note: When email is provided, use `POST /api/auth/register/with-email` instead.

### `POST /api/auth/register/with-email`

**Status**: Implemented (new)

Send verification code to email for registration.

Request:
```json
{
  "username": "syskuku",
  "email": "syskuku@asagity.net",
  "password": "plain-password"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "challenge_id": "challenge-id",
    "expires_at": "2026-04-12T12:00:00Z"
  }
}
```

### `POST /api/auth/register/verify-email`

**Status**: Implemented (new)

Verify email code and complete registration.

Request:
```json
{
  "challenge_id": "challenge-id",
  "code": "123456"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "user": {
      "id": "internal-id",
      "pub_id": "usr_A1b2C3d4",
      "username": "syskuku",
      "name": "",
      "avatar_url": ""
    }
  }
}
```

### `POST /api/auth/login`

**Status**: Implemented

Supports `username`, `email`, and `pubid` login.

Request:
```json
{
  "identifier": "syskuku",
  "password": "plain-password"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "user": {
      "id": "internal-id",
      "pub_id": "usr_A1b2C3d4",
      "username": "syskuku",
      "name": "",
      "avatar_url": ""
    }
  }
}
```

Refresh token is stored in HttpOnly cookie.

### `POST /api/auth/login/verify-email`

**Status**: Placeholder

Reserved for new-device email verification flow (not yet implemented).

### `POST /api/auth/refresh`

**Status**: Implemented (new)

Reads refresh token from HttpOnly cookie and rotates it.

Request (optional - cookie is preferred):
```json
{
  "refresh_token": "refresh-token"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "access_token": "new-jwt-token",
    "refresh_token": "new-refresh-token",
    "user": {
      "id": "internal-id",
      "pub_id": "usr_A1b2C3d4",
      "username": "syskuku",
      "name": "",
      "avatar_url": ""
    }
  }
}
```

### `POST /api/auth/logout`

**Status**: Implemented (new)

Revokes current refresh token and clears cookie.

Request (optional - cookie is preferred):
```json
{
  "refresh_token": "refresh-token"
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

### `POST /api/auth/logout-all`

**Status**: Implemented (new)

Revokes all refresh tokens for the user.

Response:
```json
{
  "ok": true,
  "data": {
    "status": "ok"
  }
}
```

Target behavior:

- revoke all active device sessions for the current user

### `GET /api/auth/me`

Current status:

- implemented
- reads current user id from access-token middleware context

Current prototype response shape:

```json
{
  "ok": true,
  "data": {
    "id": "internal-id",
    "pub_id": "usr_A1b2C3d4",
    "username": "syskuku",
    "name": "",
    "avatar_url": ""
  }
}
```

Target behavior:

- return fuller user profile data
- remain access-token only
- be used by SSR auth restoration

## Data Model

### `users`

- `id`
- `pubid`
- `name`
- `username`
- `email`
- `passwd_hash`
- `avatar_url`
- `description`
- `user_group_id`
- `created_at`

### `user_groups`

- `id`
- `name`
- `code`
- `description`
- `created_at`

### `user_pubid_changes`

- `id`
- `user_id`
- `old_pubid`
- `new_pubid`
- `changed_at`

### `auth_devices`

- `id`
- `user_id`
- `device_fingerprint`
- `device_name`
- `user_agent`
- `ip_address`
- `last_seen_at`
- `trusted_at`
- `created_at`

### `auth_refresh_tokens`

- `id`
- `user_id`
- `device_id`
- `token_hash`
- `expires_at`
- `created_at`
- `revoked_at`
- `replaced_by_token_id`

### `auth_email_challenges`

- `id`
- `user_id`
- `device_fingerprint`
- `email`
- `code_hash`
- `purpose`
- `attempt_count`
- `cooldown_until`
- `resend_available_at`
- `expires_at`
- `verified_at`
- `created_at`

Suggested purpose values:

- `login_new_device`
- `register_with_email`

## Redis Use

### Registration context

Used between:

- `POST /api/auth/register`
- `POST /api/auth/register/verify-email`

Stored fields should include:

- `name`
- `username`
- `email`
- `password_hash` or equivalent protected material
- `device_fingerprint`
- `device_name`
- `created_at`
- `expires_at`

Recommended TTL: `15m`

### Additional Redis roles

- resend cooldown state
- monthly pubid quota cache

Database remains the source of truth for quota enforcement.

## Current Response Conventions

The backend currently wraps success responses as:

```json
{
  "ok": true,
  "data": {}
}
```

The backend currently wraps error responses as:

```json
{
  "ok": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human-readable message"
  }
}
```

The current codebase uses snake_case JSON field names in auth payloads, such as:

- `access_token`
- `refresh_token`
- `pub_id`
- `avatar_url`

## Frontend Integration Notes

### Current frontend behavior

- login page posts to `/api/auth/login`
- register page posts to `/api/auth/register`
- user store expects snake_case auth fields today
- frontend dev server now proxies `/api` and `/healthz` to the Go backend in development

### SSR/auth note

The target SSR flow remains:

1. try current in-memory access token
2. if missing or expired, call `/api/auth/refresh`
3. if refresh succeeds, store new access token in memory
4. call `/api/auth/me`
5. hydrate frontend user store

This flow is not fully implemented yet because refresh-token cookie logic is still pending.

## Suggested Error Codes

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_IDENTIFIER_NOT_FOUND`
- `AUTH_USERNAME_TAKEN`
- `AUTH_EMAIL_TAKEN`
- `AUTH_EMAIL_VERIFICATION_REQUIRED`
- `AUTH_CHALLENGE_NOT_FOUND`
- `AUTH_CHALLENGE_EXPIRED`
- `AUTH_INVALID_VERIFICATION_CODE`
- `AUTH_EMAIL_LOGIN_COOLDOWN`
- `AUTH_ACCESS_TOKEN_INVALID`
- `AUTH_REFRESH_TOKEN_INVALID`
- `AUTH_REFRESH_TOKEN_REVOKED`
- `AUTH_DEVICE_FINGERPRINT_REQUIRED`

## Immediate Next Steps

1. align register DTO with optional email
2. add `pubid` lookup to login service
3. implement Redis registration context
4. implement email challenge creation and verification
5. implement refresh-token cookie flow
6. replace placeholder auth endpoints with real logic
