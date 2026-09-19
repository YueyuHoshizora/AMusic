/* A-Music · search
 * Copyright (C) 2026 Yueyu Hoshizora · SPDX-License-Identifier: AGPL-3.0-or-later
 * Wildcard matching (`*`, `?`) over artist names and song titles.
 * The scanner walks each artist's allVideoIds. Titles/genres shipped on
 * those records resolve instantly; anything still missing falls back to
 * the title cache, then oEmbed in bounded batches.
 */
(function (global) {
  'use strict';

  function normalize(s) {
    if (s == null) return '';
    var str = String(s);
    if (str.normalize) str = str.normalize('NFKC');
    return str.toLowerCase();
  }

  /* Linear unanchored wildcard matcher (O(N * M)) to prevent catastrophic
   * backtracking / ReDoS from arbitrary wildcard queries. */
  function matchWildcardSubstring(pattern, text) {
    if (!pattern) return { start: 0, length: 0 };
    var pLen = pattern.length;
    var tLen = text.length;

    for (var s = 0; s <= tLen; s++) {
      var p = 0;
      var t = s;
      var starIdx = -1;
      var matchIdx = -1;

      while (t < tLen) {
        if (p === pLen) break;
        if (p < pLen && (pattern.charAt(p) === '?' || pattern.charAt(p) === text.charAt(t))) {
          p++;
          t++;
        } else if (p < pLen && pattern.charAt(p) === '*') {
          starIdx = p;
          matchIdx = t;
          p++;
        } else if (starIdx !== -1) {
          p = starIdx + 1;
          matchIdx++;
          t = matchIdx;
        } else {
          break;
        }
      }

      while (p < pLen && pattern.charAt(p) === '*') p++;

      if (p === pLen) return { start: s, length: t - s };

      if (pattern.charAt(0) !== '*' && pattern.charAt(0) !== '?') {
        var nextS = text.indexOf(pattern.charAt(0), s + 1);
        if (nextS === -1) break;
        s = nextS - 1;
      }
    }
    return null;
  }

  /* Compile a query into { test(text), find(text), wildcard, raw }.
   * Semantics are "contains": `星*語` matches anywhere in the title, `?` is one
   * character. Highlight offsets are only reported when normalisation kept the
   * string length, so slices can never land mid-character.
   */
  function compile(query) {
    var raw = String(query || '').slice(0, 50).trim();
    var norm = normalize(raw);

    // Collapse consecutive '*' and limit wildcards to prevent DoS
    norm = norm.replace(/\*+/g, '*');
    var wildcards = 0;
    var limited = '';
    for (var i = 0; i < norm.length; i++) {
      var c = norm.charAt(i);
      if (c === '*' || c === '?') {
        wildcards++;
        if (wildcards <= 6) limited += c;
      } else {
        limited += c;
      }
    }
    norm = limited;
    var wildcard = /[*?]/.test(norm);

    if (!norm) {
      return { raw: raw, wildcard: false, empty: true, test: function () { return false; }, find: function () { return null; } };
    }

    if (wildcard) {
      return {
        raw: raw, wildcard: true, empty: false,
        test: function (text) {
          return matchWildcardSubstring(norm, normalize(text)) !== null;
        },
        find: function (text) {
          var n = normalize(text);
          if (n.length !== String(text).length) return null;
          return matchWildcardSubstring(norm, n);
        }
      };
    }

    return {
      raw: raw, wildcard: false, empty: false,
      test: function (text) { return normalize(text).indexOf(norm) !== -1; },
      find: function (text) {
        var n = normalize(text);
        if (n.length !== String(text).length) return null;
        var idx = n.indexOf(norm);
        return idx === -1 ? null : { start: idx, length: norm.length };
      }
    };
  }

  /* Progressive catalogue scan. Returns a handle with .abort(). */
  function scan(matcher, handlers) {
    var onResult = handlers.onResult || function () {};
    var onProgress = handlers.onProgress || function () {};
    var onDone = handlers.onDone || function () {};
    var onError = handlers.onError || function () {};
    var controller = ('AbortController' in global) ? new AbortController() : null;
    var aborted = false;

    function stopped() { return aborted; }

    global.Api.channels().then(function (channels) {
      return Promise.all(channels.map(function (ch) {
        return global.Api.artist(ch.id).then(function (data) {
          return {
            channelId: ch.id,
            // channels.json is authoritative: data/<id>.json repeats the raw
            // channel id as channelTitle until the first video is indexed.
            channelTitle: ch.name || data.channelTitle,
            works: global.Api.parseWorks(data.allVideoIds)
          };
        }, function () {
          return { channelId: ch.id, channelTitle: ch.name, works: [] };
        });
      }));
    }).then(function (catalogues) {
      if (stopped()) return;

      var queue = [];
      catalogues.forEach(function (cat) {
        cat.works.forEach(function (w) {
          queue.push({ id: w.videoId, title: w.title, genre: w.genre, cat: cat });
        });
      });

      var total = queue.length;
      var done = 0;
      var pending = [];

      // Pass 1 — JSON titles and the local cache resolve with zero network cost.
      queue.forEach(function (item) {
        var title = item.title;
        if (!title) {
          var cached = global.Api.cachedTitle(item.id);
          if (cached === undefined) { pending.push(item); return; }
          title = cached;
        }
        done++;
        if (title && matcher.test(title)) {
          onResult({
            videoId: item.id, title: title,
            channelId: item.cat.channelId, channelTitle: item.cat.channelTitle,
            genre: item.genre
          });
        }
      });
      onProgress(done, total);

      if (!pending.length) { onDone(total); return; }

      var index = 0;
      var CONCURRENCY = 6;

      function next() {
        if (stopped()) return Promise.resolve();
        var i = index++;
        if (i >= pending.length) return Promise.resolve();
        var item = pending[i];
        return global.Api.videoMeta(item.id, controller && controller.signal).then(function (meta) {
          done++;
          if (done % 8 === 0 || done === total) onProgress(done, total);
          if (meta.title && matcher.test(meta.title)) {
            onResult({
              videoId: item.id, title: meta.title,
              channelId: item.cat.channelId, channelTitle: item.cat.channelTitle,
              genre: item.genre
            });
          }
          return next();
        }, function (err) {
          if (err && err.name === 'AbortError') return;
          done++;
          return next();
        });
      }

      var runners = [];
      for (var k = 0; k < Math.min(CONCURRENCY, pending.length); k++) runners.push(next());
      return Promise.all(runners).then(function () {
        if (!stopped()) { onProgress(total, total); onDone(total); }
      });
    }).catch(function (err) {
      if (!stopped()) onError(err);
    });

    return {
      abort: function () {
        aborted = true;
        if (controller) controller.abort();
      },
      get aborted() { return aborted; }
    };
  }

  global.SearchEngine = {
    compile: compile,
    normalize: normalize,
    scan: scan,

    /* Artists match on their channel name. */
    matchArtists: function (matcher, channels) {
      return channels.filter(function (ch) { return matcher.test(ch.name); });
    }
  };
})(window);
