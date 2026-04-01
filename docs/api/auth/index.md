# Auth API Draft

## Purpose

This document defines the first backend API draft for authentication and registration in Asagity.

It is based on the current confirmed decisions:

- login supports `username`, `pubid`, and `email`
- registration supports `username`, `email`, and `password`
- registration auto-logs the user in
- access token is returned to the frontend and stored in memory
- refresh token is stored in an `HttpOnly` cookie
- new device login triggers email verification if the account has a bound email
- trusted devices can log in again without repeating email verification
- email verification uses a 6-digit code
- registration without email is allowed
- registration with email requires a 6-digit email verification step
- `pubid` follows the format `usr_` + 8 random characters
- `pubid` can be changed up to 5 times per month
- `username` is not mutable in the current design
- temporary registration context is stored in Redis
- email verification code lifetime is 15 minutes
- 5 failed email code attempts disable email login for 15 minutes
- the first administrator is created by Setup Wizard, not by normal registration

## Module Ownership

Suggested ownership split:

- `module/auth`: register, login, refresh, logout, me, login challenge, device trust
- `module/user`: user profile, public user data, user group data

## High-Level Flow

### Registration

1. client submits username, email, password, and device info
2. server validates input and uniqueness
3. if no email is provided, server creates user immediately
4. if email is provided, server creates an email verification challenge first
5. after verification, server creates user
6. server creates or updates trusted device entry
7. server issues access token and refresh token
8. server returns access token and current user
9. server sets refresh token in `HttpOnly` cookie

### Login on trusted device

1. client submits identifier, password, and device info
2. server resolves user by `id`, `username`, or `email`
3. server validates password
4. server recognizes trusted device
5. server issues access token and refresh token

### Login on new device with bound email

1. client submits identifier, password, and device info
2. server resolves user and validates password
3. server detects unknown or untrusted device
4. server creates email verification challenge
5. server sends 6-digit code to bound email
6. server returns `requiresEmailVerification = true`
7. client submits challenge id and code
8. server verifies code, trusts device, and issues tokens

### Email login cooldown

If a user enters the wrong 6-digit code 5 times:

1. email-based login for that account is disabled for 15 minutes
2. login by `email + password` should be rejected during that window
3. login by `pubid + password` is still allowed

This rule is designed to limit repeated mailbox-targeted attacks without fully locking the account.

### Session recovery

1. SSR request arrives without valid in-memory access token
2. frontend sends refresh cookie
3. server verifies refresh token
4. server rotates refresh token and returns new access token
5. frontend requests `/api/auth/me`

## Identifier Rules

The login request field should be called `identifier`.

The backend resolves it in this order:

1. exact public id match
2. exact username match
3. exact email match

This avoids frontend coupling to one identifier type.

If the account is currently under email-login cooldown:

- `pubid` login is still allowed
- `username` login should also be blocked during the cooldown window
- `email` login should be blocked until cooldown expires

## Token Strategy

### Access Token

- returned in JSON response
- intended for frontend memory storage only
- short-lived
- lifetime: `30m`

### Refresh Token

- stored in `HttpOnly` cookie
- long-lived
- must be persisted as hash in the database
- should rotate on every refresh
- should be bound to a device record
- lifetime: `30d`

### Recommended cookie settings

- `HttpOnly`
- `Secure` in production
- `SameSite=Lax` or stricter depending on deployment
- scoped to auth refresh path if desired

## Device Trust Model

Device identity should use both:

- frontend-provided `deviceFingerprint`
- backend-observed metadata such as `userAgent` and IP address

The fingerprint is the primary stable key.
UA and IP are supporting evidence and audit context.

A device is considered trusted when:

- it has successfully completed login before, or
- it has passed email challenge verification

## Suggested Data Model

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

Notes:

- `id` is an internal backend-owned identifier
- `pubid` follows the format `usr_` + 8 random characters
- `pubid` is the user-facing id used for external display, search, and public-id login
- `username` must be unique
- `username` is currently immutable
- `email` should be unique when present
- no separate account status field is required in the first version

### `user_pubid_changes`

- `id`
- `user_id`
- `old_pubid`
- `new_pubid`
- `changed_at`

This table is optional in the first implementation, but recommended if pubid history and monthly change enforcement need auditability.

### `user_groups`

- `id`
- `name`
- `code`
- `description`
- `created_at`

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

Suggested `purpose` values:

- `login_new_device`
- `register_with_email`

### Redis temporary registration context

For registration with email, the preferred flow is:

- `POST /api/auth/register` creates a Redis registration context
- `POST /api/auth/register/verify-email` consumes that context after code verification

Recommended Redis contents:

- `name`
- `username`
- `email`
- `password_hash` or equivalent protected temporary credential material
- `device_fingerprint`
- `device_name`
- creation timestamp
- expiration timestamp

Recommended TTL: `15m`

## Response Envelope

Suggested response style:

```json
{
  "ok": true,
  "data": {}
}
```

Suggested error style:

```json
{
  "ok": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Identifier or password is incorrect."
  }
}
```

## Endpoints

## `POST /api/auth/register`

Start registration.

If `email` is omitted, registration completes immediately and logs the user in.
If `email` is present, registration must complete a 6-digit email verification step first.

### Request body

```json
{
  "name": "SK",
  "username": "syskuku",
  "email": "syskuku@asagity.net",
  "password": "plain-password",
  "deviceFingerprint": "browser-stable-id",
  "deviceName": "Chrome on Windows"
}
```

### Validation

- `username` required
- `username` matches `[A-Za-z0-9_]+`
- `password` required
- `password` minimum length `8`
- `email` optional
- username must be unique
- email must be unique when provided

### Success response without email

```json
{
  "ok": true,
  "data": {
    "accessToken": "access-token",
    "accessTokenExpiresIn": 1800,
    "user": {
      "id": "internal-id",
      "pubid": "A1b2C3d4E5f6G7h8I9j0",
      "name": "SK",
      "username": "syskuku",
      "email": null,
      "avatarUrl": "",
      "description": "",
      "userGroup": {
        "id": "member",
        "code": "member",
        "name": "Member"
      },
      "createdAt": "2026-04-01T12:00:00Z"
    }
  }
}
```

### Success response with email verification required

```json
{
  "ok": true,
  "data": {
    "requiresEmailVerification": true,
    "challengeId": "challenge-id",
    "maskedEmail": "sy***@asagity.net"
  }
}
```

### Side effects without email

- creates user
- assigns default user group
- creates trusted device
- sets refresh token cookie

### Side effects with email

- creates email challenge
- creates Redis registration context
- sends 6-digit verification code
- does not create refresh token yet
- does not create the final user session yet

## `POST /api/auth/register/verify-email`

Complete registration when the user chose to register with an email address.

### Request body

```json
{
  "challengeId": "challenge-id",
  "code": "123456"
}
```

### Success response

```json
{
  "ok": true,
  "data": {
    "accessToken": "access-token",
    "accessTokenExpiresIn": 1800,
    "user": {
      "id": "internal-id",
      "pubid": "A1b2C3d4E5f6G7h8I9j0",
      "name": "SK",
      "username": "syskuku",
      "email": "syskuku@asagity.net",
      "avatarUrl": "",
      "description": "",
      "userGroup": {
        "id": "member",
        "code": "member",
        "name": "Member"
      },
      "createdAt": "2026-04-01T12:00:00Z"
    }
  }
}
```

### Side effects

- verifies email challenge
- loads temporary registration context from Redis
- creates user
- assigns default user group
- creates trusted device
- sets refresh token cookie

## `POST /api/auth/login`

Login with public id, username, or email.

### Request body

```json
{
  "identifier": "syskuku",
  "password": "plain-password",
  "deviceFingerprint": "browser-stable-id",
  "deviceName": "Chrome on Windows"
}
```

### Success response on trusted device

```json
{
  "ok": true,
  "data": {
    "requiresEmailVerification": false,
    "accessToken": "access-token",
    "accessTokenExpiresIn": 1800,
    "user": {
      "id": "internal-id",
      "pubid": "A1b2C3d4E5f6G7h8I9j0",
      "name": "SK",
      "username": "syskuku",
      "email": "syskuku@asagity.net",
      "avatarUrl": "",
      "description": "",
      "userGroup": {
        "id": "member",
        "code": "member",
        "name": "Member"
      },
      "createdAt": "2026-04-01T12:00:00Z"
    }
  }
}
```

### Success response when email verification is required

```json
{
  "ok": true,
  "data": {
    "requiresEmailVerification": true,
    "challengeId": "challenge-id",
    "maskedEmail": "sy***@asagity.net"
  }
}
```

### Notes

- if the account has no bound email, login can complete directly
- if the account has a bound email and the device is new, login must stop at challenge creation
- no refresh token should be set before the challenge is completed
- if the account is under email-login cooldown, email login must be rejected for 15 minutes

## `POST /api/auth/login/verify-email`

Complete login from a new device using a 6-digit email code.

### Request body

```json
{
  "challengeId": "challenge-id",
  "code": "123456",
  "deviceFingerprint": "browser-stable-id",
  "deviceName": "Chrome on Windows"
}
```

### Success response

```json
{
  "ok": true,
  "data": {
    "accessToken": "access-token",
    "accessTokenExpiresIn": 1800,
    "user": {
      "id": "internal-id",
      "pubid": "A1b2C3d4E5f6G7h8I9j0",
      "name": "SK",
      "username": "syskuku",
      "email": "syskuku@asagity.net",
      "avatarUrl": "",
      "description": "",
      "userGroup": {
        "id": "member",
        "code": "member",
        "name": "Member"
      },
      "createdAt": "2026-04-01T12:00:00Z"
    }
  }
}
```

### Side effects

- marks challenge as verified
- creates or updates trusted device
- sets refresh token cookie

## `POST /api/auth/refresh`

Rotate refresh token and return a new access token.

### Request

- no JSON body required in the first version
- reads refresh token from `HttpOnly` cookie

### Success response

```json
{
  "ok": true,
  "data": {
    "accessToken": "new-access-token",
    "accessTokenExpiresIn": 1800
  }
}
```

### Side effects

- validates refresh token
- rotates refresh token
- sets new refresh token cookie
- updates device `last_seen_at`

## `POST /api/auth/logout`

Logout the current device session.

### Request

- access token required
- refresh token cookie required if refresh token revocation is device-scoped

### Success response

```json
{
  "ok": true,
  "data": {
    "loggedOut": true
  }
}
```

### Side effects

- revokes current refresh token chain for the active device session
- clears refresh token cookie

## `POST /api/auth/logout-all`

Optional but strongly recommended.
Logout all devices for the current user.

### Success response

```json
{
  "ok": true,
  "data": {
    "loggedOutAll": true
  }
}
```

## `GET /api/auth/me`

Return the currently authenticated user.

This endpoint is required for SSR auth restoration.

### Request

- access token required

### Success response

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "internal-id",
      "pubid": "A1b2C3d4E5f6G7h8I9j0",
      "name": "SK",
      "username": "syskuku",
      "email": "syskuku@asagity.net",
      "avatarUrl": "",
      "description": "",
      "userGroup": {
        "id": "member",
        "code": "member",
        "name": "Member"
      },
      "createdAt": "2026-04-01T12:00:00Z"
    }
  }
}
```

## `POST /api/auth/email/send-code`

Optional shared endpoint if later used for non-login email verification flows.

For the first version, login challenge creation inside `/api/auth/login` is enough.
This endpoint should remain reserved unless another email verification flow is added.

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

## SSR Integration Notes

The frontend should not rely only on Pinia boolean state.

Recommended SSR flow:

1. try current access token in memory
2. if missing or expired, call `/api/auth/refresh`
3. if refresh succeeds, store new access token in memory
4. call `/api/auth/me`
5. hydrate frontend user store from `/me`
6. if refresh fails, redirect to `/login` or `/welcome`

## Frontend Mapping Notes

The current frontend pages already imply these fields:

- login page wants one `identifier` field even though the variable name is still `email`
- register page wants `username`, `email`, `password`, and `confirmPassword`
- middleware expects a durable login state
- user store will need to expand beyond `isLoggedIn`, `username`, and `avatar`

## Current Open Points

These points are still not fully specified and can be decided later without blocking the first auth implementation:

- exact JWT signing algorithm and key rotation strategy
- whether logout revokes only the current refresh token or the whole replacement chain
- whether device fingerprint format is fully frontend-defined or normalized on the backend
- exact Redis key naming scheme for temporary registration context and email-login cooldown state

## Recommended First Implementation Scope

Implement first:

1. `POST /api/auth/register`
2. `POST /api/auth/register/verify-email`
3. `POST /api/auth/login`
4. `POST /api/auth/login/verify-email`
5. `POST /api/auth/refresh`
6. `POST /api/auth/logout`
7. `GET /api/auth/me`

Delay for later:

- forgot password
- captcha
- invitation-only registration
- full device management UI
- configurable 2FA settings
