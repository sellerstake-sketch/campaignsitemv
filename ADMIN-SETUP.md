# Admin Setup Instructions

## Creating the Admin Account

The admin login requires that the admin account is first created in Firebase Authentication.

### Step 1: Create Admin Account in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `rajjecampaign`
3. Navigate to **Authentication** → **Users** tab
4. Click **"Add user"** button
5. Enter the following:
   - **Email:** `rixaski@gmail.com`
   - **Password:** (choose a secure password)
6. Click **"Add user"**

### Step 2: Access Admin Panel

1. Make sure your server is running (`python server.py`)
2. Open browser and go to: `http://localhost:8000/admin.html`
3. Enter:
   - **Email:** `rixaski@gmail.com`
   - **Password:** (the password you set in Firebase)

### Troubleshooting

**Error: "Admin account not found"**
- The admin account hasn't been created in Firebase Authentication
- Follow Step 1 above to create it

**Error: "Invalid credentials"**
- Double-check the email is exactly: `rixaski@gmail.com`
- Verify the password matches what you set in Firebase
- Make sure there are no extra spaces

**Error: "Unauthorized"**
- Only `rixaski@gmail.com` can access the admin panel
- Check that you're using the correct email

**Error: "Permission denied"**
- Update Firestore security rules from `firestore.rules` file
- Make sure rules are published in Firebase Console

### Important Notes

- The admin email is hardcoded as: `rixaski@gmail.com`
- Admin accounts cannot be created through the client registration form
- Only admins with this exact email can access the admin panel
- All admin actions are logged for audit purposes

