# Software Requirements Specification (SRS)

Crime & Complaint Reporting System (SecureVoice)

Version: 1.0
Date: 2025-11-26

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for the Crime & Complaint Reporting System developed as a DBMS course project. It is intended for developers, testers, and stakeholders to align on scope, behavior, and constraints.

### 1.2 Scope
The system enables citizens (Users) to register, file complaints with location and evidence, track status, chat with assigned administrators, and receive notifications. Administrators (Admins) can authenticate, view and manage assigned complaints and cases, communicate with users, and update statuses. The solution is a web application using Node.js/Express, EJS, and MySQL.

### 1.3 Definitions, Acronyms, Abbreviations
- User: Registered citizen account.
- Admin: Authority account assigned to complaints by district.
- Complaint: A record of an incident reported by a user.
- Evidence: Media files (image/video/audio) associated with a complaint.
- Notification: System message to inform users about status changes or admin messages.
- Case: Admin-side tracking entry for a complaint (admin_cases).

### 1.4 References
- Repository README.md
- Database schema: `securevoice.sql`
- Server code: `Actual Project/Login/Scripts/insertJS.js`

### 1.5 Overview
This SRS covers product perspective, features, user classes, constraints, assumptions, detailed functional requirements, external interfaces, data model overview, non-functional requirements, acceptance criteria, and future enhancements.

Quick links:
- API reference: docs/API.md
- ER Diagram: see Section 5.3 below

## 2. Overall Description

### 2.1 Product Perspective
- Web application using Express.js and EJS views with server-rendered pages and JSON endpoints.
- MySQL relational database with normalized tables: users, admins, complaint, evidence, complaint_chat, complaint_notifications, admin_cases, admin_settings, status_updates, districts, location, category.
- File uploads for evidence managed via Multer to local storage under `Actual Project/uploads/`.

### 2.2 Product Functions (High-level)
- Registration & login for Users and Admins (bcrypt password hashing, Express sessions).
- User profile view/update with age calculation from DOB.
- Submit complaint with type/category, date, location, description, and evidence files.
- Auto-assign admin by matching location text to admin district.
- User dashboard: list own complaints, evidence count, unread notifications, status distribution.
- Admin dashboard: list assigned complaints with filters and analytics.
- Bidirectional chat per complaint (user/admin) with notification generation.
- Notifications for status changes and admin messages; mark-as-read support.
- Admin settings (dark mode, email notifications) with upsert.
- Delete pending complaint (cascading deletes of evidence and status updates; file cleanup).

### 2.3 User Classes and Characteristics
- User: Citizen with basic web literacy; can register, submit and track complaints.
- Admin: Authority staff; manages assigned complaints, communicates with users, and updates statuses.

### 2.4 Operating Environment
- Node.js (LTS), Express 4.x, EJS 3.x
- MySQL 8.x
- Runs on Linux/Windows; local development uses Node and MySQL service.

### 2.5 Design and Implementation Constraints
- No ORM; raw SQL queries only (course constraint).
- Session-based auth using cookies; HTTPS recommended for production.
- Evidence stored on local filesystem; storage quota and file type limits apply.
- Some configuration is hardcoded (e.g., DB in `ServerConnection.js`); environment variables are recommended for production.

### 2.6 Assumptions and Dependencies
- Each complaint matches one admin by district substring on location text; if none found, submission is rejected.
- Email notification delivery is out of scope; only data-level notification records are created.
- Users and Admins are unique by username and email; enforced by DB constraints.

## 3. System Features (Functional Requirements)

For each feature, the following format is used: Description, Actors, Triggers, Preconditions, Basic Flow, Postconditions, and Error Handling.

### 3.1 User Registration
- Actors: User
- Trigger: POST /signup
- Preconditions: Username, email, password provided.
- Basic Flow:
  1. Server hashes password (bcrypt) and inserts user.
  2. Session is initialized (userId, username, email).
  3. Responds with success JSON.
- Postconditions: New user exists; logged in.
- Errors: 400 missing fields; 500 on DB errors.

### 3.2 User Login
- Actors: User
- Trigger: POST /login
- Preconditions: User exists; correct credentials.
- Basic Flow: Verify password, set session, respond with redirect to /profile.
- Errors: 401 invalid credentials; 500 DB errors.

### 3.3 User Profile View and Update
- GET /profile: Renders `profile.ejs` with user info and age calculation.
- POST /update-profile: Update fullName, phone, dob, location, age.
- Security: Requires session.userId; 401 otherwise.

### 3.4 File Complaint
- Actors: User
- Trigger: POST /submit-complaint (multipart with evidence[])
- Preconditions: Authenticated; complaintType, description, incidentDate, location present.
- Basic Flow:
  1. Find admin for location (match district substring).
  2. Get/create location record; map category by name.
  3. Insert complaint (status=pending) with admin assignment.
  4. Save evidence files and insert `evidence` rows with relative file paths.
  5. Respond with complaintId.
- Errors: 400 validation; 401 unauth; 500 on DB or file errors.

### 3.5 View My Complaints & Stats
- GET /my-complaints: Returns user’s complaints with evidence_count and unread_notifications.
- GET /dashboard-stats: Returns complaint counts by status.
- Security: Requires session; 401 otherwise.

### 3.6 User-Admin Chat (User side)
- GET /complaint-chat/:complaintId: Returns messages ordered by sent_at after ownership verification.
- POST /send-chat-message: Inserts `complaint_chat` row with sender_type='user'.
- Security: Requires session and ownership; 403 if not owner.

### 3.7 Notifications (User side)
- GET /complaint-notifications/:complaint_id: List notifications (ownership verified).
- POST /mark-notifications-read/:complaint_id: Mark unread as read.

### 3.8 Admin Registration/Login
- POST /adminLogin: If admin exists, authenticate; else, create new admin (with district), hash password, set session, redirect /admin-dashboard.
- Security: Session fields set: adminId, adminUsername, adminEmail, district.

### 3.9 Admin Dashboard & Cases
- GET /admin-dashboard: Renders dashboard with processed complaints and users under admin.
- GET /get-admin-cases: Returns complaints for admin with optional filters (username, dateFrom, dateTo) and analytics breakdown.

### 3.10 Admin Chat
- GET /admin-chat/:complaintId: Verify assignment and return messages.
- POST /admin-send-chat-message: Prevent duplicates in 5 seconds window; insert message and create notification record type 'admin_comment'.

### 3.11 Update Complaint Status (Admin)
- POST /update-complaint-status: Transactionally update complaint.status, insert status_updates, upsert admin_cases, and create notification 'status_change'.

### 3.12 Admin Settings
- GET /get-admin-settings: Upsert defaults if missing.
- POST /update-admin-settings: Upsert dark_mode and email_notifications.

### 3.13 Logout
- POST /logout: User logout, destroy session, clear cookie.
- POST /admin-logout: Admin logout.

### 3.14 Delete Complaint (User)
- DELETE /delete-complaint/:id: Ensure user ownership and status pending; delete evidence, status_updates, complaint (transaction); attempt filesystem cleanup.

## 4. External Interface Requirements

### 4.1 User Interfaces
- Server-rendered pages: `/homepage`, `/contact-us`, `/profile`, `/complain`, `/admin-dashboard`, plus static HTML under `Actual Project`.
- EJS views under `Actual Project/User/views/`.

### 4.2 API Interfaces (Representative)
- JSON endpoints described in Section 3; all return `{ success: boolean, ... }` and appropriate HTTP status codes.
- Sessions via cookie `connect.sid`.

### 4.3 Hardware Interfaces
- None specific beyond web server and filesystem for uploads.

### 4.4 Software Interfaces
- MySQL 8.x via `mysql` Node.js driver.
- Multer for multipart uploads.

## 5. Data Requirements

### 5.1 Main Entities
- users(userid PK auto, username PK unique, email unique, password, fullName, phone, dob, location, created_at, age)
- admins(adminid PK auto, username PK unique, email unique, password, fullName, created_at, district_name FK, dob)
- complaint(complaint_id PK auto, description, created_at, status ENUM, username FK, admin_username FK, location_id FK, complaint_type, location_address, category_id FK)
- evidence(evidence_id PK auto, uploaded_at, file_type, file_path, complaint_id FK)
- complaint_chat(chat_id PK auto, complaint_id FK, sender_type ENUM, sender_username, message, sent_at, is_read)
- complaint_notifications(notification_id PK auto, complaint_id FK, message, type ENUM, is_read, created_at)
- admin_cases(case_id PK auto, complaint_id FK, admin_username FK, complainant_username, created_at, last_updated, status)
- admin_settings(setting_id PK auto, admin_username unique FK, dark_mode, email_notifications, timestamps)
- status_updates(update_id PK auto, status ENUM, remarks, updated_at, updated_by FK, complaint_id FK)
- districts(district_name PK)
- location(location_id PK auto, location_name, district_name FK)
- category(category_id PK auto, name unique, description, created_at)

### 5.2 Data Retention and Integrity
- Foreign keys ensure referential integrity; cascades as defined (e.g., deleting complaint cascades to admin_cases via constraint, evidence, notifications, status updates).
- Unique constraints on usernames/emails prevent duplication.
- Evidence files are removed from disk on complaint deletion (best effort).

### 5.3 Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ COMPLAINT : "files"
    ADMINS ||--o{ COMPLAINT : "assigned"
    COMPLAINT ||--o{ EVIDENCE : has
    COMPLAINT ||--o{ COMPLAINT_CHAT : has
    COMPLAINT ||--o{ COMPLAINT_NOTIFICATIONS : has
    COMPLAINT ||--o{ STATUS_UPDATES : has
    ADMINS ||--o{ ADMIN_CASES : tracks
    COMPLAINT ||--o{ ADMIN_CASES : tracked_by
    ADMINS ||--|| ADMIN_SETTINGS : has
    LOCATION ||--o{ COMPLAINT : at
    DISTRICTS ||--o{ LOCATION : includes
    DISTRICTS ||--o{ ADMINS : assigns
    CATEGORY ||--o{ COMPLAINT : classifies

    USERS {
      int userid PK
      varchar username UK
      varchar email UK
      varchar password
      varchar fullName
      varchar phone
      date dob
      varchar location
      timestamp created_at
      int age
    }

    ADMINS {
      int adminid PK
      varchar username UK
      varchar email UK
      varchar password
      varchar fullName
      timestamp created_at
      varchar district_name FK
      varchar dob
    }

    COMPLAINT {
      int complaint_id PK
      text description
      datetime created_at
      enum status
      varchar username FK
      varchar admin_username FK
      int location_id FK
      varchar complaint_type
      text location_address
      int category_id FK
    }

    EVIDENCE {
      int evidence_id PK
      datetime uploaded_at
      varchar file_type
      varchar file_path
      int complaint_id FK
    }

    COMPLAINT_CHAT {
      int chat_id PK
      int complaint_id FK
      enum sender_type
      varchar sender_username
      text message
      timestamp sent_at
      bool is_read
    }

    COMPLAINT_NOTIFICATIONS {
      int notification_id PK
      int complaint_id FK
      text message
      enum type
      bool is_read
      timestamp created_at
    }

    ADMIN_CASES {
      int case_id PK
      int complaint_id FK
      varchar admin_username FK
      varchar complainant_username
      timestamp created_at
      timestamp last_updated
      enum status
    }

    ADMIN_SETTINGS {
      int setting_id PK
      varchar admin_username UK FK
      bool dark_mode
      bool email_notifications
      timestamp created_at
      timestamp updated_at
    }

    STATUS_UPDATES {
      int update_id PK
      enum status
      text remarks
      datetime updated_at
      varchar updated_by FK
      int complaint_id FK
    }

    DISTRICTS {
      varchar district_name PK
    }

    LOCATION {
      int location_id PK
      varchar location_name
      varchar district_name FK
    }

    CATEGORY {
      int category_id PK
      varchar name UK
      text description
      timestamp created_at
    }
```

## 6. Non-functional Requirements

### 6.1 Security
- Passwords hashed with bcrypt.
- Session-based authentication; session secret stored in `secret.env` (recommended to keep outside VCS). Use secure cookies and HTTPS in production.
- Input validation and parameterized SQL to mitigate injection.
- Static asset caching while disabling caching for sensitive routes.

### 6.2 Performance
- Typical response time under 500ms for basic queries on local dev DB.
- File uploads up to 50MB per file, max 10 files per complaint.

### 6.3 Reliability & Availability
- Database errors return safe messages; transactions used for multi-step updates.
- Recommended to use a connection pool in production to handle intermittent DB connectivity.

### 6.4 Scalability
- Horizontal scalability at web tier; evidence storage may require migration to object storage for larger deployments.

### 6.5 Usability
- Clear forms and feedback messages; notifications surfaced in complaint views.

### 6.6 Maintainability
- Clear separation of routes and helpers; SQL queries centralized within server file (could be modularized further).

### 6.7 Portability
- Runs on Windows/Linux with Node.js and MySQL installed.

## 7. Constraints and Compliance
- Educational project; data privacy depends on deployment context.
- No third-party identity providers; email notifications out of scope.

## 8. Acceptance Criteria (Sample)
- A new user can register, log in, update profile, submit a complaint with at least one image, and see it listed under /my-complaints within 5 seconds.
- An admin can log in, see assigned complaints on /admin-dashboard, change a complaint status to verifying, and the user receives a new notification record.
- User can send a chat message on a complaint and see it appear on refresh; admin can reply; duplicate admin message within 5 seconds is rejected.
- Deleting a pending complaint removes associated evidence records and files from disk.

## 9. Appendices

### 9.1 Environment & Configuration
- `.env` or `secret.env` variables recommended:
  - SESSION_SECRET
  - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (future improvement)

### 9.2 Future Enhancements
- Switch to MySQL connection pool and env-based DB config.
- Add email/SMS delivery for notifications.
- Role-based access control and audit logging.
- Migrate evidence to cloud object storage with signed URLs.
- Add rate limiting and CSRF protection for write endpoints.
