/* A-Music · data layer
 * Copyright (C) 2026 Yueyu Hoshizora · SPDX-License-Identifier: AGPL-3.0-or-later
 * Upstream: TrackRadar (static JSON on GitHub) + YouTube oEmbed for per-video titles.
 * Nothing is bundled: channel catalogues are fetched on demand, video metadata is
 * resolved lazily in small batches and cached in localStorage.
 */
(function (global) {
  'use strict';

  var BASE = 'https://raw.githubusercontent.com/YueyuHoshizora/TrackRadar/refs/heads/main/';
  var CACHE_KEY = 'amusic:vcache:v1';
  var CACHE_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days
  var CACHE_MAX = 4000;

  var jsonCache = Object.create(null);   // url -> Promise
  var metaMem = Object.create(null);     // videoId -> {title, author, ts}
  var dirty = false;
  var flushTimer = null;

  /* ---------- localStorage-backed video metadata cache ---------- */

  function loadCache() {
    var raw = null;
    try { raw = global.localStorage.getItem(CACHE_KEY); } catch (e) { return; }
    if (!raw) return;
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return; }
    if (!parsed || !parsed.items) return;
    var now = Date.now();
    Object.keys(parsed.items).forEach(function (id) {
      var it = parsed.items[id];
      if (it && typeof it.ts === 'number' && now - it.ts < CACHE_TTL) metaMem[id] = it;
    });
  }

  function scheduleFlush() {
    dirty = true;
    if (flushTimer) return;
    flushTimer = global.setTimeout(function () {
      flushTimer = null;
      if (!dirty) return;
      dirty = false;
      var ids = Object.keys(metaMem);
      if (ids.length > CACHE_MAX) {
        ids.sort(function (a, b) { return metaMem[b].ts - metaMem[a].ts; });
        ids.slice(CACHE_MAX).forEach(function (id) { delete metaMem[id]; });
        ids = ids.slice(0, CACHE_MAX);
      }
      var items = {};
      ids.forEach(function (id) { items[id] = metaMem[id]; });
      try {
        global.localStorage.setItem(CACHE_KEY, JSON.stringify({ v: 1, items: items }));
      } catch (e) { /* quota or private mode: cache stays in memory only */ }
    }, 1200);
  }

  /* ---------- generic JSON fetch with de-duplication ---------- */

  function getJSON(url) {
    if (jsonCache[url]) return jsonCache[url];
    var p = fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      return res.json();
    }).catch(function (err) {
      delete jsonCache[url]; // allow retry
      throw err;
    });
    jsonCache[url] = p;
    return p;
  }
  /* ---------- upstream identifier validation ----------
   * Ids arrive from a scraped upstream feed and end up inside URLs, iframe
   * sources and CSS/DOM selectors, so they are validated before any use.
   */

  var VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;
  var CHANNEL_ID = /^[A-Za-z0-9_-]{6,64}$/;

  function safeVideoId(id) { return typeof id === 'string' && VIDEO_ID.test(id) ? id : null; }
  function safeChannelId(id) { return typeof id === 'string' && CHANNEL_ID.test(id) ? id : null; }

  /* Avatar/image URLs must be absolute https; anything else is dropped so a
   * poisoned feed cannot smuggle in data:, blob: or scheme-relative targets. */
  function safeImageUrl(url) {
    return typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(url) ? url : null;
  }


  /* ---------- per-video metadata (YouTube oEmbed + fallback) ---------- */

  function watchUrl(id) {
    var safe = safeVideoId(id);
    return safe ? 'https://www.youtube.com/watch?v=' + safe : '';
  }

  function fetchOEmbed(id, signal) {
    var yt = 'https://www.youtube.com/oembed?url=' + encodeURIComponent(watchUrl(id)) + '&format=json';
    return fetch(yt, { signal: signal }).then(function (res) {
      if (!res.ok) throw new Error('oembed ' + res.status);
      return res.json();
    }).catch(function (err) {
      if (err && err.name === 'AbortError') throw err;
      // Secondary provider: covers transient YouTube oEmbed failures.
      var ne = 'https://noembed.com/embed?url=' + encodeURIComponent(watchUrl(id));
      return fetch(ne, { signal: signal }).then(function (res) {
        if (!res.ok) throw new Error('noembed ' + res.status);
        return res.json();
      }).then(function (data) {
        if (!data || data.error) throw new Error('noembed error');
        return data;
      });
    });
  }

  function videoMeta(id, signal) {
    if (!safeVideoId(id)) return Promise.reject(new Error('bad video id'));
    var hit = metaMem[id];
    if (hit) {
      return Promise.resolve({
        videoId: id, title: hit.t, author: hit.a,
        url: watchUrl(id), thumbnail: Api.thumb(id), available: hit.t !== null
      });
    }
    return fetchOEmbed(id, signal).then(function (data) {
      var rec = { t: data.title || null, a: data.author_name || null, ts: Date.now() };
      metaMem[id] = rec;
      scheduleFlush();
      return {
        videoId: id, title: rec.t, author: rec.a,
        url: watchUrl(id), thumbnail: Api.thumb(id), available: true
      };
    }).catch(function (err) {
      if (err && err.name === 'AbortError') throw err;
      // Private / removed / region-blocked: remember as unavailable so we stop re-asking.
      metaMem[id] = { t: null, a: null, ts: Date.now() };
      scheduleFlush();
      return {
        videoId: id, title: null, author: null,
        url: watchUrl(id), thumbnail: Api.thumb(id), available: false
      };
    });
  }

  /* Resolve many ids with bounded concurrency; onItem fires as each settles. */
  function videoMetaBatch(ids, opts) {
    opts = opts || {};
    var concurrency = opts.concurrency || 6;
    var onItem = opts.onItem || function () {};
    var signal = opts.signal;
    var i = 0;
    var out = new Array(ids.length);

    function worker() {
      if (signal && signal.aborted) return Promise.resolve();
      var idx = i++;
      if (idx >= ids.length) return Promise.resolve();
      return videoMeta(ids[idx], signal).then(function (meta) {
        out[idx] = meta;
        onItem(meta, idx);
        return worker();
      }, function (err) {
        if (err && err.name === 'AbortError') return;
        return worker();
      });
    }

    var runners = [];
    for (var k = 0; k < Math.min(concurrency, ids.length); k++) runners.push(worker());
    return Promise.all(runners).then(function () { return out; });
  }

  var Api = {
    base: BASE,

    channels: function () { return getJSON(BASE + 'channels.json'); },
    latest: function () { return getJSON(BASE + 'latest-videos.json'); },
    genres: function () { return getJSON(BASE + 'genres.json'); },
    artist: function (channelId) {
      var safe = safeChannelId(channelId);
      if (!safe) return Promise.reject(new Error('bad channel id'));
      return getJSON(BASE + 'data/' + safe + '.json');
    },

    videoMeta: videoMeta,
    videoMetaBatch: videoMetaBatch,

    /* Cached title without any network access (null when unknown). */
    cachedTitle: function (id) {
      var hit = metaMem[id];
      return hit ? hit.t : undefined;
    },

    thumb: function (id, size) {
      var safe = safeVideoId(id);
      var variant = /^[a-z]+$/.test(String(size || '')) ? size : 'mqdefault';
      return safe ? 'https://i.ytimg.com/vi/' + safe + '/' + variant + '.jpg' : '';
    },

    embedUrl: function (id) {
      var safe = safeVideoId(id);
      return safe ? 'https://www.youtube-nocookie.com/embed/' + safe + '?autoplay=1&rel=0' : '';
    },

    safeVideoId: safeVideoId,
    safeChannelId: safeChannelId,
    safeImageUrl: safeImageUrl,

    watchUrl: watchUrl,
    channelUrl: function (channelId) {
      var safe = safeChannelId(channelId);
      return safe ? 'https://www.youtube.com/channel/' + safe : '';
    }
  };

  loadCache();
  global.Api = Api;
})(window);
