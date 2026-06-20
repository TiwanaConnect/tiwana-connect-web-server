# Mobile API Test Curls

Set:

```bash
export API_BASE="http://localhost:3000/api/mobile"
export ACCESS_TOKEN="<ACCESS_TOKEN>"
```

## Login

```bash
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"arslan","password":"TC-84921"}'
```

## Me

```bash
curl "$API_BASE/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Family Tree

```bash
curl "$API_BASE/members/tree?viewMode=close&generations=3" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Relationship Finder

```bash
curl "$API_BASE/members/relationship?targetMemberId=<MEMBER_ID>" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Events List

```bash
curl "$API_BASE/events?status=upcoming&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Funds List

```bash
curl "$API_BASE/funds?limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Directory Search

```bash
curl "$API_BASE/directory?q=lahore&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Active Election

```bash
curl "$API_BASE/elections/active" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Notifications

```bash
curl "$API_BASE/notifications?status=UNREAD&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Register Push Token

```bash
curl -X POST "$API_BASE/devices/register-push-token" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]","provider":"EXPO","platform":"IOS","deviceId":"ios-sim","deviceName":"iPhone Simulator"}'
```

## Unregister Push Token

```bash
curl -X POST "$API_BASE/devices/unregister-push-token" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"}'
```
