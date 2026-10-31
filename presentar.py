"""Sirve la versión compilada localmente, sin internet ni paquetes externos."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import webbrowser

root = Path(__file__).resolve().parent / 'dist'
if not (root / 'index.html').exists():
    raise SystemExit('Falta dist. Ejecuta npm run build primero.')
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
try:
    server = ThreadingHTTPServer(('127.0.0.1', 8080), handler)
except OSError:
    raise SystemExit('El puerto 8080 está ocupado. Cierra el servidor anterior e inténtalo de nuevo.')
print('SILKNODE: http://127.0.0.1:8080 — Ctrl+C para cerrar.')
webbrowser.open('http://127.0.0.1:8080')
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
