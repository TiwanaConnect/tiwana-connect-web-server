# Mobile Integration

## Push Tokens

After login, the mobile app should request notification permission, get an Expo push token, and register it:

- `POST /api/mobile/devices/register-push-token`

Payload:

```json
{
  "token": "ExponentPushToken[...]",
  "platform": "IOS",
  "deviceId": "device-stable-id",
  "deviceName": "iPhone",
  "appVersion": "1.0.0"
}
```

On logout or permission revocation:

- `POST /api/mobile/devices/unregister-push-token`

The mobile app can inspect active tokens:

- `GET /api/mobile/devices/push-tokens`

## Notification Inbox

- `GET /api/mobile/notifications?status=UNREAD&limit=20&cursor=...`
- `GET /api/mobile/notifications/unread-count`
- `POST /api/mobile/notifications/[id]/read`
- `POST /api/mobile/notifications/read-all`
- `POST /api/mobile/notifications/[id]/archive`
- `GET /api/mobile/notification-preferences`
- `PATCH /api/mobile/notification-preferences`

Notification tap handling should prefer the data payload:

```json
{
  "type": "EVENT_INVITE",
  "entityType": "EVENT",
  "entityId": "event-id",
  "actionUrl": "/events/event-id"
}
```

## Expo Client Notes

Use Expo's notifications package on mobile. The backend expects Expo push tokens only. Do not send Firebase/APNS tokens directly to this API.

Suggested client flow:

1. Ask permission after the user is signed in.
2. Register the Expo push token with the backend.
3. Store and reuse a stable `deviceId`.
4. On notification tap, route using `actionUrl` or `entityType/entityId`.
5. Unregister the token on logout.
