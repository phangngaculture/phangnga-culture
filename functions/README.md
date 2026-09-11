# LINE notification function

This function sends LINE Messaging API push messages without exposing the channel access token to the browser.

## Deploy

From the project root:

```bash
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
firebase deploy --only functions,hosting
```

The deployed endpoint is:

```text
/api/line/send
```

The caller must send a Firebase Auth ID token:

```http
Authorization: Bearer <firebase-id-token>
```

Request body:

```json
{
  "eventId": "booking-approved-CAR-69001-user-123",
  "recipientUserId": "user-123",
  "message": "ข้อความแจ้งเตือน",
  "title": "สถานะใบขอใช้รถ",
  "eventType": "booking_approved",
  "bookingId": "CAR-69001"
}
```

The function skips users without `lineUserId` or with `lineNotificationEnabled: false`, prevents duplicate `eventId` values, and writes delivery results to `lineNotificationLogs`.
