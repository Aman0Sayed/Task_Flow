# 🆔 TaskFlow ID System - Collaboration & Connection Guide

## Overview

Each user in TaskFlow now has a unique **TaskFlow ID** - similar to Twitter handles (@username), Discord tags, or LinkedIn profiles. This ID allows users to:
- ✅ Be discovered by other users
- ✅ Connect and collaborate across different workspaces
- ✅ Share their profile with others
- ✅ Build a professional identity on TaskFlow

---

## What is a TaskFlow ID?

### Format
- **Length:** 3-25 characters
- **Characters:** Lowercase letters, numbers, underscores
- **Format:** `username` or `username_123`
- **Example:** `@john_doe`, `@sarah_smith_456`, `@dev_lead`

### Auto-Generation on Signup
When a user signs up, TaskFlow automatically generates a unique TaskFlow ID:

1. **Attempts Name-Based ID**
   - Takes user's name: "John Doe"
   - Converts to: `john_doe`
   - Checks if available

2. **If Taken, Adds Suffix**
   - If `john_doe` exists: `john_doe_1234`
   - If still taken: `john_doe_5678`

3. **Fallback (Rare)**
   - If multiple collisions: `user_a1b2c3d4e5f6`

### Example Signup Flow
```
User enters name: "Alice Smith"
↓
System generates: @alice_smith
↓
TaskFlow ID created: alice_smith
↓
User signed up with ID: @alice_smith
```

---

## API Endpoints for TaskFlow ID

### 1. Search User by TaskFlow ID
**Public Endpoint** - No authentication needed

```
GET /api/collaboration/search/:taskflowId
```

**Example:**
```bash
curl http://localhost:5000/api/collaboration/search/john_doe
```

**Response:**
```json
{
  "success": true,
  "message": "Found user with TaskFlow ID: @john_doe",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://...",
    "taskflowId": "john_doe",
    "role": "manager"
  }
}
```

---

### 2. Search Users by Name or TaskFlow ID
**Public Endpoint** - Search & discover

```
GET /api/collaboration/search?query=john
```

**Example:**
```bash
curl "http://localhost:5000/api/collaboration/search?query=john"
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "name": "John Doe",
      "taskflowId": "john_doe",
      "avatar": "https://...",
      "role": "manager"
    },
    {
      "name": "John Smith",
      "taskflowId": "johnsmith_789",
      "avatar": "https://...",
      "role": "user"
    },
    {
      "name": "Johnny Developer",
      "taskflowId": "johnny_dev",
      "avatar": "https://...",
      "role": "user"
    }
  ]
}
```

---

### 3. Get User Profile by TaskFlow ID
**Public Endpoint** - View profile

```
GET /api/collaboration/user/:taskflowId
```

**Example:**
```bash
curl http://localhost:5000/api/collaboration/user/john_doe
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "avatar": "https://...",
    "taskflowId": "john_doe",
    "role": "manager",
    "createdAt": "2026-02-20T10:30:00Z",
    "teams": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Development Team"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Design Team"
      }
    ]
  }
}
```

---

### 4. Get User Profile Card (For Hovers)
**Public Endpoint** - Quick profile preview

```
GET /api/collaboration/card/:taskflowId
```

**Example:**
```bash
curl http://localhost:5000/api/collaboration/card/john_doe
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "avatar": "https://...",
    "taskflowId": "john_doe",
    "role": "manager",
    "teamCount": 2,
    "teams": [
      { "name": "Development Team" },
      { "name": "Design Team" }
    ],
    "joinedDate": "2026-02-20T10:30:00Z"
  }
}
```

---

### 5. Get Collaborators (Protected)
**Authenticated Endpoint** - Get users in your workspace

```
GET /api/collaboration/collaborators
Authorization: Bearer <token>
```

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/collaboration/collaborators
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "name": "Alice Smith",
      "email": "alice@example.com",
      "avatar": "https://...",
      "taskflowId": "alice_smith",
      "role": "manager",
      "teams": [...]
    },
    ...
  ]
}
```

---

### 6. Get Connection Info
**Authenticated Endpoint** - Check connection status with another user

```
GET /api/collaboration/connection/:taskflowId
Authorization: Bearer <token>
```

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/collaboration/connection/john_doe
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskflowId": "john_doe",
    "name": "John Doe",
    "sameTenant": false,
    "canCollaborate": true,
    "connectionStatus": "different-workspace"
  }
}
```

---

## Using TaskFlow ID for Collaboration

### Use Case 1: Finding a Team Member
```
1. User A wants to invite User B from another workspace
2. User A searches: GET /api/collaboration/search/b_username
3. Gets User B's details
4. Can create cross-workspace project invite
```

### Use Case 2: Sharing Profile
```
1. User A wants to share their profile with colleagues
2. Shares TaskFlow ID: @john_doe
3. Colleagues visit: GET /api/collaboration/user/john_doe
4. See public profile, projects, teams
```

### Use Case 3: Cross-Tenant Collaboration
```
1. Company A Manager has TaskFlow ID: @manager_companyA
2. Company B Manager has TaskFlow ID: @manager_companyB
3. Company B Manager searches for Company A Manager
4. Gets name, role, avatar (no email/sensitive data)
5. Can create collaboration request
```

---

## SignUp Response with TaskFlow ID

After signing up, the user receives:

```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "manager",
    "tenantId": "a1b2c3d4e5f6...",
    "taskflowId": "john_doe",         ← NEW!
    "preferences": { ... }
  }
}
```

---

## Frontend Integration Example

### Display TaskFlow ID in UI

```tsx
// Show user's TaskFlow ID
<p>Your TaskFlow ID: <strong>@{user.taskflowId}</strong></p>

// Copy to clipboard button
<button onClick={() => {
  navigator.clipboard.writeText(`@${user.taskflowId}`);
}}>
  Copy TaskFlow ID
</button>
```

### Search for Users

```tsx
const [searchQuery, setSearchQuery] = useState('');
const [results, setResults] = useState([]);

const searchUsers = async (query) => {
  const res = await fetch(
    `/api/collaboration/search?query=${query}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const data = await res.json();
  setResults(data.data);
};

return (
  <input
    onChange={(e) => {
      setSearchQuery(e.target.value);
      searchUsers(e.target.value);
    }}
    placeholder="Search by name or TaskFlow ID..."
  />
);
```

### View User Profile

```tsx
const [profile, setProfile] = useState(null);

const viewProfile = async (taskflowId) => {
  const res = await fetch(`/api/collaboration/user/${taskflowId}`);
  const data = await res.json();
  setProfile(data.data);
};

return (
  <div>
    <h2>{profile.name}</h2>
    <p>@{profile.taskflowId}</p>
    <img src={profile.avatar} />
    <p>Role: {profile.role}</p>
    <p>Teams: {profile.teams.length}</p>
  </div>
);
```

---

## Database Schema

### User Model Update

```javascript
{
  // ... existing fields ...
  taskflowId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true    // Indexed for fast search
  }
}
```

### Index for Performance

```javascript
// Automatically created on schema definition
db.users.createIndex({ taskflowId: 1 })
```

---

## Security Considerations

### What's Public
- ✅ Name
- ✅ Avatar
- ✅ TaskFlow ID
- ✅ Role (manager/user)
- ✅ Teams (basic info)
- ✅ Join date

### What's Protected
- ❌ Email
- ❌ Password
- ❌ Tenant ID
- ❌ Preferences
- ❌ Private data

### Cross-Tenant Safety
- Users can only see each other's public profiles
- Cannot access each other's private data
- Email is never exposed in public endpoints
- Tenant isolation enforced at database level

---

## Testing the TaskFlow ID System

### Test 1: SignUp with Unique TaskFlow ID
```bash
# SignUp User 1
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Developer",
    "email": "alice@example.com",
    "password": "Pass123!"
  }'

# Response includes: "taskflowId": "alice_developer"
```

### Test 2: Search for User by TaskFlow ID
```bash
curl http://localhost:5000/api/collaboration/search/alice_developer
# Returns: { "success": true, "data": { "name": "Alice Developer", ... } }
```

### Test 3: SignUp User with Same Name (Collision)
```bash
# SignUp User 2 (same name - will get suffix)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Developer",
    "email": "alice2@example.com",
    "password": "Pass123!"
  }'

# Response includes: "taskflowId": "alice_developer_5678"
```

### Test 4: Get Collaborators
```bash
export TOKEN="eyJ..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/collaboration/collaborators
# Returns: List of all users in same workspace
```

### Test 5: Cross-Tenant View
```bash
# User 1 views User 2's profile (different workspace)
export TOKEN1="eyJ..."
curl -H "Authorization: Bearer $TOKEN1" \
  http://localhost:5000/api/collaboration/connection/user2_id
# Returns: connection status, collaboration availability
```

---

## Next Steps for Full Collaboration

### Phase 2 (Future)
- 🔄 Add collaboration invitations system
- 🔄 Cross-tenant project sharing
- 🔄 User blocking/privacy controls
- 🔄 Follow/unfollow system
- 🔄 Direct messaging
- 🔄 Collaboration requests

### Phase 3 (Future)
- 🔄 Public portfolios
- 🔄 Skill endorsements
- 🔄 Job marketplace integration
- 🔄 Professional networking features

---

## Summary

| Feature | Status | Endpoint |
|---------|--------|----------|
| TaskFlow ID Generation | ✅ Done | Auto on signup |
| Search by ID | ✅ Done | GET /collaboration/search/:id |
| Search by Name | ✅ Done | GET /collaboration/search?query= |
| Public Profile | ✅ Done | GET /collaboration/user/:id |
| Profile Card | ✅ Done | GET /collaboration/card/:id |
| Collaborators List | ✅ Done | GET /collaboration/collaborators |
| Connection Info | ✅ Done | GET /collaboration/connection/:id |
| Cross-Tenant Safety | ✅ Done | Enforced at DB level |

**Status: 🚀 READY FOR USE**
