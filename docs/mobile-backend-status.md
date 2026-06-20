# Mobile Backend Status

## Local Base URL

```txt
http://localhost:3000/api/mobile
```

## Production Base URL

```txt
https://<production-domain>/api/mobile
```

## Auth Header

```txt
Authorization: Bearer <accessToken>
```

## Seed Login

Super admin:

```txt
username: admin
password: change-me
```

Member:

```txt
username: arslan
password: TC-84921
```

The actual super admin seed values can be overridden by `SEED_SUPER_ADMIN_USERNAME` and `SEED_SUPER_ADMIN_PASSWORD`.

## READY APIs

- Auth: login, change password, current user.
- Members: current member, search, family tree, relationship finder.
- Events: list, create, detail, mine, RSVP.
- Funds: list, create, detail, self requests, self contributions, create request, submit contribution.
- Directory: list, detail, self settings, help request creation.
- Help requests: sent, received, respond, complete, cancel.
- Elections: list, active, detail, nomination, withdraw nomination, vote, receipt, published result.
- Notifications: inbox, unread count, read, read all, archive.
- Push devices: register token, unregister token, list active tokens.
- Notification preferences: read and update.

## PARTIAL APIs

- Auth refresh: refresh tokens are issued during login, but no `/auth/refresh` endpoint exists yet. Mobile should temporarily send the user back to login on `UNAUTHORIZED`.
- Explicit token expiry code: `TOKEN_EXPIRED` is reserved, but current expired/invalid tokens are handled as `UNAUTHORIZED`.
- Timed notifications: admin/API transitions send notifications; scheduled future reminders need a worker/cron.
- Expo receipts: initial Expo tickets are stored; long-running receipt polling is not implemented.

## TODO APIs

- Announcements API and announcement admin flow.
- Mobile auth logout endpoint.
- Refresh token endpoint.
- Media/photo upload APIs.

## Known Limitations

- Hidden female names are masked in mobile DTOs.
- Push provider is Expo only.
- Mobile event/fund creation exists, but admin review workflows may still evolve.
- Election voting is confidential at the app data-model level, not a government-grade voting system.
- Full tree requests for non-admin users can return `TREE_TOO_LARGE`.

## Push Notification Setup Status

Backend:

- `PUSH_PROVIDER="EXPO"`
- `PUSH_ENABLED="true"`
- `EXPO_ACCESS_TOKEN=""`

Mobile:

- Request Expo notification permission after login.
- Get Expo push token.
- Register token with `POST /devices/register-push-token`.
- Unregister token on logout with `POST /devices/unregister-push-token`.

## Primary Docs

- Full contract: `docs/mobile-api-contract.md`
- DTO types: `docs/mobile-api-types.ts`
- OpenAPI: `docs/mobile-openapi.json`
- Curl tests: `docs/mobile-api-test-curls.md`
- Integration notes: `docs/mobile-integration-notes.md`
