# Notification System

Tiwana Connect uses Expo Push Notifications for mobile push delivery. The backend does not send directly through Firebase, APNS, OneSignal, SMS, email, or WhatsApp.

## Environment

Required variables:

```env
PUSH_PROVIDER="EXPO"
EXPO_ACCESS_TOKEN=""
PUSH_ENABLED="true"
```

`PUSH_ENABLED=false` keeps in-app notifications but skips provider delivery.

## Data Model

- `Notification`: in-app notification per member.
- `DevicePushToken`: active Expo tokens per member/device.
- `PushDelivery`: per-token delivery attempt and provider ticket metadata.
- `NotificationPreference`: per-member push/category opt-out settings.

Push payloads include `type`, `entityType`, `entityId`, and `actionUrl` so mobile can route taps without parsing notification text.

## Triggered Notifications

- Events: invites, updates, cancellations.
- Funds: contribution requests, confirmed/rejected contributions, recorded disbursements.
- Help requests: received, accepted/declined, completed.
- Elections: nomination open on immediately-open election creation, nomination approved/rejected, candidates announced, voting open, result announced, president ceremony scheduled.

Future timed notifications need a scheduler or worker. Today the backend sends when an admin action/API call performs the transition.

## Admin Monitoring

- `GET /api/admin/notifications`
- `POST /api/admin/notifications/send-test-push`
- `GET /api/admin/notifications/stats`
- `GET /api/admin/push-deliveries`

Admin pages:

- `/admin/notifications`
- `/admin/push-deliveries`

## Delivery Notes

Invalid or unregistered device tokens are marked inactive after provider feedback. Delivery receipts can be added later as a scheduled job if the product needs long-running provider confirmation beyond initial Expo tickets.
