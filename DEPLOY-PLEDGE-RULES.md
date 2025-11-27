# 🔴 URGENT: Deploy Firestore Rules for Agent Pledge Updates

## Current Issue
Agents are getting "Permission denied" when trying to update pledges in the agent portal.

## Solution
The `firestore.rules` file has been updated to allow agents to update pledges. **You MUST deploy these rules to Firebase for them to take effect.**

## Quick Deploy Instructions

### Option 1: Firebase Console (Easiest - 2 minutes)

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Select project: **`rajjecampaign`**

2. **Navigate to Rules:**
   - Click **Firestore Database** in left sidebar
   - Click **Rules** tab at the top

3. **Copy & Paste:**
   - Open `firestore.rules` file in your project
   - Select ALL (Ctrl+A) and Copy (Ctrl+C)
   - Paste into Firebase Console rules editor
   - Click **Publish** button

4. **Wait 1-2 minutes** for rules to propagate

### Option 2: Firebase CLI (If you have it installed)

```bash
firebase deploy --only firestore:rules
```

## What Changed

The rules now allow:
- ✅ Agents can **create** pledges (already working)
- ✅ Agents can **update** pledges they created (NEW - needs deployment)
- ✅ Agents can **read** pledges they created (NEW - for queries)

## Security

The rules ensure:
- Agents can only update pledges where `agentId` matches
- The `email` field must be present (campaign association)
- Agents cannot update pledges created by other agents
- Campaign managers still have full access

## Test After Deployment

1. Wait 2 minutes after publishing
2. Try updating a pledge in agent portal
3. Should work without permission errors

## If Still Not Working

1. Check browser console (F12) for specific error
2. Verify rules were published (check timestamp in Firebase Console)
3. Clear browser cache and try again
4. Wait 3-5 minutes for full propagation

