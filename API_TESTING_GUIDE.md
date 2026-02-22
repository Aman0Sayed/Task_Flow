# Task Flow API - Testing Guide

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except register and login) require Bearer token in header:
```
Authorization: Bearer {token}
```

---

## 1. Authentication Endpoints

### Register (Create New Tenant)
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "manager",
    "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
    "preferences": {...}
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: Same as register
```

### Get Current User
```
GET /auth/me
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "manager",
    "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
    "teams": [],
    "preferences": {...}
  }
}
```

---

## 2. Project Endpoints

### Get All Projects (Tenant-Scoped)
```
GET /projects
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439013",
      "name": "Website Redesign",
      "description": "Redesigning company website",
      "status": "active",
      "priority": "high",
      "startDate": "2025-01-01",
      "endDate": "2025-06-01",
      "progress": 45,
      "owner": {...},
      "members": [],
      "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Create Project
```
POST /projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mobile App Development",
  "description": "Building iOS and Android apps",
  "status": "planning",
  "priority": "high",
  "startDate": "2025-02-01",
  "endDate": "2025-12-31"
}

Response:
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439014",
    "name": "Mobile App Development",
    "owner": "507f1f77bcf86cd799439011",
    "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
    ...
  }
}
```

### Get Single Project
```
GET /projects/:projectId
Authorization: Bearer {token}

Response: Single project object
```

### Update Project
```
PUT /projects/:projectId
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in-progress",
  "progress": 50
}

Response: Updated project object
```

### Delete Project
```
DELETE /projects/:projectId
Authorization: Bearer {token}

Response: { "success": true, "data": {} }
```

---

## 3. Task Endpoints

### Get All Tasks for Project
```
GET /projects/:projectId/tasks
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439015",
      "title": "Design database schema",
      "description": "Create MongoDB schema",
      "status": "in-progress",
      "priority": "high",
      "dueDate": "2025-02-15",
      "project": "607f1f77bcf86cd799439014",
      "assignee": {...},
      "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "createdAt": "2025-01-20T14:22:00Z"
    }
  ]
}
```

### Create Task
```
POST /tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Setup CI/CD pipeline",
  "description": "Configure GitHub Actions",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2025-02-20",
  "project": "607f1f77bcf86cd799439014",
  "assignee": "507f1f77bcf86cd799439012"
}

Response: Created task object
```

### Get Single Task
```
GET /tasks/:taskId
Authorization: Bearer {token}

Response: Single task object with comments and metadata
```

### Update Task
```
PUT /tasks/:taskId
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "done",
  "progress": 100
}

Response: Updated task object
```

### Delete Task
```
DELETE /tasks/:taskId
Authorization: Bearer {token}

Response: { "success": true, "data": {} }
```

### Add Comment to Task
```
POST /tasks/:taskId/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Great progress on this task!"
}

Response: Task object with new comment
```

---

## 4. Team Endpoints

### Get All Teams (Tenant-Scoped)
```
GET /teams
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439016",
      "name": "Engineering Team",
      "description": "Backend and frontend devs",
      "owner": "507f1f77bcf86cd799439011",
      "members": [
        {
          "user": {...},
          "role": "admin",
          "joinedAt": "2025-01-10T09:00:00Z"
        }
      ],
      "inviteCode": "abc123def456",
      "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "createdAt": "2025-01-10T09:00:00Z"
    }
  ]
}
```

### Create Team
```
POST /teams
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Design Team",
  "description": "UI/UX designers"
}

Response: Created team with invite code
```

### Get Team Details
```
GET /teams/:teamId
Authorization: Bearer {token}

Response: Full team object with members and projects
```

### Add Member to Team
```
POST /teams/:teamId/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439012",
  "role": "member"
}

Response: Updated team with new member
```

### Remove Member from Team
```
DELETE /teams/:teamId/members/:userId
Authorization: Bearer {token}

Response: Updated team without removed member
```

### Join Team by Invite Code
```
POST /teams/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "inviteCode": "abc123def456"
}

Response: Team object (user is now member)
```

### Update Team
```
PUT /teams/:teamId
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Team Name",
  "description": "New description"
}

Response: Updated team object
```

### Delete Team
```
DELETE /teams/:teamId
Authorization: Bearer {token}

Response: { "success": true, "data": {} }
```

---

## 5. Activity Endpoints

### Get All Activities
```
GET /activities
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439017",
      "type": "task_created",
      "description": "John Doe created task 'Setup DB'",
      "user": {...},
      "project": "607f1f77bcf86cd799439014",
      "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "createdAt": "2025-01-20T14:22:00Z"
    }
  ]
}
```

### Get Project Activities
```
GET /projects/:projectId/activities
Authorization: Bearer {token}

Response: Activities for specific project
```

---

## 6. Notification Endpoints

### Get Notifications
```
GET /notifications
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 3,
  "unreadCount": 2,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439018",
      "type": "task_assigned",
      "title": "New Task Assigned",
      "message": "You were assigned to 'Setup DB'",
      "isRead": false,
      "relatedTask": "607f1f77bcf86cd799439015",
      "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "createdAt": "2025-01-20T15:00:00Z"
    }
  ]
}
```

### Mark Notification as Read
```
PUT /notifications/:notificationId
Authorization: Bearer {token}

Response: Updated notification with isRead: true
```

### Mark All as Read
```
PUT /notifications/mark-all-as-read
Authorization: Bearer {token}

Response: { "success": true, "message": "All notifications marked as read" }
```

### Delete Notification
```
DELETE /notifications/:notificationId
Authorization: Bearer {token}

Response: { "success": true, "data": {} }
```

---

## 7. User Endpoints

### Get All Users (Tenant-Scoped)
```
GET /users
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager",
      "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "teams": []
    }
  ]
}
```

### Get Single User
```
GET /users/:userId
Authorization: Bearer {token}

Response: User object with full details
```

### Update User
```
PUT /users/:userId
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Doe",
  "role": "user"
}

Response: Updated user object
```

---

## Error Responses

### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "error": "Not authorized to access this project"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Project not found with id of 607f1f77bcf86cd799439999"
}
```

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Project not found"
}
```

---

## Testing Multitenancy Isolation

### Test 1: Create Two Tenants
1. Register User A → Gets tenantId_A
2. Register User B → Gets tenantId_B

### Test 2: Create Data in Tenant A
1. Login as User A
2. Create Project A
3. Create Task A

### Test 3: Verify Isolation
1. Login as User B
2. Try GET /projects
3. Should return empty (Project A not visible)

### Test 4: Verify Cross-Tenant Access Fails
1. Login as User B
2. Try GET /projects/PROJECT_A_ID
3. Should return 404 (Project doesn't exist for this tenant)

---

## Postman Collection Import

Save BaseURL and Bearer token as environment variables:
```json
{
  "baseUrl": "http://localhost:5000/api",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Then use in requests:
```
Authorization: Bearer {{token}}
URL: {{baseUrl}}/projects
```

---

## Rate Limiting (If Implemented)
Check response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

---
