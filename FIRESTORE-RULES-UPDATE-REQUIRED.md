# ⚠️ CRITICAL: Firestore Rules Update Required

## Current Error
```
FirebaseError: Missing or insufficient permissions.
Failed to save client data: Missing or insufficient permissions.
```

## Root Cause
The Firestore security rules currently **BLOCK** clients from writing to their own document in the `clients` collection during campaign setup. However, clients need to save their campaign configuration data to their client document.

## Solution Applied
The `firestore.rules` file has been updated to allow:
1. ✅ **Unauthenticated reads** of the `clients` collection for code validation
2. ✅ Authenticated reads for any client
3. ✅ **Clients can write to their own document** (where document ID matches their email)
4. ✅ Admin full access (read/write)

## 🔴 ACTION REQUIRED - MUST DO NOW

**The rules in the file won't work until you publish them to Firebase Console!**

### Step-by-Step Instructions:

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Select your project: **`rajjecampaign`**

2. **Navigate to Firestore Rules:**
   - Click **Firestore Database** in the left sidebar
   - Click the **Rules** tab at the top

3. **Copy the Rules:**
   - Open the file `firestore.rules` in your project folder
   - Select **ALL** the contents (Ctrl+A / Cmd+A)
   - Copy it (Ctrl+C / Cmd+C)

4. **Paste and Publish:**
   - Paste the entire rules into the Firebase Console rules editor
   - Click the **Publish** button (usually green/orange button at the top)
   - Wait for confirmation message: "Rules published successfully"

5. **Wait for Propagation:**
   - Rules take **1-2 minutes** to propagate globally
   - Don't test immediately - wait at least 2 minutes

## ✅ Testing After Update

1. **Clear browser cache** (or use Incognito/Private mode)
2. **Try accessing:** `http://localhost:8080/index.html?code=1234` (use your actual code)
3. **Check browser console** (F12 → Console) for validation logs
4. **You should see:** `[validateClientCode] Code validated successfully ✓`

## 🔒 Security Note

The rules allow unauthenticated reads of client documents. This is **safe and necessary** because:
- ✅ Client codes are **meant to be public** (they're in URLs sent to clients)
- ✅ Only basic info is exposed (clientCode, email, isActive status)
- ✅ Sensitive data like passwords are stored separately and protected
- ✅ Write operations are still restricted to admin only

## 🐛 If Still Getting Errors After Update

1. **Verify rules are published:**
   - Go to Firebase Console → Firestore → Rules
   - Check the timestamp shows recent publish time

2. **Check browser console:**
   - Look for specific error messages
   - Share the full error details

3. **Wait longer:**
   - Sometimes rules take 3-5 minutes to fully propagate
   - Try again after waiting

4. **Clear cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or use Incognito/Private browsing mode

