import functools
import http.server
import os

directory = "/Users/leo/Library/Mobile Documents/com~apple~CloudDocs/www/tianfutong-future-edu"
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=directory)
port = int(os.environ.get("PORT", 4178))
server = http.server.ThreadingHTTPServer(("", port), handler)
server.serve_forever()
