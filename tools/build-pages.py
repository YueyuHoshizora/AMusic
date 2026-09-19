#!/usr/bin/env python3
# A-Music · route shell generator
# Copyright (C) 2026 Yueyu Hoshizora · SPDX-License-Identifier: AGPL-3.0-or-later
"""Emit one real index.html per route, plus both sitemaps and the 404 fallback.

GitHub Pages has no rewrite rules: a path only answers 200 if a file exists
there. Without these shells, path routing would make every route a 404 and
nothing but the apex could be indexed. Each shell is index.html with the
route's own <title>, description, canonical, hreflang and Open Graph values,
so crawlers get correct metadata before any JavaScript runs; js/app.js then
hydrates the same markup.

Single source of truth: index.html (template), js/i18n.js (zh strings),
js/genres.js (genre slugs/labels), and TrackRadar channels.json (artists).

Run from the repo root after changing the shell, the genre table, or when
upstream adds an artist:

    python3 tools/build-pages.py
"""

import hashlib
import html
import json
import os
import re
import sys
import urllib.request

ORIGIN = 'https://a-music.app'
UPSTREAM = 'https://raw.githubusercontent.com/YueyuHoshizora/TrackRadar/refs/heads/main/'
LOCALES = [('zh-Hant', ''), ('en', '?lang=en'), ('ja', '?lang=ja'), ('x-default', '')]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Directories this script owns. Everything inside is regenerated from scratch,
# so a removed genre or artist never leaves an orphan page behind.
OWNED_DIRS = ['latest', 'artists', 'genres', 'genre', 'artist', 'search']

# Videos live on their artist's page: js/app.js swaps the thumbnail for a
# youtube-nocookie iframe in place, so that page really does host the player
# a video sitemap promises. Each video is listed exactly once.
YT_THUMB = 'https://i.ytimg.com/vi/%s/hqdefault.jpg'
YT_EMBED = 'https://www.youtube-nocookie.com/embed/%s'
VIDEO_ID = re.compile(r'^[A-Za-z0-9_-]{11}$')
CHANNEL_ID = re.compile(r'^[A-Za-z0-9_-]{6,64}$')
VIDEO_TITLE_MAX = 100          # Google truncates past this; do it ourselves

# Upstream fingerprint, so the five-minute schedule can bail out cheaply.
STAMP_FILE = '.pages-stamp'


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as fh:
        return fh.read()


def write(path, text):
    """Only touch the file when the bytes change: rewriting every shell on
    every run churns mtimes and, on synced folders, invites conflict copies."""
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    try:
        if read(path) == text:
            return False
    except FileNotFoundError:
        pass
    with open(full, 'w', encoding='utf-8') as fh:
        fh.write(text)
    return True


def prune(expected):
    """Drop anything stale under the owned directories — a removed genre, a
    dropped artist, or a stray copy left by a syncing filesystem."""
    for name in OWNED_DIRS:
        base = os.path.join(ROOT, name)
        for dirpath, _dirnames, filenames in os.walk(base, topdown=False):
            for filename in filenames:
                full = os.path.join(dirpath, filename)
                rel = os.path.relpath(full, ROOT)
                if rel not in expected:
                    os.remove(full)
                    print('  - %s' % rel)
            if not os.listdir(dirpath):
                os.rmdir(dirpath)


def fetch_json(name):
    with urllib.request.urlopen(UPSTREAM + name, timeout=30) as resp:
        return json.load(resp)


def zh_string(i18n_src, key):
    """First match wins: the zh dictionary is the first block in js/i18n.js."""
    m = re.search(r"'%s':\s*'((?:[^'\\]|\\.)*)'" % re.escape(key), i18n_src)
    if not m:
        sys.exit('missing i18n key: ' + key)
    return m.group(1).replace("\\'", "'")


def genre_entries(genres_src):
    out = []
    for m in re.finditer(r"\n    '((?:[^'\\]|\\.)*)':\s*\{(.*?)\n    \}", genres_src, re.S):
        body = m.group(2)
        slug = re.search(r"slug:\s*'([^']+)'", body)
        label = re.search(r"\bzh:\s*'((?:[^'\\]|\\.)*)'", body)
        desc = re.search(r"\bdzh:\s*'((?:[^'\\]|\\.)*)'", body)
        if not (slug and label):
            sys.exit('unparsable genre entry: ' + m.group(1))
        out.append({
            'slug': slug.group(1),
            'label': label.group(1).replace("\\'", "'"),
            'desc': (desc.group(1) if desc else '').replace("\\'", "'"),
        })
    if not out:
        sys.exit('no genres parsed from js/genres.js')
    return out


def video_entries(channel, videos, meta, templates, seen):
    """One <video:video> per track of one artist, in upstream order.

    Titles and ids come from a scraped feed: ids are checked against the
    YouTube id shape before they reach a URL, and anything without a title is
    skipped — video:title is required and must not be invented."""
    out = []
    for item in videos:
        if not isinstance(item, dict):
            continue
        vid = str(item.get('videoId') or '')
        title = (item.get('title') or '').strip()
        if not VIDEO_ID.match(vid) or not title or vid in seen:
            continue
        seen.add(vid)
        if len(title) > VIDEO_TITLE_MAX:
            title = title[:VIDEO_TITLE_MAX - 1].rstrip() + '\u2026'
        genre = (item.get('genre') or '').strip()
        # Upstream leaves genre empty when its classifier is unsure; saying
        # "genre: —" would be worse than not mentioning it.
        desc = (templates[1] if not genre else templates[0]) \
            .replace('{name}', channel).replace('{title}', title).replace('{genre}', genre)
        rows = [
            '<video:thumbnail_loc>%s</video:thumbnail_loc>' % (YT_THUMB % vid),
            '<video:title>%s</video:title>' % html.escape(title),
            '<video:description>%s</video:description>' % html.escape(desc),
            # allow_embed says the player may be embedded: YouTube's /embed
            # endpoint answers "error 153" to a request with no Referer, which
            # is exactly how a crawler would fetch this URL on its own.
            '<video:player_loc allow_embed="yes">%s</video:player_loc>' % (YT_EMBED % vid),
        ]
        # Only the newest track of each artist carries a timestamp and a
        # runtime upstream; both tags are optional, so the rest go without
        # rather than with a guess.
        extra = meta.get(vid) or {}
        seconds = extra.get('durationSeconds')
        if isinstance(seconds, int) and 0 < seconds <= 28800:
            rows.append('<video:duration>%d</video:duration>' % seconds)
        published = str(extra.get('publishedAt') or '')
        if re.match(r'^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$', published):
            rows.append('<video:publication_date>%s</video:publication_date>' % published)
        if genre:
            rows.append('<video:tag>%s</video:tag>' % html.escape(genre))
        out.append('<video:video>%s</video:video>' % ''.join(rows))
    return out


def sub_once(text, pattern, replacement, label):
    new, n = re.subn(pattern, lambda _m: replacement, text, count=1)
    if n != 1:
        sys.exit('template pattern not found (%s)' % label)
    return new


def shell(template, path, title, desc, noindex=False, indexable=True):
    """`path` is the route with a trailing slash; `title` is the full <title>."""
    t, d = html.escape(title, quote=True), html.escape(desc, quote=True)
    out = sub_once(template, r'<title>.*?</title>', '<title>%s</title>' % html.escape(title), 'title')
    for name, value in [('description', d), ('twitter:title', t), ('twitter:description', d)]:
        out = sub_once(out, r'<meta name="%s" content="[^"]*">' % re.escape(name),
                       '<meta name="%s" content="%s">' % (name, value), name)
    for prop, value in [('og:title', t), ('og:description', d), ('og:url', ORIGIN + path)]:
        out = sub_once(out, r'<meta property="%s" content="[^"]*">' % re.escape(prop),
                       '<meta property="%s" content="%s">' % (prop, value), prop)

    canonical = '<link rel="canonical" href="%s%s">' % (ORIGIN, path)
    alternates = '\n'.join(
        '<link rel="alternate" hreflang="%s" href="%s%s%s">' % (code, ORIGIN, path, suffix)
        for code, suffix in LOCALES
    )
    block = canonical + '\n' + alternates
    if not indexable:
        # A 404 body must not claim to be a canonical page of its own.
        block = ''
    if noindex or not indexable:
        block = ('<meta name="robots" content="noindex, follow">\n' + block).rstrip('\n')
    out = sub_once(
        out,
        r'<link rel="canonical"[^>]*>\n(?:<link rel="alternate"[^>]*>\n?)+',
        block + '\n',
        'canonical block',
    )
    if not indexable:
        # No ads on the error page: nothing to monetise and AdSense dislikes
        # serving into 404 responses.
        out = sub_once(out, r'\n<script async src="https://pagead2\.googlesyndication\.com[^>]*></script>',
                       '', 'adsense')
    return out


def main():
    # The scheduled job runs every five minutes; --if-changed lets it exit after
    # two requests when the upstream catalogue has not moved, instead of pulling
    # every data/<channel>.json each time. The roster is part of the fingerprint
    # on purpose: a new artist needs a new shell even if updatedAt never moved.
    latest = fetch_json('latest-videos.json')
    updated_at = str(latest.get('updatedAt') or '')
    if not updated_at:
        sys.exit('upstream latest-videos.json has no updatedAt')
    raw_channels = fetch_json('channels.json')
    channels = [ch for ch in raw_channels if isinstance(ch, dict) and CHANNEL_ID.match(str(ch.get('id') or ''))]
    roster = ','.join(sorted(str(ch.get('id') or '') for ch in channels))
    stamp = updated_at + ' ' + hashlib.sha256(roster.encode('utf-8')).hexdigest()[:16]
    if '--if-changed' in sys.argv[1:]:
        try:
            if read(STAMP_FILE).strip() == stamp:
                print('upstream unchanged (%s); nothing to do' % stamp)
                return
        except FileNotFoundError:
            pass

    template = read('index.html')
    i18n_src = read('js/i18n.js')
    genres_src = read('js/genres.js')

    site_name = zh_string(i18n_src, 'site.name')
    suffix = ' · ' + site_name

    def t(key):
        return zh_string(i18n_src, key)

    catalogue, tracks = {}, {}
    for ch in channels:
        try:
            data = fetch_json('data/%s.json' % ch['id'])
            catalogue[ch['id']] = data.get('allVideoIds') or []
        except Exception as exc:                      # upstream gaps must not abort the build
            print('  ! %s: %s' % (ch['id'], exc))
            catalogue[ch['id']] = []
        tracks[ch['id']] = len(catalogue[ch['id']])

    # Runtime and publish time exist only for each artist's newest track.
    newest = {}
    for entry in latest.get('channels') or []:
        video = (entry or {}).get('latestVideo') or {}
        if video.get('videoId'):
            newest[str(video['videoId'])] = video

    routes = [
        ('/latest/', t('home.latest') + suffix, t('home.latest.desc'), True),
        ('/artists/', t('artists.title') + suffix, t('artists.desc'), True),
        ('/genres/', t('genres.title') + suffix, t('genres.desc'), True),
    ]
    for g in genre_entries(genres_src):
        routes.append(('/genre/%s/' % g['slug'], g['label'] + suffix, g['desc'], True))
    artist_desc = t('seo.artist.desc')
    for ch in channels:
        name = ch.get('name') or ch['id']
        desc = artist_desc.replace('{name}', name).replace('{n}', format(tracks.get(ch['id'], 0), ','))
        routes.append(('/artist/%s/' % ch['id'], name + suffix, desc, True))
    routes.append(('/search/', t('search.label') + suffix, t('seo.search.desc'), False))

    written = [path.strip('/') + '/index.html' for path, _t, _d, _i in routes]
    prune(set(written))

    for path, title, desc, indexed in routes:
        write(path.strip('/') + '/index.html', shell(template, path, title, desc, noindex=not indexed))
    print('wrote %d route shells' % len(routes))

    # Fallback for paths with no shell (a brand-new artist, or a dead URL).
    # GitHub Pages serves it with a 404 status; the app still renders, so the
    # page works for visitors while staying out of the index.
    write('404.html', shell(template, '/', t('notfound.title') + suffix, t('notfound.desc'),
                            indexable=False))

    # lastmod tracks the upstream catalogue, not the clock: a wall-clock date
    # would rewrite sitemap.xml on every scheduled run and claim changes that
    # never happened.
    lastmod = updated_at[:10]
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', lastmod):
        sys.exit('upstream updatedAt malformed: ' + updated_at)
    entries = []
    for path, _title, _desc, indexed in [('/', None, None, True)] + routes:
        if not indexed:
            continue
        links = ''.join(
            '<xhtml:link rel="alternate" hreflang="%s" href="%s%s%s"/>' % (code, ORIGIN, path, sfx)
            for code, sfx in LOCALES
        )
        entries.append(
            '<url><loc>%s%s</loc><lastmod>%s</lastmod>%s</url>' % (ORIGIN, path, lastmod, links)
        )
    # No indentation and no comment banner anywhere below: sitemaps are read by
    # crawlers only, and the layout was 6% of the bytes on the wire.
    write('sitemap.xml',
          '<?xml version="1.0" encoding="UTF-8"?>'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
          ' xmlns:xhtml="http://www.w3.org/1999/xhtml">'
          + ''.join(entries) + '</urlset>\n')
    print('wrote sitemap.xml with %d urls' % len(entries))

    # Videos get their own sitemap: one <url> per artist page, carrying every
    # track that plays on it. Keeping them out of sitemap.xml means the page
    # sitemap stays small enough to be re-read on every crawl.
    video_desc = (t('seo.video.desc'), t('seo.video.desc.plain'))
    seen, blocks = set(), []
    for ch in channels:
        videos = video_entries(ch.get('name') or ch['id'], catalogue.get(ch['id']) or [],
                               newest, video_desc, seen)
        if not videos:
            continue
        blocks.append('<url><loc>%s/artist/%s/</loc>%s</url>'
                      % (ORIGIN, ch['id'], ''.join(videos)))
    write('sitemap-videos.xml',
          '<?xml version="1.0" encoding="UTF-8"?>'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
          ' xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">'
          + ''.join(blocks) + '</urlset>\n')
    print('wrote sitemap-videos.xml with %d videos on %d pages' % (len(seen), len(blocks)))
    write(STAMP_FILE, stamp + '\n')


if __name__ == '__main__':
    main()
