# Mobile Integration Notes

These notes are for the separate Expo React Native repo.

## Required Mobile Env

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/mobile
```

For a physical device testing against a local backend, use your computer LAN IP instead of `localhost`, for example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:3000/api/mobile
```

## Recommended Mobile API Client Files

Create or update:

```txt
src/api/client/apiClient.ts
src/api/client/tokenStorage.ts
src/api/client/apiResponse.ts
src/api/config.ts
```

Suggested responsibilities:

- `apiClient.ts`: base URL, JSON parsing, auth header, common error handling.
- `tokenStorage.ts`: secure access/refresh token storage.
- `apiResponse.ts`: shared `ApiResponse<T>` type and response unwrap helpers.
- `config.ts`: reads `EXPO_PUBLIC_API_BASE_URL`.

## Auth Flow

1. Call `POST /auth/login` with username/password.
2. Store `accessToken` and `refreshToken`.
3. Add `Authorization: Bearer <accessToken>` to authenticated requests.
4. If a request returns `UNAUTHORIZED`, clear auth state and send the user to login for now.
5. On logout, unregister the current Expo push token if available, then clear tokens.

Important: login returns a refresh token, but the backend does not yet implement `/auth/refresh`. Do not build an automatic refresh loop until that endpoint exists.

## Push Notification Flow

1. Ask notification permission after successful login.
2. Get the Expo push token from the Expo notifications package.
3. Send it to `POST /devices/register-push-token`.
4. Backend stores the token against the current member.
5. Backend sends targeted pushes by `memberId`.
6. On logout, call `POST /devices/unregister-push-token`.

Register payload:

```json
{
  "token": "ExponentPushToken[...]",
  "provider": "EXPO",
  "platform": "IOS",
  "deviceId": "stable-device-id",
  "deviceName": "iPhone"
}
```

## Push Navigation Mapping

Notification data contains:

```json
{
  "type": "EVENT_INVITE",
  "entityType": "EVENT",
  "entityId": "event-id",
  "actionUrl": "/events/event-id"
}
```

Recommended mapping:

- `EVENT` -> event detail screen.
- `FUND` -> fund detail screen.
- `ELECTION` -> election detail, vote, or result screen based on `actionUrl`.
- `HELP_REQUEST` -> help request detail screen.
- `ANNOUNCEMENT` -> announcement detail screen once announcement APIs exist.

## Privacy Handling

The backend masks hidden female member names for mobile responses. The app should display `displayName`, not `name`, when rendering member labels.

Hidden female member convention:

```txt
name = null
displayName = alias || "Private family member"
isPrivate = true
```

Do not put hidden names, vote choices, private disbursement details, or help-request message bodies in local push notification previews beyond what the backend sends.

## Migration From Mock APIs

The mobile repo should mostly update:

```txt
src/api/*
auth token storage
API base URL config
data mappers if needed
push token registration
```

Screens should not need a rewrite if existing mocks are mapped to the DTOs in `docs/mobile-api-types.ts`.
