# How to Deploy Firestore Security Rules

The Firestore security rules file (`firestore.rules`) has been updated to allow users to delete their own notifications. **These rules must be deployed to Firebase for the changes to take effect.**

## Option 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `rajjecampaign`
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the entire contents of `firestore.rules` file
6. Paste it into the rules editor
7. Click **Publish** button

## Option 2: Using Firebase CLI

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project directory (if not already done):
   ```bash
   firebase init firestore
   ```

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Verify Deployment

After deploying, try deleting a notification again. The permission error should be resolved.

## Current Rules Summary

The notification rules now allow:
- ✅ Admin: Full read/write access
- ✅ Users: Can read their own notifications (where `recipientEmail` matches their email)
- ✅ Users: Can update their own notifications (to mark as read)
- ✅ Users: Can delete their own notifications (where `recipientEmail` matches their email)
- ❌ Users: Cannot create notifications (only admin can)

## Important Notes

- Rules deployment typically takes effect immediately
- If you still see permission errors after deployment, wait 1-2 minutes for propagation
- Make sure you're logged in as the correct user when testing
- The user's email must match the `recipientEmail` field in the notification document

