"""Dev server with Cache-Control: no-store so modules reload fresh every time."""
import http.server
import socketserver

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # silence request logs

if __name__ == "__main__":
    import sys, os
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3847
    directory = sys.argv[2] if len(sys.argv) > 2 else "."
    os.chdir(directory)
    with socketserver.TCPServer(("0.0.0.0", port), NoCacheHandler) as httpd:
        print(f"Serving {directory} on port {port}")
        httpd.serve_forever()
