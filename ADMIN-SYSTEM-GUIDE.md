# Admin System Guide

## Overview

The admin system allows the administrator (rixaski@gmail.com) to manage clients, generate licenses, track sessions, send notifications, and maintain records.

## Admin Access

**Admin Email:** `rixaski@gmail.com`
**Admin Panel URL:** `http://localhost:8000/admin.html`

## Features

### 1. Client Management
- **Register New Clients**: Add clients with name, email, and 4-digit client code
- **View All Clients**: See all registered clients with their status
- **Suspend/Activate Accounts**: Control client access to the system
- **Search & Filter**: Find clients by name, email, or code

### 2. License Generation
- Generate unique serial numbers for clients
- Link licenses to specific client codes
- Set optional expiry dates
- Generate client access links automatically

### 3. Client Access Links
Each client gets a unique access link in the format:
```
http://localhost:8000/index.html?code=1234
```

Where `1234` is the 4-digit client code. Clients can ONLY access the system using this link.

### 4. Session Tracking
- **Real-time Active Sessions**: View all currently active client sessions
- **Location Tracking**: IP address, city, region, country
- **Device Information**: User agent details
- **Activity Monitoring**: Last activity timestamp
- **End Sessions**: Admin can forcefully end any active session

### 5. Notifications
- Send notifications to all active clients or specific clients
- Notifications appear in client dashboard
- Track notification delivery

### 6. Records & Logs
- Complete audit trail of all admin actions
- Track client registrations, license generations, suspensions, activations
- Filter by date range
- Export records capability

## How It Works

### Client Registration Flow:
1. Admin logs into admin panel
2. Click "Register New Client"
3. Enter client details and 4-digit code
4. System generates temporary password
5. Admin shares the unique access link with client: `index.html?code=XXXX`
6. Client uses the link to access the system

### Client Access Flow:
1. Client receives link: `index.html?code=1234`
2. Client opens link in browser
3. System validates the 4-digit code
4. If valid, client can login with email and temporary password
5. Session is tracked with IP and location
6. Client proceeds through onboarding (password change, license, campaign setup)

### Session Tracking:
- Automatically tracks when client logs in
- Updates location and IP address
- Monitors last activity (updates every minute)
- Admin can view all active sessions in real-time

## Firestore Collections

### `clients`
Stores client information:
- email (document ID)
- name
- clientCode (4 digits)
- isActive (boolean)
- licenseActive (boolean)
- serialNumber
- createdAt
- lastActive

### `sessions`
Tracks active sessions:
- email
- clientCode
- ipAddress
- location (city, region, country, countryCode)
- userAgent
- loginTime
- lastActivity
- isActive

### `notifications`
Stores notifications:
- recipientEmail
- recipientCode
- title
- message
- read (boolean)
- createdAt
- sentBy

### `adminLogs`
Admin action logs:
- action (type of action)
- description
- details (object with action-specific data)
- adminEmail
- timestamp

## Security

- Only `rixaski@gmail.com` can access admin panel
- Clients can only access via unique links with 4-digit codes
- All admin actions are logged
- Sessions are tracked for security monitoring
- Clients can be suspended/activated by admin

## Setup Instructions

1. **Create Admin Account in Firebase:**
   - Go to Firebase Console → Authentication
   - Add user with email: `rixaski@gmail.com`
   - Set a password

2. **Update Firestore Rules:**
   - Copy content from `firestore.rules` file
   - Paste in Firebase Console → Firestore Database → Rules
   - Publish rules

3. **Access Admin Panel:**
   - Navigate to: `http://localhost:8000/admin.html`
   - Login with admin email and password

4. **Register First Client:**
   - Click "Register New Client"
   - Fill in client details
   - Copy the generated access link
   - Share link with client

## Important Notes

- Client codes must be exactly 4 digits (0000-9999)
- Each client code must be unique
- Client access links are tied to the 4-digit code
- Sessions automatically update location and IP
- Admin can suspend/activate clients at any time
- All actions are logged for audit purposes

