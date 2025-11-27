╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   POLITICAL ELECTION CAMPAIGN MANAGEMENT SYSTEM                 ║
║   MALDIVES - QUICK START GUIDE                                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

⚠️  IMPORTANT: DO NOT DOUBLE-CLICK HTML FILES! ⚠️

You MUST use the HTTP server to run this application.

═══════════════════════════════════════════════════════════════════

METHOD 1: EASIEST - Use the Launcher
─────────────────────────────────────
1. Double-click: START-HERE.bat
2. Wait for server to start
3. Your browser should open automatically
4. If not, go to: http://localhost:8000/index.html

═══════════════════════════════════════════════════════════════════

METHOD 2: Manual Server Start
──────────────────────────────
1. Open Command Prompt or PowerShell
2. Navigate to this folder:
   cd C:\Users\USER\Desktop\4.0
3. Start the server:
   python -m http.server 8000
4. Open your web browser
5. Type in address bar:
   http://localhost:8000/index.html
6. Press Enter

═══════════════════════════════════════════════════════════════════

METHOD 3: Use Launch Helper
─────────────────────────────
1. Double-click: launch.html
2. Follow the instructions shown
3. Click the button to open the application

═══════════════════════════════════════════════════════════════════

LOGIN INSTRUCTIONS:
────────────────────
Use the email address and temporary password provided by your administrator
to access the application.

═══════════════════════════════════════════════════════════════════

TROUBLESHOOTING:
────────────────

❌ Error: "CORS policy" or "file://" error
   → You're opening the file directly!
   → Solution: Use http://localhost:8000/index.html

❌ Error: "Cannot connect" or "Connection refused"
   → Server is not running
   → Solution: Start the server first (see METHOD 2)

❌ Error: "Port already in use"
   → Another server is running
   → Solution: Use port 8080 instead:
     python -m http.server 8080
     Then go to: http://localhost:8080/index.html

═══════════════════════════════════════════════════════════════════

NEED HELP?
──────────
Check the browser console (Press F12) for detailed error messages.

═══════════════════════════════════════════════════════════════════

