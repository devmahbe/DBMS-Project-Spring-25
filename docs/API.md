# API Documentation

This document lists the primary endpoints implemented in `Actual Project/Login/Scripts/insertJS.js`.
All JSON endpoints return `{ success: boolean, ... }` with appropriate HTTP status codes.
Authentication is managed via Express sessions (cookie: `connect.sid`).

Base URL: http://localhost:3000 (or 3001 if 3000 is in use)

## Auth Notes
- User auth is present when `req.session.userId` (and `req.session.username`) are set.
- Admin auth is present when `req.session.adminId` (and `req.session.adminUsername`) are set.

---

## Public Pages
- GET `/homepage` → Returns homepage HTML (injects auth state script)
- GET `/contact-us` → Returns contact-us HTML (injects auth state script)
- GET `/login` → Serves `Login/login.html`
- GET `/adminLogin` → Serves `Login/adminLogin.html`

---

## User Authentication

### POST `/signup`
Registers a user and starts a session.
- Body (application/x-www-form-urlencoded or JSON):
```json
{ "username": "john", "email": "john@example.com", "password": "Secret123!" }
```
- Response 200:
```json
{ "success": true, "message": "Registration successful!" }
```

### POST `/login`
Logs in a user, sets session, returns redirect path.
- Body:
```json
{ "username": "john", "password": "Secret123!" }
```
- Responses:
  - 200 OK
```json
{ "success": true, "message": "Login successful", "redirect": "/profile" }
```
  - 401/400/500 with `{ success: false, message }`

### POST `/logout`
Logs out a user (destroys session & clears cookie).
- Response 200:
```json
{ "success": true, "message": "Logout successful" }
```

---

## User Profile

### GET `/profile`
Renders `views/profile.ejs` with the user data. Requires user session.

### POST `/update-profile`
Updates name/phone/dob/location and derived `age`.
- Auth: User required
- Body example:
```json
{ "fullName": "John Doe", "email": "john@example.com", "phone": "+880-01...", "location": "Mirpur, Dhaka", "dob": "2000-01-01" }
```
- Response 200:
```json
{ "success": true, "message": "Profile updated successfully" }
```

### GET `/get-user-data`
Fetches editable profile fields.
- Auth: User required
- Response 200:
```json
{ "success": true, "user": { "fullName": "John", "email": "john@example.com", "phone": null, "location": null, "dob": null } }
```

---

## Complaints (User)

### GET `/complain`
Serves the complaint form HTML. Requires user session.

### POST `/submit-complaint`
Creates a complaint and optional evidence.
- Auth: User required
- Multipart form-data with fields:
  - `complaintType` (string)
  - `description` (string)
  - `incidentDate` (YYYY-MM-DDTHH:mm or compatible)
  - `location` (string, free text)
  - `evidence` (0..10 files; images/videos/audio)
- Response 200:
```json
{ "success": true, "message": "Complaint submitted successfully!", "complaintId": 123 }
```

### GET `/my-complaints`
Returns user complaints with counts.
- Auth: User required
- Response 200 (example):
```json
{
  "success": true,
  "complaints": [
    {
      "complaint_id": 1,
      "description": "...",
      "created_at": "2025-06-10 12:23:00",
      "status": "pending",
      "complaint_type": "Theft",
      "location_address": "...",
      "evidence_count": 2,
      "unread_notifications": 1
    }
  ]
}
```

### GET `/complaint-notifications/:complaint_id`
List notifications for the given complaint after ownership verification.
- Auth: User required

### POST `/mark-notifications-read/:complaint_id`
Marks unread notifications as read.
- Auth: User required

### GET `/complaint-chat/:complaintId`
Fetch chat messages ordered by `sent_at`.
- Auth: User required (ownership enforced)
- Response 200:
```json
{ "success": true, "messages": [ { "chat_id": 1, "message": "Hi", "sender_type": "user", "sent_at": "2025-06-29T..." } ] }
```

### POST `/send-chat-message`
Send a chat message as the user.
- Body:
```json
{ "complaint_id": 1, "message": "Hello" }
```

### DELETE `/delete-complaint/:id`
Delete a pending complaint and associated data; attempts to remove files from disk.
- Auth: User required and owner of complaint

### GET `/dashboard-stats`
Aggregated counts by status for the logged-in user.
- Auth: User required
- Response 200:
```json
{ "success": true, "stats": { "pending": 1, "verifying": 0, "investigating": 0, "resolved": 0, "total": 1 } }
```

---

## Admin Authentication

### POST `/adminLogin`
Login or register an admin.
- Body (login):
```json
{ "username": "admin_mahbe", "email": "admin@example.com", "password": "Secret", "district_name": "Dhaka" }
```
- Behavior: If username/email exists, verifies password and logs in; otherwise creates a new admin with the provided district.
- Response:
```json
{ "success": true, "message": "Login successful", "redirect": "/admin-dashboard" }
```

### POST `/admin-logout`
Destroys admin session.

### GET `/check-admin-auth`
Returns `{ authenticated: true|false }`.

---

## Admin Dashboard & Cases

### GET `/admin-dashboard`
Renders EJS dashboard with admin, complaints, and users under that admin.
- Auth: Admin required

### GET `/get-admin-cases`
Returns complaints assigned to the admin with optional filters.
- Auth: Admin required
- Query Params:
  - `username` (optional, substring match, username or full name)
  - `dateFrom` (optional, YYYY-MM-DD)
  - `dateTo` (optional, YYYY-MM-DD)
- Response 200:
```json
{
  "success": true,
  "cases": [ { "complaint_id": 1, "complainant_username": "ifty90", "status": "pending", ... } ],
  "analytics": { "total": 10, "pending": 5, "verifying": 3, "investigating": 1, "resolved": 1 }
}
```

---

## Admin Chat

### GET `/admin-chat/:complaintId`
Verify assignment; return messages.
- Auth: Admin required

### POST `/admin-send-chat-message`
Insert admin message; rejects duplicates within 5 seconds; creates notification `admin_comment`.
- Body:
```json
{ "complaintId": 1, "message": "Please share more details", "senderType": "admin" }
```

---

## Complaint Status (Admin)

### POST `/update-complaint-status`
Transactional update of `complaint.status`, `status_updates`, `admin_cases`, and a `complaint_notifications` record.
- Auth: Admin required
- Body:
```json
{ "complaintId": 1, "newStatus": "verifying" }
```
- Response 200:
```json
{ "success": true, "message": "Complaint status updated successfully" }
```

---

## Admin Settings

### GET `/get-admin-settings`
Returns current settings (creates defaults if missing).
- Auth: Admin required

### POST `/update-admin-settings`
Upserts `dark_mode` and `email_notifications`.
- Body:
```json
{ "dark_mode": true, "email_notifications": false }
```
- Response 200:
```json
{ "success": true, "message": "Settings updated successfully" }
```
