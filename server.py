import http.server
import socketserver
import urllib.parse
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5500

class SimpleUploadHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/upload':
            query = urllib.parse.parse_qs(parsed.query)
            filepath = query.get('path', [None])[0]
            if filepath:
                # Security check to prevent path traversal
                if '..' in filepath or filepath.startswith('/'):
                    self.send_response(403)
                    self.end_headers()
                    return
                
                # Ensure directory exists
                directory = os.path.dirname(filepath)
                if directory:
                    os.makedirs(directory, exist_ok=True)
                
                # Read file data
                length = int(self.headers.get('Content-Length', 0))
                data = self.rfile.read(length)
                
                with open(filepath, 'wb') as f:
                    f.write(data)
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"success": true}')
                return
                
        elif parsed.path == '/delete':
            query = urllib.parse.parse_qs(parsed.query)
            filepath = query.get('path', [None])[0]
            if filepath:
                # Security check to prevent path traversal
                if '..' in filepath or filepath.startswith('/'):
                    self.send_response(403)
                    self.end_headers()
                    return
                
                try:
                    if os.path.exists(filepath):
                        os.remove(filepath)
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(b'{"success": true}')
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(f'{{"success": false, "error": "{str(e)}" }}'.encode())
                return

        self.send_response(404)
        self.end_headers()

socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), SimpleUploadHandler) as httpd:
    print(f"Serving with upload support at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
