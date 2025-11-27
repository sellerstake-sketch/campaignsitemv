# Firebase Storage Rules Update Required

## Issue
The application is experiencing CORS errors when uploading voter images to Firebase Storage. This is because the Storage security rules don't include a rule for the `voters/` path.

## Solution
Update your Firebase Storage security rules to include the voter images path.

## Steps to Update Storage Rules

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project: `rajjecampaign`

2. **Navigate to Storage Rules**
   - Click on **Storage** in the left sidebar
   - Click on the **Rules** tab

3. **Update the Rules**
   - Copy the entire content from `storage.rules` file
   - Paste it into the Firebase Console Rules editor
   - Click **Publish** to save the changes

## What the New Rule Does

The new rule allows:
- **Read access**: Any authenticated user can read voter images
- **Write access**: Users can only upload images to their own folder (matching their email address)

This ensures that:
- Users can upload voter images for their own campaigns
- Users can view voter images (for campaign management)
- Users cannot upload images to other users' folders

## Rule Structure

```
match /voters/{userEmail}/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.token.email == userEmail;
}
```

## Important Notes

- The rules use `userEmail` as a path segment, which must match the authenticated user's email
- The `{allPaths=**}` pattern allows access to all files within the user's folder
- After publishing, the rules take effect immediately (no deployment needed)

## Verification

After updating the rules, try uploading a voter image again. The CORS error should be resolved.

