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

