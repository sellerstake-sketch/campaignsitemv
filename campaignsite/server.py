#!/usr/bin/env python3
"""
Simple HTTP Server for Development
Run this script to serve the application locally.
Share voter list: optional Firebase Admin SDK for /api/share/verify and /api/share/voters.
Set GOOGLE_APPLICATION_CREDENTIALS to service account JSON path, or place key at campaignsite/serviceAccountKey.json.
"""
import http.server
import socketserver
import os
import webbrowser
import json
import urllib.parse
import uuid
import time
from pathlib import Path

PORT = 8000

# In-memory session store for share links: session_id -> { "token", "createdBy", "expiry" }
_share_sessions = {}
_SHARE_SESSION_TTL = 24 * 3600  # 24 hours

def _get_firestore():
    """Optional Firebase Admin; returns None if not configured."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        if not firebase_admin._apps:
            key_path = Path(__file__).parent / 'serviceAccountKey.json'
            if key_path.exists():
                cred = credentials.Certificate(str(key_path))
            else:
                cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"[Server] Firebase Admin not available (share API will return 503): {e}")
        return None

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle image search endpoint
        parsed_path = self.path.split('?')[0]  # Get path without query string
        if parsed_path == '/api/find-image':
            import urllib.parse
            import json
            
            try:
                full_path = urllib.parse.urlparse(self.path)
                query_params = urllib.parse.parse_qs(full_path.query)
                id_card = query_params.get('id', [None])[0]
                
                if id_card:
                    # Normalize ID card number (uppercase, no spaces)
                    id_card = id_card.strip().upper()
                    print(f"[Server] Searching for image with ID: {id_card}")
                    
                    # Search for images in the images folder that contain the ID card number
                    images_dir = Path('images')
                    if images_dir.exists():
                        # Look for files that start with the ID card number
                        matching_files = []
                        for ext in ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG']:
                            # Try exact match first: {ID}{ext}
                            exact_match = images_dir / f"{id_card}{ext}"
                            if exact_match.exists():
                                matching_files.append(f"images/{id_card}{ext}")
                                print(f"[Server] Found exact match: {matching_files[0]}")
                                break
                            
                            # Try pattern: {ID}.*{ext} (files starting with ID)
                            pattern = f"{id_card}*{ext}"
                            for img_file in images_dir.glob(pattern):
                                matching_files.append(f"images/{img_file.name}")
                                print(f"[Server] Found pattern match: {matching_files[0]}")
                                break
                            
                            if matching_files:
                                break
                        
                        if matching_files:
                            # Return the first matching image URL (ensure it starts with /)
                            image_url = matching_files[0]
                            if not image_url.startswith('/'):
                                image_url = '/' + image_url
                            # Return the first matching image URL
                            self.send_response(200)
                            self.send_header('Content-type', 'application/json')
                            self.end_headers()
                            response = json.dumps({'found': True, 'url': image_url})
                            self.wfile.write(response.encode())
                            print(f"[Server] Returning image URL: {image_url}")
                            return
                        else:
                            print(f"[Server] No matching image found for ID: {id_card}")
                    else:
                        print(f"[Server] Images directory does not exist")
                    
                    # No image found
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = json.dumps({'found': False})
                    self.wfile.write(response.encode())
                    return
                else:
                    # No ID provided
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = json.dumps({'found': False, 'error': 'No ID provided'})
                    self.wfile.write(response.encode())
                    return
            except Exception as e:
                print(f"[Server] Error handling /api/find-image: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = json.dumps({'found': False, 'error': str(e)})
                self.wfile.write(response.encode())
                return

        if parsed_path == '/api/share/voters':
            full_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(full_path.query)
            session_token = query_params.get('session', [None])[0] if query_params else None
            if not session_token:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing session'}).encode())
                return
            sess = _share_sessions.get(session_token)
            if not sess or (sess.get('expiry') and time.time() > sess['expiry']):
                _share_sessions.pop(session_token, None)
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Session expired or invalid'}).encode())
                return
            db = _get_firestore()
            if not db:
                self.send_response(503)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Share backend not configured'}).encode())
                return
            try:
                created_by = sess.get('createdBy') or sess.get('created_by')
                voters_ref = db.collection('voters')
                query = voters_ref.where('email', '==', created_by).limit(5000)
                docs = list(query.stream())
                voters = []
                for d in docs:
                    data = d.to_dict()
                    data['id'] = d.id
                    voters.append(data)

                def _serialize(obj):
                    if hasattr(obj, 'isoformat'):
                        return obj.isoformat()
                    if hasattr(obj, 'seconds'):  # Firestore Timestamp
                        return {'_seconds': obj.seconds, '_nanoseconds': getattr(obj, 'nanoseconds', 0)}
                    raise TypeError(type(obj).__name__)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                body = json.dumps({'voters': voters}, default=_serialize)
                self.wfile.write(body.encode())
            except Exception as e:
                print(f"[Server] /api/share/voters error: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
            return
        
        # Handle favicon.ico requests
        if self.path == '/favicon.ico':
            # Serve the SVG favicon or return empty response
            if os.path.exists('favicon.svg'):
                self.path = '/favicon.svg'
                self.send_response(200)
                self.send_header('Content-type', 'image/svg+xml')
                self.end_headers()
                with open('favicon.svg', 'rb') as f:
                    self.wfile.write(f.read())
                return
            else:
                # Return empty 204 No Content to stop browser from requesting again
                self.send_response(204)
                self.end_headers()
                return
        # Handle all other requests normally
        super().do_GET()

    def do_POST(self):
        parsed_path = self.path.split('?')[0]
        if parsed_path == '/api/share/verify':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8', errors='ignore') if content_length else '{}'
            try:
                data = json.loads(body) if body else {}
            except json.JSONDecodeError:
                data = {}
            token = data.get('token', '').strip()
            password = data.get('password', '').strip()
            if not token:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': 'Missing token'}).encode())
                return
            db = _get_firestore()
            if not db:
                self.send_response(503)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': 'Share backend not configured'}).encode())
                return
            try:
                links_ref = db.collection('sharedVoterLinks')
                query = links_ref.where('token', '==', token).limit(1)
                docs = list(query.stream())
                if not docs:
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'ok': False, 'error': 'Invalid link or password'}).encode())
                    return
                doc = docs[0]
                link_data = doc.to_dict()
                if link_data.get('password') != password:
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'ok': False, 'error': 'Invalid link or password'}).encode())
                    return
                created_by = link_data.get('createdBy', '')
                recipient_name = link_data.get('recipientName', '')
                recipient_island = link_data.get('recipientIsland', '')
                access_log = list(link_data.get('accessLog') or [])
                from datetime import datetime
                from google.cloud.firestore_v1 import SERVER_TIMESTAMP
                access_log.append({
                    'accessedAt': datetime.utcnow(),
                    'recipientName': recipient_name,
                    'recipientIsland': recipient_island
                })
                doc.reference.update({'accessLog': access_log})
                session_id = str(uuid.uuid4())
                _share_sessions[session_id] = {
                    'token': token,
                    'createdBy': created_by,
                    'expiry': time.time() + _SHARE_SESSION_TTL
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'ok': True,
                    'sessionToken': session_id,
                    'session': session_id
                }).encode())
            except Exception as e:
                print(f"[Server] /api/share/verify error: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode())
            return
        super().do_POST()
    
    def end_headers(self):
        # Add CORS headers to allow local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

def main():
    # Change to the directory where this script is located
    os.chdir(Path(__file__).parent)
    
    Handler = MyHTTPRequestHandler
    ports_to_try = [PORT, 8080, 8888, 3000]
    httpd = None
    
    for port in ports_to_try:
        try:
            httpd = socketserver.TCPServer(("", port), Handler)
            break
        except OSError as e:
            if "10048" in str(e) or "Address already in use" in str(e):
                print(f"Port {port} in use, trying next...")
                continue
            raise
    
    if httpd is None:
        print("Could not bind to any port. Try closing other apps using 8000, 8080, 8888, or 3000.")
        return
    
    actual_port = httpd.server_address[1]
    url = f"http://127.0.0.1:{actual_port}/"
    print("=" * 60)
    print(f"Server started at {url}")
    print(f"Also try: http://localhost:{actual_port}/")
    print("=" * 60)
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        webbrowser.open(url)
    except Exception:
        pass
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
    finally:
        httpd.server_close()

if __name__ == "__main__":
    main()

