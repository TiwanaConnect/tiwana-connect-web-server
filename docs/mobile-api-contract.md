# Tiwana Connect Mobile API Contract

Base URL:

```txt
http://localhost:3000/api/mobile
```

Production placeholder:

```txt
https://<production-domain>/api/mobile
```

All responses use the same wrapper:

```ts
export type ApiResponse<T> = {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
};
```

Auth header:

```txt
Authorization: Bearer <accessToken>
```

Common error codes:

- `VALIDATION_ERROR`: request body or query failed validation.
- `UNAUTHORIZED`: missing or invalid bearer token, or invalid credentials.
- `FORBIDDEN`: authenticated user cannot perform the action.
- `NOT_FOUND`: resource does not exist or is hidden from the caller.
- `CONFLICT`: duplicate or invalid state transition.
- `ACCOUNT_BLOCKED`: member account is blocked.
- `ACCOUNT_INACTIVE`: login account is disabled or deleted.
- `TOKEN_EXPIRED`: reserved for future explicit refresh flow; current expired tokens usually return `UNAUTHORIZED`.
- `RESULT_NOT_PUBLISHED`: election result endpoint called before publication.
- `TREE_TOO_LARGE`: full family tree is too large for a non-admin mobile request.
- `PUSH_TOKEN_INVALID`: Expo push token failed provider format validation.
- `INTERNAL_ERROR`: unexpected backend error.

Privacy rules:

- Admin APIs can show real hidden female names.
- Mobile APIs must mask hidden female names.
- Hidden female mobile DTOs use `name = null`, `displayName = alias || "Private family member"`, and `isPrivate = true` where the DTO supports those fields.
- Push payloads must not include sensitive private details.
- Election push payloads must never include vote choices.
- Fund push payloads must not expose sensitive disbursement detail.

## Endpoint Status Summary

All listed mobile endpoints below are implemented unless marked otherwise.

| Status | Endpoint |
| --- | --- |
| READY | `GET /health` |
| READY | `POST /auth/login` |
| READY | `POST /auth/change-password` |
| PARTIAL | Refresh token endpoint |
| READY | `GET /me` |
| READY | `GET /members/me` |
| READY | `GET /members/search` |
| READY | `GET /members/tree` |
| READY | `GET /members/relationship` |
| READY | `GET /events` |
| READY | `POST /events` |
| READY | `GET /events/[id]` |
| READY | `GET /events/mine` |
| READY | `POST /events/[id]/rsvp` |
| READY | `GET /funds` |
| READY | `POST /funds` |
| READY | `GET /funds/[id]` |
| READY | `POST /funds/[id]/requests` |
| READY | `POST /funds/[id]/contributions` |
| READY | `GET /funds/my-requests` |
| READY | `GET /funds/my-contributions` |
| READY | `GET /directory` |
| READY | `GET /directory/[memberId]` |
| READY | `GET /directory/me/settings` |
| READY | `PATCH /directory/me/settings` |
| READY | `POST /directory/[memberId]/help-request` |
| READY | `GET /help-requests/sent` |
| READY | `GET /help-requests/received` |
| READY | `POST /help-requests/[id]/respond` |
| READY | `POST /help-requests/[id]/complete` |
| READY | `POST /help-requests/[id]/cancel` |
| READY | `GET /elections` |
| READY | `GET /elections/active` |
| READY | `GET /elections/[id]` |
| READY | `POST /elections/[id]/nomination` |
| READY | `POST /elections/[id]/nomination/withdraw` |
| READY | `POST /elections/[id]/vote` |
| READY | `GET /elections/[id]/receipt` |
| READY | `GET /elections/[id]/result` |
| READY | `GET /notifications` |
| READY | `GET /notifications/unread-count` |
| READY | `POST /notifications/[id]/read` |
| READY | `POST /notifications/read-all` |
| READY | `POST /notifications/[id]/archive` |
| READY | `POST /devices/register-push-token` |
| READY | `POST /devices/unregister-push-token` |
| READY | `GET /devices/push-tokens` |
| READY | `GET /notification-preferences` |
| READY | `PATCH /notification-preferences` |
| TODO | Announcements API |

## POST /auth/login

Status: READY

Auth: No

Request:

```json
{
  "username": "arslan",
  "password": "TC-84921"
}
```

Success response:

```json
{
  "data": {
    "user": {
      "id": "user-id",
      "memberId": "member-id",
      "username": "arslan",
      "role": "MEMBER",
      "mustChangePassword": true,
      "displayName": "Muhammad Arslan"
    },
    "accessToken": "<JWT>",
    "refreshToken": "<JWT>",
    "expiresIn": 900
  },
  "error": null
}
```

Example curl:

```bash
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"arslan","password":"TC-84921"}'
```

Notes: refresh tokens are issued, but no refresh endpoint exists yet.

## POST /auth/change-password

Status: READY

Auth: Yes

Request:

```json
{
  "currentPassword": "TC-84921",
  "newPassword": "NewPassword123"
}
```

Success response:

```json
{ "data": { "ok": true }, "error": null }
```

Example curl:

```bash
curl -X POST "$API_BASE/auth/change-password" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"TC-84921","newPassword":"NewPassword123"}'
```

## GET /me

Status: READY

Auth: Yes

Success response shape:

```json
{
  "data": {
    "user": {
      "id": "user-id",
      "memberId": "member-id",
      "username": "arslan",
      "role": "MEMBER",
      "mustChangePassword": false
    },
    "member": {
      "id": "member-id",
      "displayName": "Muhammad Arslan",
      "initials": "MA",
      "gender": "MALE",
      "visibility": "VISIBLE",
      "status": "ACTIVE",
      "city": "Lahore",
      "profession": "Software Engineer",
      "branchLabel": "Haji Ali branch"
    }
  },
  "error": null
}
```

Example curl:

```bash
curl "$API_BASE/me" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /members/me

Status: READY

Auth: Yes

Notes: Alias of `/me`; returns the same response shape.

Example curl:

```bash
curl "$API_BASE/members/me" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /members/search

Status: READY

Auth: Yes

Query params: `q`, `limit`, `cursor`

Success response:

```json
{
  "data": {
    "members": [
      {
        "id": "member-id",
        "name": "Muhammad Arslan",
        "alias": null,
        "displayName": "Muhammad Arslan",
        "initials": "MA",
        "gender": "male",
        "visibility": "visible",
        "status": "active",
        "relationshipLabel": "Relative",
        "city": "Lahore",
        "isPrivate": false
      }
    ],
    "nextCursor": null
  },
  "error": null
}
```

Example curl:

```bash
curl "$API_BASE/members/search?q=arslan&limit=20" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /members/tree

Status: READY

Auth: Yes

Query params: `focusMemberId`, `generations`, `viewMode=close|branch|full|relationship`, `includeHiddenNames=true|false`

Success response: `FamilyTreeResponse`.

Example curl:

```bash
curl "$API_BASE/members/tree?viewMode=close&generations=3" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /members/relationship

Status: READY

Auth: Yes

Query params: `targetMemberId` required, `startMemberId` optional.

Success response: `RelationshipTreeResponse`.

Example curl:

```bash
curl "$API_BASE/members/relationship?targetMemberId=<MEMBER_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /events

Status: READY

Auth: Yes

Query params: `status=upcoming|past|cancelled|all`, `limit`, `cursor`

Success response:

```json
{
  "data": {
    "events": [
      {
        "id": "event-id",
        "title": "Family Dinner",
        "description": null,
        "date": "2026-06-20T14:00:00.000Z",
        "startAt": "2026-06-20T14:00:00.000Z",
        "endAt": null,
        "timezone": "Asia/Karachi",
        "location": "Lahore",
        "createdByMemberId": "member-id",
        "createdByDisplayName": "Super Admin",
        "isOfficial": true,
        "isPinned": false,
        "status": "upcoming",
        "rsvpStatus": "pending",
        "invitedCount": 4,
        "goingCount": 1,
        "maybeCount": 0,
        "notGoingCount": 0
      }
    ],
    "nextCursor": null
  },
  "error": null
}
```

Example curl:

```bash
curl "$API_BASE/events?status=upcoming" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /events

Status: READY

Auth: Yes

Request body: `title`, `description`, `type`, `startAt`, `endAt`, `timezone`, `locationName`, `locationAddress`, `mapUrl`, `visibility`, `inviteAudience`, `invitedMemberIds`.

Success response: `MobileFamilyEvent`.

Example curl:

```bash
curl -X POST "$API_BASE/events" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Family Dinner","startAt":"2026-07-01T14:00:00.000Z","visibility":"INVITED_ONLY","invitedMemberIds":["<MEMBER_ID>"]}'
```

## GET /events/[id]

Status: READY

Auth: Yes

Success response:

```json
{
  "data": {
    "event": { "id": "event-id", "title": "Family Dinner" },
    "invites": { "going": 1, "maybe": 0, "notGoing": 0, "pending": 3 },
    "currentUserInvite": { "rsvpStatus": "pending", "rsvpNote": null }
  },
  "error": null
}
```

Example curl:

```bash
curl "$API_BASE/events/<EVENT_ID>" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /events/mine

Status: READY

Auth: Yes

Success response: `{ created: MobileFamilyEvent[], invited: MobileFamilyEvent[] }`

Example curl:

```bash
curl "$API_BASE/events/mine" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /events/[id]/rsvp

Status: READY

Auth: Yes

Request:

```json
{ "status": "going", "note": "Will join" }
```

Success response: `MobileFamilyEvent`.

Example curl:

```bash
curl -X POST "$API_BASE/events/<EVENT_ID>/rsvp" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"going"}'
```

## GET /funds

Status: READY

Auth: Yes

Query params: `q`, `status`, `type`, `visibility`, `limit`, `cursor`

Success response: `{ funds: MobileFund[], nextCursor: string | null }`

Example curl:

```bash
curl "$API_BASE/funds?limit=20" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /funds

Status: READY

Auth: Yes

Request body: `title`, `description`, `type`, `visibility`, `targetAmount`, `currency`, `startAt`, `endAt`, `relatedEventId`.

Mobile-created funds must use `type: "GENERAL"`. `FAMILY_GENERAL` funds are admin-only and are not returned by mobile fund listing/detail APIs.

Success response: `MobileFund`.

Example curl:

```bash
curl -X POST "$API_BASE/funds" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Family Support","type":"GENERAL","visibility":"ALL_FAMILY","currency":"PKR"}'
```

## GET /funds/[id]

Status: READY

Auth: Yes

Success response: `{ fund: MobileFund, summary: MobileFundSummary, contributors: MobileFundContributor[], recentTransactions: MobileFundTransaction[], myRequest: MobileContributionRequest | null }`

Example curl:

```bash
curl "$API_BASE/funds/<FUND_ID>" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /funds/[id]/requests

Status: READY

Auth: Yes

Request body: `requestedAmount`, `currency`, `note`

Success response: `{ requests: MobileContributionRequest[] }`

Example curl:

```bash
curl -X POST "$API_BASE/funds/<FUND_ID>/requests" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"requestedAmount":"5000","currency":"PKR"}'
```

## POST /funds/[id]/contributions

Status: READY

Auth: Yes

Request body: `type`, `amount`, `currency`, `paymentMethod`, `referenceNumber`, `note`, `requestId`

Success response: `MobileFundTransaction`.

Example curl:

```bash
curl -X POST "$API_BASE/funds/<FUND_ID>/contributions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"amount":"1000","currency":"PKR","type":"CONTRIBUTION","paymentMethod":"CASH"}'
```

## GET /funds/my-requests

Status: READY

Auth: Yes

Query params: `fundId`, `status`, `limit`, `cursor`

Success response: `{ requests: MobileContributionRequest[], nextCursor: string | null }`

Example curl:

```bash
curl "$API_BASE/funds/my-requests" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /funds/my-contributions

Status: READY

Auth: Yes

Query params: `fundId`, `status`, `type`, `limit`, `cursor`

Success response: `{ transactions: MobileFundTransaction[], nextCursor: string | null }`

Example curl:

```bash
curl "$API_BASE/funds/my-contributions" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /funds/transactions/[transactionId]/confirm

Status: READY

Auth: Yes

Only the creator of a `GENERAL` fund can confirm a pending transaction for that fund.

Success response: `MobileFundTransaction`.

Example curl:

```bash
curl -X POST "$API_BASE/funds/transactions/<TRANSACTION_ID>/confirm" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /funds/transactions/[transactionId]/reject

Status: READY

Auth: Yes

Only the creator of a `GENERAL` fund can reject a pending transaction for that fund.

Request body: `reason`

Success response: `MobileFundTransaction`.

Example curl:

```bash
curl -X POST "$API_BASE/funds/transactions/<TRANSACTION_ID>/reject" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Reference was not valid"}'
```

## GET /directory

Status: READY

Auth: Yes

Query params: `q`, `city`, `profession`, `gender`, `branchLabel`, `tagIds`, `tagSlugs`, `limit`, `cursor`

Success response: `{ members: MobileDirectoryMemberDto[], nextCursor: string | null }`

Example curl:

```bash
curl "$API_BASE/directory?q=lahore" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /directory/[memberId]

Status: READY

Auth: Yes

Success response: `{ member: MobileDirectoryMemberDto }`

Example curl:

```bash
curl "$API_BASE/directory/<MEMBER_ID>" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /directory/me/settings

Status: READY

Auth: Yes

Success response: `{ setting: DirectorySettingDto }`

Example curl:

```bash
curl "$API_BASE/directory/me/settings" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## PATCH /directory/me/settings

Status: READY

Auth: Yes

Request body: `visibility`, `showPhone`, `showCity`, `showProfession`, `allowHelpRequests`, `bio`, `availabilityNote`

Success response: `{ setting: DirectorySettingDto }`

Example curl:

```bash
curl -X PATCH "$API_BASE/directory/me/settings" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"showPhone":true,"allowHelpRequests":true}'
```

## POST /directory/[memberId]/help-request

Status: READY

Auth: Yes

Request body: `title`, `message`, `category`, `priority=LOW|NORMAL|HIGH|URGENT`

Success response: `{ request: MobileHelpRequestDto }`

Example curl:

```bash
curl -X POST "$API_BASE/directory/<MEMBER_ID>/help-request" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Need help","message":"Can you help with login?","priority":"NORMAL"}'
```

## GET /help-requests/sent

Status: READY

Auth: Yes

Query params: `q`, `status`, `priority`, `category`, `fromDate`, `toDate`, `limit`, `cursor`

Success response: `{ requests: MobileHelpRequestDto[], nextCursor: string | null }`

Example curl:

```bash
curl "$API_BASE/help-requests/sent" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /help-requests/received

Status: READY

Auth: Yes

Query params: same as sent.

Success response: `{ requests: MobileHelpRequestDto[], nextCursor: string | null }`

Example curl:

```bash
curl "$API_BASE/help-requests/received" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /help-requests/[id]/respond

Status: READY

Auth: Yes

Request:

```json
{ "status": "ACCEPTED", "responseMessage": "I can help." }
```

Success response: `{ request: MobileHelpRequestDto }`

Example curl:

```bash
curl -X POST "$API_BASE/help-requests/<REQUEST_ID>/respond" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACCEPTED"}'
```

## POST /help-requests/[id]/complete

Status: READY

Auth: Yes

Success response: `{ request: MobileHelpRequestDto }`

Example curl:

```bash
curl -X POST "$API_BASE/help-requests/<REQUEST_ID>/complete" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /help-requests/[id]/cancel

Status: READY

Auth: Yes

Success response: `{ request: MobileHelpRequestDto }`

Example curl:

```bash
curl -X POST "$API_BASE/help-requests/<REQUEST_ID>/cancel" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /elections

Status: READY

Auth: Yes

Query params: `status`, `limit`, `cursor`

Success response: `{ elections: MobileElectionDto[], nextCursor: string | null }`

Example curl:

```bash
curl "$API_BASE/elections" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /elections/active

Status: READY

Auth: Yes

Success response: `{ election: MobileElectionDto | null }`

Example curl:

```bash
curl "$API_BASE/elections/active" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /elections/[id]

Status: READY

Auth: Yes

Success response: `{ election: MobileElectionDto }`

Example curl:

```bash
curl "$API_BASE/elections/<ELECTION_ID>" -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /elections/[id]/nomination

Status: READY

Auth: Yes

Request body: `statement`, `manifesto`, `experience`, `goals`, `slogan`

Success response: `{ nomination: object }`

Example curl:

```bash
curl -X POST "$API_BASE/elections/<ELECTION_ID>/nomination" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"statement":"I want to serve the family.","slogan":"Unity and service"}'
```

## POST /elections/[id]/nomination/withdraw

Status: READY

Auth: Yes

Success response: `{ nomination: object }`

Example curl:

```bash
curl -X POST "$API_BASE/elections/<ELECTION_ID>/nomination/withdraw" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /elections/[id]/vote

Status: READY

Auth: Yes

Request:

```json
{ "candidateId": "candidate-id" }
```

Success response:

```json
{
  "data": {
    "receiptCode": "ABC123",
    "receiptHash": "hash",
    "message": "Your vote has been submitted confidentially."
  },
  "error": null
}
```

Example curl:

```bash
curl -X POST "$API_BASE/elections/<ELECTION_ID>/vote" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"<CANDIDATE_ID>"}'
```

## GET /elections/[id]/receipt

Status: READY

Auth: Yes

Success response: `{ hasVoted: boolean, receiptCode: string | null, receiptHash: string | null, includedInBallotChain: boolean | null }`

Example curl:

```bash
curl "$API_BASE/elections/<ELECTION_ID>/receipt" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /elections/[id]/result

Status: READY

Auth: Yes

Success response: `{ election: MobileElectionDto }` with `election.result` populated.

Error: `RESULT_NOT_PUBLISHED` if result is not published.

Example curl:

```bash
curl "$API_BASE/elections/<ELECTION_ID>/result" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /notifications

Status: READY

Auth: Yes

Query params: `status=UNREAD|READ|ARCHIVED`, `limit`, `cursor`

Success response: `{ notifications: MobileNotificationDto[], nextCursor: string | null }`

Example curl:

```bash
curl "$API_BASE/notifications?status=UNREAD" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /notifications/unread-count

Status: READY

Auth: Yes

Success response: `{ unreadCount: number }`

Example curl:

```bash
curl "$API_BASE/notifications/unread-count" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /notifications/[id]/read

Status: READY

Auth: Yes

Success response: `{ notification: MobileNotificationDto }`

Example curl:

```bash
curl -X POST "$API_BASE/notifications/<NOTIFICATION_ID>/read" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /notifications/read-all

Status: READY

Auth: Yes

Success response: `{ ok: true }`

Example curl:

```bash
curl -X POST "$API_BASE/notifications/read-all" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /notifications/[id]/archive

Status: READY

Auth: Yes

Success response: `{ notification: MobileNotificationDto }`

Example curl:

```bash
curl -X POST "$API_BASE/notifications/<NOTIFICATION_ID>/archive" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## POST /devices/register-push-token

Status: READY

Auth: Yes

Request:

```json
{
  "token": "ExponentPushToken[...]",
  "provider": "EXPO",
  "platform": "IOS",
  "deviceId": "device-id",
  "deviceName": "iPhone"
}
```

Success response: `{ token: DevicePushTokenDto }`

Error: `PUSH_TOKEN_INVALID` for invalid Expo token format.

Example curl:

```bash
curl -X POST "$API_BASE/devices/register-push-token" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"token":"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]","provider":"EXPO","platform":"IOS","deviceId":"ios-sim"}'
```

## POST /devices/unregister-push-token

Status: READY

Auth: Yes

Request:

```json
{ "token": "ExponentPushToken[...]" }
```

Success response: `{ ok: true }`

Example curl:

```bash
curl -X POST "$API_BASE/devices/unregister-push-token" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"token":"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"}'
```

## GET /devices/push-tokens

Status: READY

Auth: Yes

Success response: `{ tokens: DevicePushTokenDto[] }`

Example curl:

```bash
curl "$API_BASE/devices/push-tokens" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## GET /notification-preferences

Status: READY

Auth: Yes

Success response: `{ preference: NotificationPreferenceDto }`

Example curl:

```bash
curl "$API_BASE/notification-preferences" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## PATCH /notification-preferences

Status: READY

Auth: Yes

Request body: `pushEnabled`, `announcementsPush`, `eventInvitesPush`, `fundsPush`, `helpRequestsPush`, `electionsPush`, `systemPush`, `quietHoursEnabled`, `quietHoursStart`, `quietHoursEnd`

Success response: `{ preference: NotificationPreferenceDto }`

Example curl:

```bash
curl -X PATCH "$API_BASE/notification-preferences" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"pushEnabled":true,"electionsPush":true}'
```

## GET /health

Status: READY

Auth: No

Success response:

```json
{ "data": { "ok": true, "service": "mobile-api" }, "error": null }
```

Example curl:

```bash
curl "$API_BASE/health"
```

## TODO /announcements

Status: TODO

Auth: Yes, expected.

Notes: no announcement model or mobile announcement route exists yet. Announcement DTO is included in `docs/mobile-api-types.ts` as a future contract placeholder only.
