#!/usr/bin/env python3
"""Local FlexNet dev server with gzip and Cloudflare-like cache headers."""

from __future__ import annotations

import argparse
import gzip
import io
import mimetypes
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMPRESSIBLE = {
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'image/svg+xml',
    'application/xml',
    'text/xml',
}


def cache_control(path: str) -> str:
    if path.endswith('.html') or path in {'/', ''}:
        return 'no-store'
    if path.startswith('/assets/'):
        return 'public, max-age=604800, immutable'
    if path.startswith('/css/') or path.startswith('/public/views/'):
        return 'public, max-age=86400, must-revalidate'
    if path.startswith('/src/') or path.startswith('/js/'):
        return 'public, max-age=86400, must-revalidate'
    return 'public, max-age=3600, must-revalidate'


class FlexNetHandler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def end_headers(self) -> None:
        path = self.path.split('?', 1)[0]
        self.send_header('Cache-Control', cache_control(path))
        self.send_header('Vary', 'Accept-Encoding')
        super().end_headers()

    def send_head(self):
        file_path = Path(self.translate_path(self.path))

        if not file_path.is_file():
            return super().send_head()

        ctype, _ = mimetypes.guess_type(str(file_path))
        if ctype not in COMPRESSIBLE:
            return super().send_head()

        if 'gzip' not in self.headers.get('Accept-Encoding', ''):
            return super().send_head()

        data = file_path.read_bytes()
        if len(data) <= 512:
            return super().send_head()

        compressed = gzip.compress(data)
        if len(compressed) >= len(data):
            return super().send_head()

        self.send_response(200)
        self.send_header('Content-Type', ctype or 'application/octet-stream')
        self.send_header('Content-Encoding', 'gzip')
        self.send_header('Content-Length', str(len(compressed)))
        self.end_headers()
        return io.BytesIO(compressed)


def main() -> None:
    parser = argparse.ArgumentParser(description='FlexNet local static server')
    parser.add_argument('--port', type=int, default=7002)
    parser.add_argument('--host', default='127.0.0.1')
    args = parser.parse_args()

    handler = partial(FlexNetHandler, directory=str(ROOT))
    server = ThreadingHTTPServer((args.host, args.port), handler)

    print(f'FlexNet server at http://{args.host}:{args.port}/')
    print('Cache headers and gzip enabled over HTTP/1.1.')
    print('Cloudflare Pages adds HTTP/2, Brotli, and edge cache in production.')
    server.serve_forever()


if __name__ == '__main__':
    main()
