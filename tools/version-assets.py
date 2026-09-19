#!/usr/bin/env python3
# A-Music · asset cache-buster
# Copyright (C) 2026 Yueyu Hoshizora · SPDX-License-Identifier: AGPL-3.0-or-later
"""Stamp every local <script src> / <link rel="stylesheet" href> in index.html
with an 8-hex content-hash query string (?v=<hash>).

The site has no bundler and GitHub Pages serves plain files, so browsers (and
any CDN in front of the custom domain) are free to cache js/css aggressively.
Without a version marker, a CSS or JS fix can sit invisible in a returning
visitor's cache indefinitely. The hash is derived from the file's own bytes,
so an unrelated edit never busts a file that did not change, and editing a
file always produces a new URL.

index.html is the template tools/build-pages.py copies for every route shell,
so running this once here is enough to version the whole site. Run this
before build-pages.py so the shells inherit the fresh query strings.
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TAG = re.compile(r'((?:src|href))="(/(?:js|css)/[^"?]+\.(?:js|css))(?:\?v=[0-9a-f]{8})?"')


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as fh:
        return fh.read()


def write(path, text):
    full = os.path.join(ROOT, path)
    if os.path.exists(full) and read(path) == text:
        return False
    with open(full, 'w', encoding='utf-8') as fh:
        fh.write(text)
    return True


def content_hash(rel_path):
    with open(os.path.join(ROOT, rel_path.lstrip('/')), 'rb') as fh:
        return hashlib.sha256(fh.read()).hexdigest()[:8]


def main():
    html = read('index.html')

    def repl(m):
        attr, path = m.group(1), m.group(2)
        return '%s="%s?v=%s"' % (attr, path, content_hash(path))

    out = TAG.sub(repl, html)
    if write('index.html', out):
        print('index.html: asset versions refreshed')
    else:
        print('index.html: asset versions already current')


if __name__ == '__main__':
    main()
