/* A-Music · search
 * Wildcard matching (`*`, `?`) over artist names and song titles.
 * Song titles are not shipped as a bundle: the scanner walks each artist's
 * allVideoIds, serves anything already cached instantly, and resolves the rest
 * in bounded batches so results stream in without a giant upfront download.
 */
(function (global) {
  'use strict';

  function normalize(s) {
    if (s == null) return '';
    var str = String(s);
    if (str.normalize) str = str.normalize('NFKC');
    return str.toLowerCase();
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* Compile a query into { test(text), find(text), wildcard, raw }.
   * Semantics are "contains": `星*語` matches anywhere in the title, `?` is one
   * character. Highlight offsets are only reported when normalisation kept the
   * string length, so slices can never land mid-character.
   */
  function compile(query) {
    var raw = String(query || '').trim();
    var norm = normalize(raw);
    var wildcard = /[*?]/.test(norm);

    if (!norm) {
      return { raw: raw, wildcard: false, empty: true, test: function () { return false; }, find: function () { return null; } };
    }

    if (wildcard) {
      var body = norm.split('').map(function (ch) {
        if (ch === '*') return '[\\s\\S]*?';
        if (ch === '?') return '[\\s\\S]';
        return escapeRegex(ch);
      }).join('');
      var re = new RegExp(body, 'u');
      return {
        raw: raw, wildcard: true, empty: false,
        test: function (text) { return re.test(normalize(text)); },
        find: function (text) {
          var n = normalize(text);
          if (n.length !== String(text).length) return null;
          var m = re.exec(n);
          return m ? { start: m.index, length: m[0].length } : null;
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
            channelTitle: data.channelTitle || ch.name,
            ids: data.allVideoIds || [],
            latest: data.latestVideo || null
          };
        }, function () {
          return { channelId: ch.id, channelTitle: ch.name, ids: [], latest: null };
        });
      }));
    }).then(function (catalogues) {
      if (stopped()) return;

      var queue = [];
      catalogues.forEach(function (cat) {
        cat.ids.forEach(function (id) { queue.push({ id: id, cat: cat }); });
      });

      var total = queue.length;
      var done = 0;
      var pending = [];

      // Pass 1 — everything already cached resolves with zero network cost.
      queue.forEach(function (item) {
        var cached = global.Api.cachedTitle(item.id);
        if (cached === undefined) { pending.push(item); return; }
        done++;
        if (cached && matcher.test(cached)) {
          onResult({
            videoId: item.id, title: cached,
            channelId: item.cat.channelId, channelTitle: item.cat.channelTitle,
            genre: item.cat.latest && item.cat.latest.videoId === item.id ? item.cat.latest.genre : null
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
              genre: item.cat.latest && item.cat.latest.videoId === item.id ? item.cat.latest.genre : null
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
