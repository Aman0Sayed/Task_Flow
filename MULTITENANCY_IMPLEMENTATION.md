# Task Flow - Multitenancy Implementation Guide

## Overview
Task Flow is now a **multitenant SaaS application** where each user signup creates a new isolated tenant environment. Users can only see and access data belonging to their tenant.

## Key Changes

### 1. **Manager Role by Default**
- Every new user that signs up is automatically assigned the `manager` role
- Managers can:
  - Create projects
  - Create teams
  - Add team members
  - Create tasks
  - Manage all data within their tenant

### 2. **Tenant Isolation**
Each user gets a unique `tenantId` (32-character hex string) upon signup. This ID is:
- Automatically generated during registration
- Associated with the user account
- Used to filter all data queries
- Ensures no data leakage between tenants

### 3. **Data Models Updated**
The following models now include `tenantId`:
- **User** - Primary tenant owner
- **Project** - Scoped to tenant
- **Task** - Scoped to tenant (via project)
- **Team** - Scoped to tenant
- **Activity** - Scoped to tenant
- **Notification** - Scoped to tenant

### 4. **Authentication Flow**
```
1. User Signs Up
   ↓
2. Backend generates unique tenantId
   ↓
3. User gets manager role
   ↓
4. JWT token issued
   ↓
5. tenantId added to request context
   ↓
6. All subsequent queries filtered by tenantId
```

### 5. **Controller Updates**
All controllers now:
- Receive `req.tenantId` from the auth middleware
- Filter all database queries with `tenantId: req.tenantId`
- Prevent cross-tenant data access

#### Updated Controllers:
- ✅ authController.js - Register with tenantId & manager role
- ✅ projectController.js - Filter projects by tenantId
- ✅ taskController.js - Filter tasks by tenantId
- ✅ teamController.js - Filter teams by tenantId
- ✅ userController.js - Filter users by tenantId
- ✅ notificationController.js - Filter notifications by tenantId
- ✅ activityController.js - Filter activities by tenantId

### 6. **Removed Hardcoded Manager Checks**
Previously, the app had hardcoded checks for:
```javascript
// OLD - REMOVED
const managerUser = await User.findOne({ email: 'manager@gmail.com' });
```

This has been replaced with tenant-based filtering that works for all users.

## API Response Example

### Signup Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "manager",
    "tenantId": "a1b2c3d4e5f6g7h8i9j0k1l2",
    "preferences": {
      "theme": "system",
      "color": "Blue",
      "notifications": {
        "email": true,
        "push": true
      }
    }
  }
}
```

## Testing the Implementation

### 1. **Signup Test**
```bash
POST /api/auth/register
{
  "name": "Company A Manager",
  "email": "manager1@companya.com",
  "password": "SecurePassword123!"
}
```
Expected: User created with manager role and unique tenantId

### 2. **Create Project Test**
```bash
POST /api/projects
Authorization: Bearer {token}
{
  "name": "Company A Project",
  "description": "First project",
  "startDate": "2025-01-01",
  "endDate": "2125-12-31"
}
```
Expected: Project visible only to Company A user

### 3. **Isolation Test**
Create 2 users:
- User 1: SignUp → Get tenantId_A → Create Project_A
- User 2: SignUp → Get tenantId_B → Try to access Project_A

Expected: User 2 cannot access Project_A (404 or 403 error)

### 4. **Team Creation Test**
```bash
POST /api/teams
Authorization: Bearer {token}
{
  "name": "Engineering Team",
  "description": "Building features"
}
```
Expected: Team created and scoped to tenant

### 5. **Full Workflow Test**
1. User signs up → Gets manager role
2. Creates a Project
3. Creates a Team
4. Adds team members
5. Creates Tasks in the Project
6. Views all Projects, Tasks, and Activities

## Multitenancy Features

### User Registration
- Automatic tenantId generation
- Automatic manager role assignment
- No hardcoded default manager

### Data Filtering
All queries now include:
```javascript
{ tenantId: req.tenantId }
```

### Team Management
- Members within same tenant only
- Cannot invite users from other tenants
- Invite codes scoped to tenant

### Activity Tracking
- Activities tracked per tenant
- Cannot view other tenant's activities

### Notifications
- Notifications filtered by tenantId
- Cross-tenant notification leak prevented

## Migration Steps (If upgrading existing database)

### 1. Add tenantId field to all documents
```javascript
db.users.updateMany(
  { tenantId: { $exists: false } },
  [{ $set: { tenantId: { $substr: ["$_id", 0, 24] } } }]
);
```

### 2. Add indexes for performance
```javascript
db.projects.createIndex({ tenantId: 1 });
db.tasks.createIndex({ tenantId: 1 });
db.teams.createIndex({ tenantId: 1 });
db.activities.createIndex({ tenantId: 1 });
db.notifications.createIndex({ tenantId: 1 });
```

## Troubleshooting

### Issue: "Project not found"
- Check if user is logged in with correct tenant
- Verify project has correct tenantId in database

### Issue: Users seeing each other's data
- Verify auth middleware is adding tenantId to request
- Check controllers are filtering by tenantId

### Issue: New tenant members can't see shared projects
- Ensure all team members belong to same tenantId
- Check team filtering includes tenantId

## Database Indexes
Add these indexes for optimal performance:
```javascript
// User collection
db.users.createIndex({ tenantId: 1, email: 1 });

// Project collection
db.projects.createIndex({ tenantId: 1, owner: 1 });

// Task collection
db.tasks.createIndex({ tenantId: 1, project: 1 });

// Team collection
db.teams.createIndex({ tenantId: 1, owner: 1 });

// Activity collection
db.activities.createIndex({ tenantId: 1, createdAt: -1 });

// Notification collection
db.notifications.createIndex({ tenantId: 1, recipient: 1 });
```

## Security Considerations

1. **Always filter by tenantId** in database queries
2. **Never trust user input** for tenantId - use req.tenantId from auth
3. **Verify ownership** before allowing modifications
4. **Log cross-tenant access attempts** for security monitoring
5. **Regular audits** to ensure no data leakage

## Features Working
✅ User signup with manager role
✅ Automatic tenant isolation
✅ Project creation and management
✅ Task creation and assignment
✅ Team creation and member management
✅ Activity feed (tenant-scoped)
✅ Notifications (tenant-scoped)
✅ User management (tenant-scoped)
✅ Multitenancy with data isolation
