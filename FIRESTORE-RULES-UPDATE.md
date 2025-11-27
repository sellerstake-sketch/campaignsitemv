# Firestore Security Rules Update - IMPORTANT

## Issue
Client registration is timing out because Firestore security rules don't allow admin to write to the `/users` collection.

## Solution
You need to update your Firestore security rules in Firebase Console.

## Steps to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `rajjecampaign`
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the entire rules section with the contents of `firestore.rules` file
5. Click **Publish**

## What Was Changed

The rules were updated to:
1. Allow admin (`rixaski@gmail.com`) to write to `/users` collection for client registration
2. Added `adminActions` collection rules (if needed)
3. Maintained all existing permissions for clients

## Verification

After updating the rules, try registering a client again. The registration should complete successfully.

## Current Rules Location

The updated rules are in: `firestore.rules`

## Note

If you still experience timeout issues after updating rules:
1. Check browser console (F12) for specific error messages
2. Verify you're logged in as admin (`rixaski@gmail.com`)
3. Check Firebase Console → Authentication to ensure admin account exists

