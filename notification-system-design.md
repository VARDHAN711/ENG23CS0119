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

## Stage 2

### DB Choice

I'd go with **PostgreSQL** for this.

reasons:
- notifications have a fixed structure (id, type, title, message, studentId, isRead, createdAt) so relational makes sense here
- postgres has good support for enums which fits our notification types (placement, event, result)
- ACID compliance means we wont lose notification data if something crashes mid write
- scales well and has good indexing support which we'll need later
- honestly also just more familiar with it than mongodb for structured data like this

---

### DB Schema

```sql
CREATE TYPE notification_type AS ENUM ('placement', 'event', 'result');

CREATE TABLE students (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    createdAt   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id          SERIAL PRIMARY KEY,
    studentId   INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type        notification_type NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    isRead      BOOLEAN DEFAULT FALSE,
    createdAt   TIMESTAMP DEFAULT NOW()
);
```

---

### Queries for Stage 1 APIs

**GET /api/notifications** - fetch all notifications for a student
```sql
SELECT * FROM notifications
WHERE studentId = $1
ORDER BY createdAt DESC;
```

with filters (type and isRead):
```sql
SELECT * FROM notifications
WHERE studentId = $1
  AND type = $2
  AND isRead = $3
ORDER BY createdAt DESC;
```

**GET /api/notifications/:id**
```sql
SELECT * FROM notifications
WHERE id = $1 AND studentId = $2;
```

**POST /api/notifications**
```sql
INSERT INTO notifications (studentId, type, title, message)
VALUES ($1, $2, $3, $4)
RETURNING *;
```

**PATCH /api/notifications/:id/read**
```sql
UPDATE notifications
SET isRead = TRUE
WHERE id = $1 AND studentId = $2
RETURNING *;
```

**PATCH /api/notifications/read-all**
```sql
UPDATE notifications
SET isRead = TRUE
WHERE studentId = $1
RETURNING *;
```

**DELETE /api/notifications/:id**
```sql
DELETE FROM notifications
WHERE id = $1 AND studentId = $2
RETURNING id;
```

---

### Problems as Data Grows

**1. slow queries**
as notifications table grows to millions of rows, doing a full table scan for every student's notifications will get really slow. without indexes postgres has to check every single row.

**2. table gets too big**
if we have 50k students each getting ~100 notifications thats already 5 million rows. fetching all of them without pagination is going to be a problem.

**3. read-all update is expensive**
marking all notifications as read does a bulk update which locks rows and can slow things down if many students do it at the same time.

**4. SSE connections**
if 50k students are all connected via SSE at the same time, the server will run out of memory/connections. need to think about this separately.

---

### How I'd Solve These

**indexes** - add indexes on columns we filter by most:
```sql
CREATE INDEX idx_notifications_studentId ON notifications(studentId);
CREATE INDEX idx_notifications_studentId_isRead ON notifications(studentId, isRead);
CREATE INDEX idx_notifications_createdAt ON notifications(createdAt DESC);
```

**pagination** - never return all notifications at once:
```sql
SELECT * FROM notifications
WHERE studentId = $1
ORDER BY createdAt DESC
LIMIT 20 OFFSET $2;
```

**partitioning** - partition notifications table by createdAt so older data is in separate partitions and queries on recent data are faster:
```sql
CREATE TABLE notifications (
    id          SERIAL,
    studentId   INT NOT NULL,
    type        notification_type NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    isRead      BOOLEAN DEFAULT FALSE,
    createdAt   TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (createdAt);

CREATE TABLE notifications_2025 PARTITION OF notifications
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

**caching** - use Redis to cache unread notification counts per student so we dont hit the DB every time the bell icon loads:
```
key: unread_count:studentId
value: count (integer)
ttl: 60 seconds
```

**SSE scaling** - use Redis pub/sub so multiple server instances can broadcast to clients instead of keeping all SSE connections on one server

---

## Stage 3

### Is the query accurate?

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

the query is **mostly correct** but has a couple of issues:

- `ORDER BY createdAt ASC` means oldest notifications come first. for a notification feed you'd usually want newest first (`DESC`). depends on the use case but for unread notifications showing oldest first is a bit odd
- `SELECT *` is fetching every column including `message` (TEXT field) which is expensive. better to select only what the frontend actually needs
- column name `studentID` - depends on how the table was created, if its `studentId` (camelCase) this might throw an error in postgres which is case sensitive for quoted identifiers. not a bug if consistent but worth checking

---

### Why is it slow?

with 50,000 students and 5,000,000 notifications:

- **no index on studentID** - postgres has to do a full sequential scan of all 5 million rows to find notifications for student 1042. this is O(n) where n is total rows
- **no index on isRead** - even after filtering by studentID, filtering by isRead requires checking each row
- **ORDER BY createdAt** without an index means postgres has to sort the results in memory after fetching them
- **SELECT \*** fetches the entire row including large TEXT columns even if frontend only needs title and type

basically postgres is reading the entire notifications table on every API call which gets worse as data grows.

---

### What I'd Change

**1. add a composite index**
```sql
CREATE INDEX idx_notifications_student_read_date 
ON notifications(studentId, isRead, createdAt DESC);
```

this single index covers the WHERE clause and the ORDER BY so postgres can use an index scan instead of a full table scan.

**2. rewrite the query**
```sql
SELECT id, type, title, isRead, createdAt
FROM notifications
WHERE studentId = 1042 AND isRead = false
ORDER BY createdAt DESC
LIMIT 20;
```

changes made:
- `SELECT *` → only select columns frontend needs
- `ASC` → `DESC` (newest unread first makes more sense)
- added `LIMIT 20` so we don't return thousands of rows at once

**3. computation cost**

before optimization:
- full table scan: O(n) = O(5,000,000) rows checked every time
- sort in memory on top of that

after optimization with composite index:
- index scan: O(log n + k) where k is number of results returned
- sort is already handled by the index
- significantly faster, query time goes from potentially seconds to milliseconds

---

### Should We Index Every Column?

**no, this is bad advice.**

reasons:

- every index takes up disk space. indexing all columns on a 5 million row table will use a lot of extra storage
- **writes get slower** - every INSERT, UPDATE, DELETE has to update all the indexes. if we have an index on every column, inserting one notification means updating 6-7 indexes instead of 1
- postgres query planner can get confused with too many indexes and sometimes picks the wrong one
- most columns like `title` and `message` will never be used in a WHERE clause so indexing them is pointless

the right approach is to only index columns that appear in WHERE, ORDER BY, or JOIN clauses and to use composite indexes where queries filter by multiple columns together.

---

### Query: Students with Placement Notification in Last 7 Days

```sql
SELECT DISTINCT s.id, s.name, s.email
FROM students s
JOIN notifications n ON s.id = n.studentId
WHERE n.notificationType = 'Placement'
  AND n.createdAt >= NOW() - INTERVAL '7 days';
```

to make this fast, add:
```sql
CREATE INDEX idx_notifications_type_date 
ON notifications(notificationType, createdAt DESC);
```