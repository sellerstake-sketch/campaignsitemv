#!/usr/bin/env python3
"""
Simple HTTP Server for Development
Run this script to serve the application locally
"""
import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8000

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
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/"
        print("=" * 60)
        print(f"Server started at http://localhost:{PORT}")
        print(f"Open your browser and go to: {url}")
        print("=" * 60)
        print("\nPress Ctrl+C to stop the server\n")
        
        # Try to open browser automatically
        try:
            webbrowser.open(url)
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")

if __name__ == "__main__":
    main()

