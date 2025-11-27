# Political Election Campaign Management System - Maldives

## Quick Start

### Option 1: Using Python (Recommended)

1. Open a terminal/command prompt in this folder
2. Run one of these commands:

**Python 3:**
```bash
python server.py
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Or double-click:** `start-server.bat`

3. Open your browser and go to: `http://localhost:8000/index.html`

### Option 2: Using Node.js (if you have Node installed)

1. Install http-server globally:
```bash
npm install -g http-server
```

2. Run:
```bash
http-server -p 8000
```

3. Open: `http://localhost:8000/index.html`

### Option 3: Using PHP (if you have PHP installed)

```bash
php -S localhost:8000
```

## Login

Use the email address and temporary password provided by your administrator to access the application.

## Why Do I Need a Server?

Modern browsers block ES6 modules (import/export) when opening HTML files directly from the file system. A local HTTP server is required for development.

## Troubleshooting

- **Port already in use?** Change the PORT number in `server.py` (line 9)
- **Python not found?** Install Python from python.org
- **Still having issues?** Check browser console (F12) for errors

