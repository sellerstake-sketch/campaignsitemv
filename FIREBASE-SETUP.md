# Firebase Setup Guide

## Setting Up Firestore Security Rules

To fix the "permission-denied" error, you need to configure Firestore security rules in your Firebase Console.

### Steps:

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project: `rajjecampaign`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab

3. **Copy and Paste Security Rules**
   - Open the file `firestore.rules` from this project
   - Copy all the content
   - Paste it into the Firebase Console rules editor
   - Click "Publish" to save the rules

4. **Verify Rules Are Active**
   - The rules should be published immediately
   - Try using the application again

## Alternative: Temporary Development Rules (NOT FOR PRODUCTION)

If you need to test quickly, you can temporarily use these rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all authenticated users full access
    // WARNING: These rules are NOT secure for production!
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING:** Only use the above rules for testing. They allow any authenticated user to read/write all data. Replace with the proper rules from `firestore.rules` before going to production.

## Setting Up Storage Security Rules

For file uploads (campaign logos, messenger attachments), you also need Storage rules:

1. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click on the "Rules" tab

2. **Copy and Paste Storage Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // Campaign logos - users can upload/read their own
       match /campaign-logos/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.token.email == userId;
       }
       
       // Messenger attachments - authenticated users can read/write
       match /messenger/{allPaths=**} {
         allow read, write: if request.auth != null;
       }
       
       // Default deny
       match /{allPaths=**} {
         allow read, write: if false;
       }
     }
   }
   ```

3. **Publish Rules**

## Creating Initial Users

### Option 1: Firebase Authentication Console
1. Go to "Authentication" → "Users"
2. Click "Add user"
3. Enter email and set a temporary password
4. The user will need to change password on first login

### Option 2: Using Firebase CLI (Advanced)
```bash
firebase auth:import users.json --hash-algo=SCRYPT
```

## Testing

After setting up rules:
1. Create a test user in Firebase Authentication
2. Log in with the test credentials
3. The permission errors should be resolved

## Troubleshooting

### Still Getting Permission Errors?
1. **Check Authentication Status**: Make sure user is logged in
2. **Verify User Email**: The user email must match the document ID in Firestore
3. **Check Rules Syntax**: Ensure rules are valid (check Firebase Console for errors)
4. **Wait a Few Seconds**: Sometimes rules take a moment to propagate

### Error: "Missing or insufficient permissions"
- Verify the user is authenticated (`request.auth != null`)
- Check that the user email matches the document path
- Ensure rules are published (click "Publish" button)

### Need Help?
- Check Firebase Console for specific error messages
- Review Firestore security rules documentation
- Ensure your Firebase project has Firestore Database enabled

