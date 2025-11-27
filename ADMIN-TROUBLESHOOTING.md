# Admin Panel Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Page Not Loading / Blank Screen

**Symptoms:**
- Blank page when accessing `admin.html`
- No content visible
- Browser console shows errors

**Solutions:**

1. **Make sure you're using HTTP server (NOT double-clicking the file):**
   - ✅ Correct: `http://localhost:8000/admin.html`
   - ❌ Wrong: Double-clicking `admin.html` or opening `file:///path/to/admin.html`

2. **Check if server is running:**
   ```bash
   python server.py
   ```
   You should see: `Serving HTTP on :: port 8000`

3. **Check browser console (F12):**
   - Look for red error messages
   - Common errors:
     - `CORS policy` → You're opening file directly, use HTTP server
     - `Failed to load resource` → Check internet connection (Firebase requires internet)
     - `Module not found` → Check file paths are correct

### Issue 2: "Admin login not working"

**Symptoms:**
- Login form doesn't submit
- Error message appears
- Nothing happens when clicking login

**Solutions:**

1. **Check if admin account exists:**
   - Go to Firebase Console: https://console.firebase.google.com/
   - Select project: `rajjecampaign`
   - Go to Authentication → Users
   - Look for: `rixaski@gmail.com`
   - If missing, create it (see ADMIN-SETUP.md)

2. **Verify email and password:**
   - Email must be exactly: `rixaski@gmail.com` (case-sensitive)
   - Password must match what you set in Firebase Authentication

3. **Check browser console (F12) for errors:**
   - Look for Firebase authentication errors
   - Common error codes:
     - `auth/user-not-found` → Account doesn't exist, create it
     - `auth/wrong-password` → Wrong password, reset in Firebase
     - `auth/invalid-credential` → Wrong email or password
     - `auth/network-request-failed` → No internet connection

4. **Test with diagnostic page:**
   - Open: `http://localhost:8000/test-admin-login.html`
   - This will test Firebase authentication directly

### Issue 3: Firebase Initialization Errors

**Symptoms:**
- "Firebase initialization failed" error
- Cannot connect to Firebase
- Network errors

**Solutions:**

1. **Check internet connection:**
   - Firebase requires internet access
   - Check if you can access: https://console.firebase.google.com/

2. **Verify Firebase configuration:**
   - Check `admin.js` has correct `firebaseConfig`
   - Verify project ID: `rajjecampaign`
   - Make sure Firebase project is active

3. **Check browser console:**
   - Look for specific Firebase error messages
   - Common issues:
     - API key issues → Check Firebase Console → Project Settings
     - CORS errors → Make sure using HTTP server (not file://)
     - Network errors → Check firewall/proxy settings

### Issue 4: JavaScript Errors

**Symptoms:**
- "Cannot read property of undefined"
- "Function is not defined"
- Module loading errors

**Solutions:**

1. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Refresh page (Ctrl+F5)

2. **Check script loading order:**
   - `icons.js` should load before `admin.js`
   - `dialog.js` should load (module)
   - Make sure all files exist in the directory

3. **Verify file structure:**
   ```
   4.0/
   ├── admin.html
   ├── admin.js
   ├── admin-styles.css
   ├── icons.js
   ├── dialog.js
   ├── styles.css
   └── ...
   ```

### Issue 5: Page Loads But Nothing Happens

**Symptoms:**
- Page displays but buttons don't work
- Form doesn't submit
- No JavaScript functionality

**Solutions:**

1. **Check if scripts loaded:**
   - Open browser console (F12)
   - Look for: "Starting admin panel initialization..."
   - Look for: "Firebase initialized successfully"
   - If missing, scripts didn't load

2. **Check for JavaScript errors:**
   - Look for red errors in console
   - Check "Network" tab for failed requests
   - Verify all files are accessible via HTTP

3. **Try hard refresh:**
   - Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - This forces browser to reload all files

## Quick Diagnostic Steps

1. **Open browser console (F12)**
2. **Try to access admin panel:**
   ```
   http://localhost:8000/admin.html
   ```
3. **Check console for:**
   - ✅ "Admin page loaded, initializing scripts..."
   - ✅ "Firebase initialized successfully"
   - ✅ "Starting admin panel initialization..."
   - ✅ "Setting up event listeners..."
4. **If you see errors, note them and:**
   - Check this guide for the specific error
   - Verify server is running
   - Check internet connection
   - Verify Firebase configuration

## Still Not Working?

1. **Test Firebase connection:**
   - Open: `http://localhost:8000/test-admin-login.html`
   - This isolates Firebase authentication issues

2. **Check server logs:**
   - Look at terminal where server is running
   - Note any errors or warnings

3. **Verify all files exist:**
   ```bash
   dir admin.html
   dir admin.js
   dir admin-styles.css
   dir icons.js
   dir dialog.js
   ```

4. **Try different browser:**
   - Sometimes browser extensions interfere
   - Try Chrome, Firefox, or Edge in incognito mode

## Contact Support

If none of these solutions work:
1. Note the exact error message from browser console (F12)
2. Check which step of the troubleshooting you reached
3. Verify you're using HTTP server (not file://)
4. Check server is running on correct port

