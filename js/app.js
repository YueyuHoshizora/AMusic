/* A-Music · views + hash router */
(function (global) {
  'use strict';

  var I18N = global.I18N, Api = global.Api, Genres = global.Genres, SearchEngine = global.SearchEngine;
  var main = document.getElementById('main');
  var PAGE_SIZE = 12;

  var teardown = [];          // per-view cleanup (observers, scans)
  var currentRoute = null;

  /* ---------------- tiny DOM helpers ---------------- */

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    append(el, children);
    return el;
  }

  function append(parent, children) {
    if (children == null) return parent;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      parent.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return parent;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function section(titleKey, descKey, extra) {
    return h('header', { class: 'section-head' }, [
      h('h2', { text: I18N.t(titleKey) }),
      descKey ? h('p', { class: 'muted', text: I18N.t(descKey) }) : null,
      extra || null
    ]);
  }

  function spinner(labelKey) {
    return h('div', { class: 'loading' }, [
      h('span', { class: 'spinner', 'aria-hidden': 'true' }),
      h('span', { text: I18N.t(labelKey || 'common.loading') })
    ]);
  }

  function errorBox(retry) {
    return h('div', { class: 'error-box' }, [
      h('p', { text: I18N.t('common.error') }),
      h('button', { class: 'btn', type: 'button', text: I18N.t('common.retry'), onclick: retry })
    ]);
  }

  function genreBadge(genreKey) {
    if (!genreKey) return null;
    return h('a', {
      class: 'badge genre-badge',
      href: '#/genre/' + Genres.slug(genreKey),
      title: Genres.description(genreKey)
    }, [h('span', { class: 'badge-icon', 'aria-hidden': 'true', text: Genres.icon(genreKey) }), Genres.label(genreKey)]);
  }

  function initials(name) {
    var s = String(name || '?').trim();
    return s.slice(0, /[A-Za-z]/.test(s[0]) ? 2 : 1).toUpperCase();
  }

  /* Avatar: initials are the always-present fallback; the channel photo from
   * channels.json fades in on top and is dropped if the request fails. */
  function avatar(name, url, cls) {
    var box = h('span', {
      class: 'avatar' + (cls ? ' ' + cls : ''),
      'aria-hidden': 'true',
      text: initials(name)
    });
    var safeUrl = Api.safeImageUrl(url);
    if (safeUrl) {
      box.appendChild(h('img', {
        src: safeUrl, alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer',
        onload: function () { this.classList.add('ready'); },
        onerror: function () { this.remove(); }
      }));
    }
    return box;
  }

  function indexChannels(channels) {
    var map = Object.create(null);
    (channels || []).forEach(function (ch) {
      if (Api.safeChannelId(ch && ch.id)) map[ch.id] = ch;
    });
    return map;
  }

  /* Upstream lists a channel as soon as it is tracked, so latest-videos.json can
   * carry entries whose first video is not indexed yet (latestVideo: null).
   * Those rows are not renderable and must never reach a view. */
  function liveFeed(latest) {
    var rows = latest && latest.channels ? latest.channels : [];
    return rows.filter(function (c) { return c && c.latestVideo && c.latestVideo.videoId; });
  }

  /* Card for a latest-videos.json row; display name and avatar come from
   * channels.json, which is the authoritative channel catalogue. */
  function feedCard(c, chIndex, featured) {
    var known = chIndex[c.channelId];
    return videoCard(c.latestVideo.videoId, {
      title: c.latestVideo.title,
      channelId: c.channelId,
      channelTitle: (known && known.name) || c.channelTitle,
      channelAvatar: known && known.avatarUrl,
      genre: c.latestVideo.genre,
      publishedAt: c.latestVideo.publishedAt,
      duration: c.latestVideo.durationSeconds,
      featured: !!featured
    });
  }

  /* Artist listings are shuffled on every render: no one keeps the top slot.
   * Fisher-Yates on a copy, so the cached channels.json array stays intact. */
  function shuffled(list) {
    var out = (list || []).slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  /* highlight a plain-text match without innerHTML injection */
  function highlighted(text, matcher) {
    var frag = document.createDocumentFragment();
    var hit = matcher && matcher.find ? matcher.find(text) : null;
    if (!hit) { frag.appendChild(document.createTextNode(text)); return frag; }
    frag.appendChild(document.createTextNode(text.slice(0, hit.start)));
    frag.appendChild(h('mark', { text: text.slice(hit.start, hit.start + hit.length) }));
    frag.appendChild(document.createTextNode(text.slice(hit.start + hit.length)));
    return frag;
  }

  /* ---------------- video card ---------------- */

  function playInline(thumbWrap, videoId) {
    var src = Api.embedUrl(videoId);
    if (!src) return;
    var frame = h('iframe', {
      class: 'player',
      src: src,
      title: 'YouTube',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture',
      allowfullscreen: true,
      loading: 'lazy',
      frameborder: '0'
    });
    clear(thumbWrap);
    thumbWrap.classList.add('playing');
    thumbWrap.appendChild(frame);
  }

  /* opts: {title, channelTitle, channelId, genre, publishedAt, duration, featured, matcher} */
  function videoCard(videoId, opts) {
    opts = opts || {};
    var titleEl = h('h3', { class: 'card-title' });
    if (opts.title) titleEl.appendChild(highlighted(opts.title, opts.matcher));
    else { titleEl.classList.add('skeleton-text'); titleEl.textContent = '\u00a0'; }

    var thumbWrap = h('div', { class: 'thumb' }, [
      h('img', {
        src: Api.thumb(videoId, opts.featured ? 'hqdefault' : 'mqdefault'),
        alt: '', loading: 'lazy', decoding: 'async', width: '480', height: '360',
        onerror: function () { this.classList.add('img-fallback'); }
      }),
      h('button', {
        class: 'play-btn', type: 'button', 'aria-label': I18N.t('video.watch'),
        onclick: function () { playInline(thumbWrap, videoId); }
      }, [h('span', { class: 'play-icon', 'aria-hidden': 'true' })]),
      opts.duration ? h('span', { class: 'duration', text: I18N.formatDuration(opts.duration) }) : null
    ]);

    var meta = h('div', { class: 'card-meta' }, [
      Api.safeChannelId(opts.channelId) ? h('a', { class: 'card-artist', href: '#/artist/' + opts.channelId }, [
        avatar(opts.channelTitle, opts.channelAvatar, 'avatar-xs'),
        h('span', { text: opts.channelTitle || '' })
      ]) : null,
      opts.publishedAt ? h('time', {
        class: 'muted small', datetime: opts.publishedAt,
        text: I18N.t('video.published', { date: I18N.formatDate(opts.publishedAt) })
      }) : null
    ]);

    var card = h('article', { class: 'card video-card' + (opts.featured ? ' featured' : ''), 'data-vid': videoId }, [
      thumbWrap,
      h('div', { class: 'card-body' }, [
        titleEl,
        meta,
        h('div', { class: 'card-foot' }, [
          genreBadge(opts.genre),
          h('a', { class: 'yt-link', href: Api.watchUrl(videoId), target: '_blank', rel: 'noopener', text: I18N.t('video.watch') })
        ])
      ])
    ]);

    card.setTitleFromMeta = function (meta2) {
      titleEl.classList.remove('skeleton-text');
      clear(titleEl);
      if (meta2 && meta2.title) {
        titleEl.appendChild(highlighted(meta2.title, opts.matcher));
        card.setAttribute('data-title', meta2.title);
      } else {
        titleEl.textContent = I18N.t('video.unavailable');
        card.classList.add('unavailable');
      }
    };
    return card;
  }

  function artistCard(ch, extra) {
    return h('a', {
      class: 'card artist-card',
      href: Api.safeChannelId(ch.id) ? '#/artist/' + ch.id : '#/artists'
    }, [
      avatar(ch.name, ch.avatarUrl),
      h('span', { class: 'artist-info' }, [
        h('strong', { class: 'artist-name' }, [extra && extra.matcher ? highlighted(ch.name, extra.matcher) : ch.name]),
        extra && extra.countText ? h('span', { class: 'muted small', text: extra.countText }) : null,
        extra && extra.genre ? h('span', { class: 'badge genre-badge static' }, [
          h('span', { class: 'badge-icon', 'aria-hidden': 'true', text: Genres.icon(extra.genre) }),
          Genres.label(extra.genre)
        ]) : null
      ])
    ]);
  }

  /* ---------------- lazy masonry ("瀑布流") for an artist's back catalogue ----------------
   * Cards are placed into fixed columns (shortest-column-first) so appending a
   * batch never reshuffles what is already on screen — unlike CSS multi-column.
   * Batches are only fetched once the sentinel actually approaches the viewport.
   */

  function createMasonry() {
    var root = h('div', { class: 'masonry' });
    var columns = [];
    var items = [];
    var currentCount = 0;

    function desiredCount() {
      var w = root.clientWidth || global.innerWidth || 360;
      if (w >= 1240) return 4;
      if (w >= 900) return 3;
      if (w >= 560) return 2;
      return 1;
    }

    function buildColumns(n) {
      clear(root);
      columns = [];
      for (var i = 0; i < n; i++) {
        var col = h('div', { class: 'masonry-col' });
        columns.push(col);
        root.appendChild(col);
      }
      currentCount = n;
    }

    function shortest() {
      var best = columns[0], bestH = best.offsetHeight;
      for (var i = 1; i < columns.length; i++) {
        var hgt = columns[i].offsetHeight;
        if (hgt < bestH) { best = columns[i]; bestH = hgt; }
      }
      return best;
    }

    function place(card) { shortest().appendChild(card); }

    function relayout() {
      var n = desiredCount();
      if (n === currentCount) return;
      buildColumns(n);
      items.forEach(place);
    }

    buildColumns(desiredCount());

    if ('ResizeObserver' in global) {
      var ro = new ResizeObserver(function () { relayout(); });
      ro.observe(root);
      teardown.push(function () { ro.disconnect(); });
    } else {
      var onResize = function () { relayout(); };
      global.addEventListener('resize', onResize);
      teardown.push(function () { global.removeEventListener('resize', onResize); });
    }

    return {
      el: root,
      add: function (card) { items.push(card); place(card); }
    };
  }

  function mountWorkGrid(host, ids, ctx) {
    // Upstream id lists are unvalidated input; drop anything that is not a
    // plain YouTube id before it reaches a URL or an iframe.
    ids = (ids || []).filter(function (id) { return !!Api.safeVideoId(id); });
    var loaded = 0;
    var busy = false;
    var masonry = createMasonry();
    var status = h('p', { class: 'load-status muted' });
    var moreBtn = h('button', { class: 'btn ghost', type: 'button', text: I18N.t('artist.loadMore'), onclick: function () { loadNext(); } });
    var sentinel = h('div', { class: 'sentinel', 'aria-hidden': 'true' });

    append(host, [masonry.el, sentinel, h('div', { class: 'load-more' }, [status, moreBtn])]);

    function loadNext() {
      if (busy || loaded >= ids.length) return;
      busy = true;
      moreBtn.disabled = true;
      status.textContent = I18N.t('artist.loadingMore');

      var slice = ids.slice(loaded, loaded + PAGE_SIZE);
      loaded += slice.length;

      // Cards mount with a fixed-ratio thumbnail placeholder; titles stream in after.
      var cards = slice.map(function (id) {
        var card = videoCard(id, { channelId: ctx.channelId, channelTitle: ctx.channelTitle, channelAvatar: ctx.channelAvatar });
        masonry.add(card);
        return card;
      });

      Api.videoMetaBatch(slice, {
        concurrency: 6,
        onItem: function (meta, idx) { cards[idx].setTitleFromMeta(meta); }
      }).then(function () {
        busy = false;
        if (loaded >= ids.length) {
          status.textContent = I18N.t('artist.allLoaded', { n: I18N.formatNumber(ids.length) });
          moreBtn.remove();
          if (io) io.disconnect();
        } else {
          status.textContent = I18N.formatNumber(loaded) + ' / ' + I18N.formatNumber(ids.length);
          moreBtn.disabled = false;
          fillViewport();
        }
      });
    }

    /* If the batch was too short to make the page scrollable, the observer will
     * never fire again — top up until the sentinel is pushed below the fold. */
    function fillViewport() {
      global.requestAnimationFrame(function () {
        if (busy || loaded >= ids.length || !sentinel.isConnected) return;
        var rect = sentinel.getBoundingClientRect();
        if (rect.top <= (global.innerHeight || 0) + 120) loadNext();
      });
    }

    var io = null;
    if ('IntersectionObserver' in global) {
      // Small margin on purpose: the next batch is fetched only once the reader
      // has actually scrolled close to the end of what is already rendered.
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) loadNext(); });
      }, { rootMargin: '120px 0px' });
      io.observe(sentinel);
      teardown.push(function () { io.disconnect(); });
    }
    loadNext();
  }

  /* ---------------- views ---------------- */

  function viewHome() {
    var wrap = h('div', { class: 'view' });
    var hero = h('section', { class: 'hero' }, [
      h('div', { class: 'hero-copy' }, [
        h('p', { class: 'eyebrow', text: I18N.t('site.tagline') }),
        h('h1', { text: I18N.t('home.hero.title') }),
        h('p', { class: 'lede', text: I18N.t('home.hero.desc') }),
        h('div', { class: 'hero-actions' }, [
          h('a', { class: 'btn primary', href: '#/artists', text: I18N.t('home.hero.cta') }),
          h('a', { class: 'btn ghost', href: '#/genres', text: I18N.t('nav.genres') })
        ]),
        h('dl', { class: 'stats', id: 'home-stats' })
      ])
    ]);

    var chips = h('div', { class: 'chip-row', id: 'home-chips' });
    var latestSec = h('section', { class: 'block' }, [
      section('home.latest', 'home.latest.desc'),
      h('div', { class: 'grid video-grid', id: 'latest-grid' }, [spinner()])
    ]);
    var artistSec = h('section', { class: 'block' }, [
      section('home.artists', 'home.artists.desc',
        h('a', { class: 'section-link', href: '#/artists', text: I18N.t('home.viewAll') })),
      h('div', { class: 'grid artist-grid', id: 'artist-grid' }, [spinner()])
    ]);

    append(wrap, [hero, chips, latestSec, artistSec]);
    render(wrap);

    Promise.all([Api.latest(), Api.channels(), Api.genres()]).then(function (res) {
      var latest = res[0], channels = res[1], genreMap = res[2];
      renderFooterUpdated(latest.updatedAt);

      var chIndex = indexChannels(channels);
      var feed = liveFeed(latest);

      var usedGenres = [];
      feed.forEach(function (c) {
        var g = c.latestVideo.genre;
        if (g && usedGenres.indexOf(g) === -1) usedGenres.push(g);
      });

      clear(chips);
      append(chips, [h('a', { class: 'chip active', href: '#/', text: I18N.t('genre.all') })].concat(
        usedGenres.map(function (g) {
          return h('a', { class: 'chip', href: '#/genre/' + Genres.slug(g) }, [
            h('span', { 'aria-hidden': 'true', text: Genres.icon(g) }), ' ' + Genres.label(g)
          ]);
        })
      ));

      var grid = wrap.querySelector('#latest-grid');
      clear(grid);
      feed.slice().sort(function (a, b) {
        return new Date(b.latestVideo.publishedAt) - new Date(a.latestVideo.publishedAt);
      }).forEach(function (c, i) {
        grid.appendChild(feedCard(c, chIndex, i === 0));
      });

      var agrid = wrap.querySelector('#artist-grid');
      clear(agrid);
      var byId = {};
      feed.forEach(function (c) { byId[c.channelId] = c; });
      // Keep direct node references: building a selector out of an upstream id
      // would let malformed data break (or widen) the query.
      var infoById = Object.create(null);
      shuffled(channels).forEach(function (ch) {
        var info = byId[ch.id];
        var card = artistCard(ch, { genre: info && info.latestVideo.genre });
        infoById[ch.id] = card.querySelector('.artist-info');
        agrid.appendChild(card);
      });

      var stats = wrap.querySelector('#home-stats');
      renderStats(stats, channels.length, null, Object.keys(genreMap).length);
      countAllTracks(channels).then(function (total) {
        renderStats(stats, channels.length, total, Object.keys(genreMap).length);
        // annotate artist cards with track counts
        channels.forEach(function (ch) {
          Api.artist(ch.id).then(function (d) {
            var host = infoById[ch.id];
            if (!host || !d.allVideoIds) return;
            var line = host.querySelector('.track-count');
            if (!line) {
              line = h('span', { class: 'muted small track-count' });
              host.insertBefore(line, host.children[1] || null);
            }
            line.textContent = I18N.t('artist.count', { n: I18N.formatNumber(d.allVideoIds.length) });
          }).catch(function () {});
        });
      });
    }).catch(function () {
      render(errorBox(function () { route(true); }));
    });
  }

  function renderStats(host, artists, tracks, genres) {
    clear(host);
    function item(value, labelKey) {
      return h('div', { class: 'stat' }, [
        h('dt', { text: value }),
        h('dd', { text: I18N.t(labelKey) })
      ]);
    }
    append(host, [
      item(I18N.formatNumber(artists), 'home.stats.artists'),
      item(tracks == null ? '…' : I18N.formatNumber(tracks), 'home.stats.tracks'),
      item(I18N.formatNumber(genres), 'home.stats.genres')
    ]);
  }

  function countAllTracks(channels) {
    return Promise.all(channels.map(function (ch) {
      return Api.artist(ch.id).then(function (d) { return (d.allVideoIds || []).length; }, function () { return 0; });
    })).then(function (counts) {
      return counts.reduce(function (a, b) { return a + b; }, 0);
    });
  }

  function viewArtists() {
    var wrap = h('div', { class: 'view' }, [
      h('section', { class: 'block' }, [
        section('artists.title', 'artists.desc'),
        h('div', { class: 'grid artist-grid', id: 'all-artists' }, [spinner()])
      ])
    ]);
    render(wrap);

    Promise.all([Api.channels(), Api.latest()]).then(function (res) {
      var channels = res[0], latest = res[1];
      var byId = {};
      liveFeed(latest).forEach(function (c) { byId[c.channelId] = c; });
      var grid = wrap.querySelector('#all-artists');
      clear(grid);
      shuffled(channels).forEach(function (ch) {
        var info = byId[ch.id];
        var card = artistCard(ch, { genre: info && info.latestVideo && info.latestVideo.genre });
        grid.appendChild(card);
        Api.artist(ch.id).then(function (d) {
          var info2 = card.querySelector('.artist-info');
          info2.insertBefore(
            h('span', { class: 'muted small track-count', text: I18N.t('artist.count', { n: I18N.formatNumber((d.allVideoIds || []).length) }) }),
            info2.children[1] || null
          );
        }).catch(function () {});
      });
    }).catch(function () { render(errorBox(function () { route(true); })); });
  }

  function viewGenres() {
    var wrap = h('div', { class: 'view' }, [
      h('section', { class: 'block' }, [
        section('genres.title', 'genres.desc'),
        h('div', { class: 'grid genre-grid', id: 'genre-grid' }, [spinner()])
      ])
    ]);
    render(wrap);

    Promise.all([Api.genres(), Api.latest()]).then(function (res) {
      var genreMap = res[0], latest = res[1];
      var counts = {};
      latest.channels.forEach(function (c) {
        var g = c.latestVideo && c.latestVideo.genre;
        if (g) counts[g] = (counts[g] || 0) + 1;
      });
      var grid = wrap.querySelector('#genre-grid');
      clear(grid);
      Object.keys(genreMap).forEach(function (key) {
        var n = counts[key] || 0;
        grid.appendChild(h('a', { class: 'card genre-card' + (n ? '' : ' empty'), href: '#/genre/' + Genres.slug(key) }, [
          h('span', { class: 'genre-icon', 'aria-hidden': 'true', text: Genres.icon(key) }),
          h('strong', { text: Genres.label(key) }),
          h('span', { class: 'muted small', text: Genres.description(key) }),
          h('span', { class: 'badge subtle', text: n ? I18N.t('artist.count', { n: I18N.formatNumber(n) }) : I18N.t('genres.unused') })
        ]));
      });
    }).catch(function () { render(errorBox(function () { route(true); })); });
  }

  function viewGenre(slug) {
    var entry = Genres.fromSlug(slug);
    var wrap = h('div', { class: 'view' });
    var head = h('section', { class: 'page-head' }, [
      h('a', { class: 'back-link', href: '#/genres', text: '← ' + I18N.t('nav.genres') }),
      h('h1', null, [
        h('span', { 'aria-hidden': 'true', text: entry ? entry.icon : '🎵' }),
        ' ' + (entry ? Genres.label(entry.key) : slug)
      ]),
      entry ? h('p', { class: 'lede', text: Genres.description(entry.key) }) : null
    ]);
    var grid = h('div', { class: 'grid video-grid' }, [spinner()]);
    append(wrap, [head, h('section', { class: 'block' }, [grid])]);
    render(wrap);

    Promise.all([Api.latest(), Api.channels()]).then(function (res) {
      var chIndex = indexChannels(res[1]);
      clear(grid);
      var matches = liveFeed(res[0]).filter(function (c) {
        return entry && c.latestVideo.genre === entry.key;
      });
      if (!matches.length) {
        grid.appendChild(h('p', { class: 'muted', text: I18N.t('genres.unused') }));
        return;
      }
      matches.forEach(function (c) { grid.appendChild(feedCard(c, chIndex, false)); });
    }).catch(function () { render(errorBox(function () { route(true); })); });
  }

  function viewArtist(channelId) {
    var wrap = h('div', { class: 'view' }, [spinner()]);
    render(wrap);

    Promise.all([Api.artist(channelId), Api.channels()]).then(function (res) {
      var data = res[0], channels = res[1];
      var known = channels.filter(function (c) { return c.id === channelId; })[0];
      var name = (known && known.name) || data.channelTitle || channelId;
      var ids = data.allVideoIds || [];
      var latestVideo = data.latestVideo;

      clear(wrap);

      var bio = latestVideo
        ? I18N.t('artist.bio', {
            name: name,
            count: I18N.formatNumber(ids.length),
            genre: Genres.label(latestVideo.genre),
            title: latestVideo.title,
            date: I18N.formatDate(latestVideo.publishedAt)
          })
        : I18N.t('artist.bioNoVideo', { name: name });

      append(wrap, [
        h('section', { class: 'artist-hero' }, [
          h('a', { class: 'back-link', href: '#/artists', text: '← ' + I18N.t('nav.artists') }),
          h('div', { class: 'artist-hero-main' }, [
            avatar(name, known && known.avatarUrl, 'avatar-lg'),
            h('div', {}, [
              h('h1', { text: name }),
              h('p', { class: 'artist-tags' }, [
                h('span', { class: 'badge subtle', text: I18N.t('artist.count', { n: I18N.formatNumber(ids.length) }) }),
                latestVideo ? genreBadge(latestVideo.genre) : null,
                data.lastUpdated ? h('span', { class: 'muted small', text: I18N.t('footer.updated', { date: I18N.formatDate(data.lastUpdated) }) }) : null
              ]),
              h('a', {
                class: 'btn primary', href: Api.channelUrl(channelId), target: '_blank', rel: 'noopener',
                text: I18N.t('artist.channel')
              })
            ])
          ])
        ]),
        h('section', { class: 'block about' }, [
          h('h2', { text: I18N.t('artist.about') }),
          h('p', { class: 'lede', text: bio })
        ])
      ]);

      if (latestVideo) {
        var latestSec = h('section', { class: 'block' }, [
          h('h2', { text: I18N.t('artist.latest') }),
          h('div', { class: 'grid video-grid single' }, [
            videoCard(latestVideo.videoId, {
              title: latestVideo.title,
              channelId: channelId,
              channelTitle: name,
              channelAvatar: known && known.avatarUrl,
              genre: latestVideo.genre,
              publishedAt: latestVideo.publishedAt,
              duration: latestVideo.durationSeconds,
              featured: true
            })
          ])
        ]);
        wrap.appendChild(latestSec);
      }

      var worksSec = h('section', { class: 'block' }, [
        h('header', { class: 'section-head' }, [
          h('h2', { text: I18N.t('artist.works') }),
          h('p', { class: 'muted', text: I18N.t('artist.worksDesc', { n: PAGE_SIZE }) })
        ])
      ]);
      wrap.appendChild(worksSec);
      mountWorkGrid(worksSec, ids, {
        channelId: channelId,
        channelTitle: name,
        channelAvatar: known && known.avatarUrl
      });

      document.title = name + ' · ' + I18N.t('site.name');
    }).catch(function () {
      clear(wrap);
      append(wrap, [
        h('section', { class: 'page-head' }, [
          h('h1', { text: I18N.t('artist.notFound') }),
          h('a', { class: 'btn ghost', href: '#/artists', text: I18N.t('nav.artists') })
        ])
      ]);
    });
  }

  function viewSearch(query) {
    var matcher = SearchEngine.compile(query);
    var wrap = h('div', { class: 'view' });

    var head = h('section', { class: 'page-head' }, [
      h('h1', { text: I18N.t('search.title', { q: matcher.raw }) }),
      h('p', { class: 'muted hint', html: I18N.t('search.hint') })
    ]);

    var artistsBlock = h('section', { class: 'block' }, [
      h('h2', { text: I18N.t('search.artists') }),
      h('div', { class: 'grid artist-grid', id: 'sr-artists' }, [spinner()])
    ]);

    var progress = h('div', { class: 'scan' }, [
      h('div', { class: 'bar' }, [h('span', { class: 'bar-fill', id: 'scan-fill' })]),
      h('p', { class: 'muted small', id: 'scan-text', text: I18N.t('common.loading') }),
      h('button', { class: 'btn tiny ghost', id: 'scan-stop', type: 'button', text: I18N.t('search.stop') })
    ]);

    var songsBlock = h('section', { class: 'block' }, [
      h('header', { class: 'section-head' }, [
        h('h2', { text: I18N.t('search.songs') }),
        h('p', { class: 'muted', id: 'song-count' })
      ]),
      progress
    ]);

    append(wrap, [head, artistsBlock, songsBlock]);
    render(wrap);

    if (matcher.empty) {
      clear(wrap.querySelector('#sr-artists'));
      progress.remove();
      return;
    }

    var chIndex = Object.create(null);
    Api.channels().then(function (channels) {
      chIndex = indexChannels(channels);
      var hits = shuffled(SearchEngine.matchArtists(matcher, channels));
      var grid = wrap.querySelector('#sr-artists');
      clear(grid);
      if (!hits.length) {
        grid.appendChild(h('p', { class: 'muted', text: I18N.t('search.empty', { q: matcher.raw }) }));
      } else {
        hits.forEach(function (ch) { grid.appendChild(artistCard(ch, { matcher: matcher })); });
      }
    });

    var countEl = wrap.querySelector('#song-count');
    var fill = wrap.querySelector('#scan-fill');
    var scanText = wrap.querySelector('#scan-text');
    var stopBtn = wrap.querySelector('#scan-stop');
    var found = 0;
    var seen = Object.create(null);

    /* Hits stream in faster than anyone can read them: buffer, and only mount
     * cards as the reader scrolls so the page never grows unbounded. */
    var masonry = createMasonry();
    var pendingHits = [];
    var shown = 0;
    var limit = 24;
    var songSentinel = h('div', { class: 'sentinel', 'aria-hidden': 'true' });
    var shownStatus = h('p', { class: 'load-status muted' });
    var moreBtn = h('button', {
      class: 'btn ghost', type: 'button', text: I18N.t('artist.loadMore'),
      onclick: function () { limit += 24; pump(); }
    });
    var moreRow = h('div', { class: 'load-more' }, [shownStatus, moreBtn]);
    append(songsBlock, [masonry.el, songSentinel, moreRow]);

    function pump() {
      while (shown < limit && pendingHits.length) {
        var item = pendingHits.shift();
        var known = chIndex[item.channelId];
        masonry.add(videoCard(item.videoId, {
          title: item.title,
          channelId: item.channelId,
          channelTitle: (known && known.name) || item.channelTitle,
          channelAvatar: known && known.avatarUrl,
          genre: item.genre,
          matcher: matcher
        }));
        shown++;
      }
      syncMore();
    }

    function syncMore() {
      if (pendingHits.length) {
        shownStatus.textContent = I18N.t('search.shown', { shown: I18N.formatNumber(shown), n: I18N.formatNumber(found) });
        if (!moreBtn.isConnected) moreRow.appendChild(moreBtn);
      } else {
        shownStatus.textContent = found ? I18N.t('search.resultCount', { n: I18N.formatNumber(found) }) : '';
        if (moreBtn.isConnected) moreBtn.remove();
      }
    }

    if ('IntersectionObserver' in global) {
      var songIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && pendingHits.length) { limit = shown + 24; pump(); }
        });
      }, { rootMargin: '120px 0px' });
      songIo.observe(songSentinel);
      teardown.push(function () { songIo.disconnect(); });
    }

    var handle = SearchEngine.scan(matcher, {
      onResult: function (item) {
        if (seen[item.videoId]) return;
        seen[item.videoId] = true;
        found++;
        countEl.textContent = I18N.t('search.resultCount', { n: I18N.formatNumber(found) });
        pendingHits.push(item);
        pump();
      },
      onProgress: function (done, total) {
        var pct = total ? Math.round((done / total) * 100) : 0;
        fill.style.width = pct + '%';
        scanText.textContent = I18N.t('search.scanning', { done: I18N.formatNumber(done), total: I18N.formatNumber(total) });
      },
      onDone: function (total) {
        fill.style.width = '100%';
        scanText.textContent = I18N.t('search.scanDone', { total: I18N.formatNumber(total) });
        stopBtn.remove();
        if (!found) {
          songsBlock.insertBefore(h('div', { class: 'empty-state' }, [
            h('p', { text: I18N.t('search.empty', { q: matcher.raw }) }),
            h('p', { class: 'muted small', text: I18N.t('search.emptyHint', { example: '*' + matcher.raw.slice(0, 2) + '*' }) })
          ]), masonry.el);
        }
      },
      onError: function () {
        progress.replaceWith(errorBox(function () { route(true); }));
      }
    });

    stopBtn.addEventListener('click', function () {
      handle.abort();
      stopBtn.remove();
      scanText.textContent = I18N.t('search.resultCount', { n: I18N.formatNumber(found) });
    });
    teardown.push(function () { handle.abort(); });

    document.title = I18N.t('search.title', { q: matcher.raw }) + ' · ' + I18N.t('site.name');
  }

  function viewNotFound() {
    render(h('div', { class: 'view' }, [
      h('section', { class: 'page-head' }, [
        h('h1', { text: I18N.t('notfound.title') }),
        h('p', { class: 'lede', text: I18N.t('notfound.desc') }),
        h('a', { class: 'btn primary', href: '#/', text: I18N.t('common.backHome') })
      ])
    ]));
  }

  /* ---------------- shell ---------------- */

  function render(node) {
    clear(main);
    main.appendChild(node);
  }

  function renderFooterUpdated(iso) {
    var el = document.getElementById('footer-updated');
    if (el && iso) el.textContent = I18N.t('footer.updated', { date: I18N.formatDate(iso, true) });
  }

  function runTeardown() {
    teardown.splice(0).forEach(function (fn) { try { fn(); } catch (e) { /* noop */ } });
  }

  function parseHash() {
    var raw = location.hash.replace(/^#/, '') || '/';
    var qIndex = raw.indexOf('?');
    var path = qIndex === -1 ? raw : raw.slice(0, qIndex);
    var query = {};
    if (qIndex !== -1) {
      raw.slice(qIndex + 1).split('&').forEach(function (pair) {
        if (!pair) return;
        var kv = pair.split('=');
        query[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
      });
    }
    return { path: path.replace(/\/+$/, '') || '/', query: query, raw: raw };
  }

  function markActiveNav(path) {
    var map = { '/': 'home', '/artists': 'artists', '/genres': 'genres' };
    var active = map[path] || (path.indexOf('/genre') === 0 ? 'genres' : path.indexOf('/artist') === 0 ? 'artists' : null);
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (a) {
      if (a.getAttribute('data-nav') === active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function route(force) {
    var r = parseHash();
    if (!force && currentRoute === r.raw) return;
    currentRoute = r.raw;
    runTeardown();
    markActiveNav(r.path);
    document.title = I18N.t('site.title');
    closeNav();

    var parts = r.path.split('/').filter(Boolean);
    if (parts.length === 0) return viewHome();
    if (parts[0] === 'artists') return viewArtists();
    if (parts[0] === 'genres') return viewGenres();
    if (parts[0] === 'genre' && parts[1]) return viewGenre(parts[1]);
    if (parts[0] === 'artist' && parts[1]) return viewArtist(parts[1]);
    if (parts[0] === 'search') {
      var input = document.getElementById('search-input');
      if (input) input.value = r.query.q || '';
      return viewSearch(r.query.q || '');
    }
    return viewNotFound();
  }

  function closeNav() {
    document.body.classList.remove('nav-open');
    var t = document.querySelector('.nav-toggle');
    if (t) t.setAttribute('aria-expanded', 'false');
  }

  function bindShell() {
    document.getElementById('search-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = document.getElementById('search-input').value.trim();
      if (!q) return;
      location.hash = '#/search?q=' + encodeURIComponent(q);
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (btn) {
      btn.addEventListener('click', function () { I18N.setLang(btn.getAttribute('data-lang')); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-set]'), function (btn) {
      btn.addEventListener('click', function () { global.Theme.set(btn.getAttribute('data-theme-set')); });
    });
    global.Theme.onChange(syncThemeButtons);

    var toggle = document.querySelector('.nav-toggle');
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    global.addEventListener('hashchange', function () { route(); window.scrollTo(0, 0); });

    I18N.onChange(function () {
      syncLangButtons();
      route(true);
      Api.latest().then(function (l) { renderFooterUpdated(l.updatedAt); }).catch(function () {});
    });
  }

  function syncLangButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (btn) {
      var on = btn.getAttribute('data-lang') === I18N.lang;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function syncThemeButtons() {
    var theme = global.Theme.current;
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-set]'), function (btn) {
      var on = btn.getAttribute('data-theme-set') === theme;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  I18N.applyStatic(document);
  syncLangButtons();
  syncThemeButtons();
  bindShell();
  route(true);
})(window);
