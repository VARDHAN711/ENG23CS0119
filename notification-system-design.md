# Notification System Design
# Stage 1

## Core Actions

basically the notification platform needs to do these things:

- show all notifications to the student
- open a specific notification
- admin should be able to push new notifications
- mark a notification as read
- mark all as read at once
- delete a notification
- send notifications in real time without the student having to refresh

---

## API Endpoints

base url: `http://localhost:3000/api`

all requests and responses use JSON so headers are pretty much the same everywhere:

```
Content-Type: application/json
```

---

### Notification Object

this is what a notification looks like in all responses:

```json
{
  "id": "1",
  "type": "placement",
  "title": "Google On-Campus Drive",
  "message": "Google is visiting campus on July 5th.",
  "isRead": false,
  "createdAt": "2025-06-01T10:00:00.000Z"
}
```

`type` can only be one of: `placement`, `event`, `result`

---

### 1. GET /api/notifications

get all notifications, can filter by type or read status

**query params (optional)**

| param | values | example |
|-------|--------|---------|
| type | placement, event, result | ?type=placement |
| isRead | true, false | ?isRead=false |

**response 200**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "1",
      "type": "placement",
      "title": "Google On-Campus Drive",
      "message": "Google is visiting campus on July 5th.",
      "isRead": false,
      "createdAt": "2025-06-01T10:00:00.000Z"
    }
  ]
}
```

---

### 2. GET /api/notifications/:id

get one notification by id

**response 200**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "type": "placement",
    "title": "Google On-Campus Drive",
    "message": "Google is visiting campus on July 5th.",
    "isRead": false,
    "createdAt": "2025-06-01T10:00:00.000Z"
  }
}
```

**response 404**
```json
{
  "success": false,
  "message": "notification not found"
}
```

---

### 3. POST /api/notifications

create a new notification (admin side)

**request body**
```json
{
  "type": "event",
  "title": "Tech Fest 2025",
  "message": "Annual tech fest starts August 10th."
}
```

all three fields are required

**response 201**
```json
{
  "success": true,
  "data": {
    "id": "4",
    "type": "event",
    "title": "Tech Fest 2025",
    "message": "Annual tech fest starts August 10th.",
    "isRead": false,
    "createdAt": "2025-06-19T12:00:00.000Z"
  }
}
```

**response 400** (missing fields or wrong type)
```json
{
  "success": false,
  "message": "type, title and message are required"
}
```

---

### 4. PATCH /api/notifications/:id/read

mark one notification as read

**response 200**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "type": "placement",
    "title": "Google On-Campus Drive",
    "message": "Google is visiting campus on July 5th.",
    "isRead": true,
    "createdAt": "2025-06-01T10:00:00.000Z"
  }
}
```

**response 404**
```json
{
  "success": false,
  "message": "notification not found"
}
```

---

### 5. PATCH /api/notifications/read-all

mark everything as read

**response 200**
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

---

### 6. DELETE /api/notifications/:id

delete a notification

**response 200**
```json
{
  "success": true,
  "message": "notification 1 deleted"
}
```

**response 404**
```json
{
  "success": false,
  "message": "notification not found"
}
```

---

## Real-Time Notifications

for real time I went with SSE (Server-Sent Events) instead of WebSockets because:

- notifications only go server → client, no need for two way communication
- browser reconnects automatically if connection drops
- no extra packages needed on frontend, just `EventSource`
- honestly simpler to implement than websockets for this use case

### 7. GET /api/notifications/stream

this keeps the connection open and pushes new notifications as they come in

**response headers**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**event format**
```
data: {"id":"4","type":"event","title":"Tech Fest 2025","message":"Annual tech fest starts August 10th.","isRead":false,"createdAt":"2025-06-19T12:00:00.000Z"}

```

**how to use on frontend**
```javascript
const es = new EventSource('http://localhost:3000/api/notifications/stream');

es.onmessage = (e) => {
  const notification = JSON.parse(e.data);
  // show toast or update bell icon
};

es.onerror = () => {
  // browser will auto reconnect so dont need to do much here
  console.log('sse connection lost, reconnecting...');
};
```

also sending a heartbeat every 30 seconds so the connection doesnt get dropped by proxies