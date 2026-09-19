/* A-Music · i18n core
 * Copyright (C) 2026 Yueyu Hoshizora · SPDX-License-Identifier: AGPL-3.0-or-later
 * Locales: zh (繁體中文) / en (English) / ja (日本語)
 * Everything user-visible goes through I18N.t(key, vars).
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'amusic:lang';
  var DEFAULT_LANG = 'zh';

  var META = {
    zh: { label: '中文', htmlLang: 'zh-Hant', intl: 'zh-Hant-TW', ogLocale: 'zh_Hant' },
    en: { label: 'EN', htmlLang: 'en', intl: 'en', ogLocale: 'en_US' },
    ja: { label: '日本語', htmlLang: 'ja', intl: 'ja', ogLocale: 'ja_JP' }
  };

  var DICT = {
    zh: {
      'site.name': '聽見音樂',
      'site.title': '聽見音樂 A-Music｜獨立音樂人作品推廣',
      'site.desc': '彙整並推廣華語獨立音樂人的 YouTube 作品，依曲風探索，隨時發現新聲音。',
      'site.tagline': '聽見每一首值得被聽見的作品',
      'a11y.skip': '跳至主要內容',

      'nav.home': '首頁',
      'nav.artists': '音樂人',
      'nav.genres': '曲風',
      'nav.menu': '開啟選單',
      'theme.label': '佈景主題',
      'theme.light': '亮色佈景',
      'theme.dark': '暗色佈景',
      'lang.label': '切換語言',

      'search.placeholder': '搜尋藝人或歌曲，支援 * 與 ?',
      'search.label': '搜尋藝人或歌曲',
      'search.submit': '開始搜尋',
      'search.hint': '萬用字元：<code>*</code> 代表任意字串、<code>?</code> 代表單一字元。例如 <code>星*</code>、<code>?ove</code>。',
      'search.title': '「{q}」的搜尋結果',
      'search.artists': '音樂人',
      'search.songs': '歌曲',
      'search.empty': '找不到符合「{q}」的結果。',
      'search.emptyHint': '試試較短的關鍵字，或加上萬用字元，例如 {example}。',
      'search.scanning': '正在深度掃描全部曲目… {done}/{total}',
      'search.scanDone': '已掃描 {total} 首歌曲（結果已快取，下次搜尋更快）。',
      'search.stop': '停止掃描',
      'search.resultCount': '共 {n} 筆結果',
      'search.shown': '已顯示 {shown} / {n} 筆結果',

      'home.hero.title': '聽見音樂 A-Music',
      'home.hero.desc': '彙整並推廣華語獨立音樂人的 YouTube 作品，依曲風探索，隨時發現新聲音。',
      'home.hero.cta': '探索音樂人',
      'home.latest': '最新音樂',
      'home.latest.desc': '各音樂人最新發表的作品',
      'home.artists': '合作音樂人',
      'home.artists.desc': '點擊進入音樂人簡介頁，瀏覽全部作品',
      'home.genres': '曲風分類',
      'home.genres.desc': '依照曲風探索作品',
      'home.viewAll': '查看全部',
      'home.stats.artists': '位音樂人',
      'home.stats.tracks': '首作品',
      'home.stats.genres': '種曲風',

      'genre.all': '全部曲風',
      'genres.title': '曲風分類',
      'genres.desc': '曲風標籤由 TrackRadar 依每首作品自動判別。點進分類後會上架該標籤的全部歌曲。',
      'genres.unused': '目前尚無作品',

      'artists.title': '音樂人',
      'artists.desc': '所有已收錄的音樂人',
      'artist.works': '全部作品',
      'artist.worksDesc': '滾動即自動載入更多，每次載入 {n} 首',
      'artist.latest': '最新作品',
      'artist.about': '音樂人簡介',
      'artist.bio': '{name} 目前在 A-Music 收錄了 {count} 部作品，主要曲風為「{genre}」。',
      'artist.bioNoVideo': '{name} 目前尚未有可顯示的作品。',
      'artist.channel': '前往 YouTube 頻道',
      'artist.count': '{n} 首作品',
      'artist.loadMore': '載入更多',
      'artist.loadingMore': '載入中…',
      'artist.allLoaded': '已載入全部 {n} 首作品',
      'artist.back': '返回',
      'artist.notFound': '找不到這位音樂人',
      'artist.worksEmpty': '目前沒有可顯示的作品清單。',

      'video.watch': '在 YouTube 觀看',
      'video.unavailable': '此影片目前無法取得資訊',
      'video.published': '發表於 {date}',

      'common.loading': '載入中…',
      'common.error': '資料載入失敗，請稍後再試。',
      'common.retry': '重新載入',
      'common.backHome': '回到首頁',
      'common.duration': '片長',

      'footer.note': '本站僅彙整與推廣公開的 YouTube 作品，所有版權歸原創作者所有。',
      'footer.source': '資料來源',
      'footer.updated': '資料更新於 {date}',
      'footer.code': '原始碼',
      'footer.license': '授權：AGPL-3.0-or-later',
      'footer.privacy': '隱私權說明',
      'footer.sitemap': '網站地圖',

      'notfound.title': '找不到頁面',
      'notfound.desc': '這個網址不存在，或作品已被移除。',

      'seo.artist.desc': '{name} 在 YouTube 的 {n} 首作品，依曲風整理並持續更新。',
      'seo.search.desc': '在聽見音樂搜尋獨立音樂人與歌曲，支援 * 與 ? 萬用字元。',
      'seo.video.desc': '{name} 的作品《{title}》，曲風：{genre}。在聽見音樂 A-Music 線上收聽。',
      'seo.video.desc.plain': '{name} 的作品《{title}》。在聽見音樂 A-Music 線上收聽。'
    },

    en: {
      'site.name': 'A-Music',
      'site.title': 'A-Music｜Independent Artist Showcase',
      'site.desc': 'A curated showcase of independent artists on YouTube. Browse by genre and discover new sounds.',
      'site.tagline': 'Hear every track worth hearing',
      'a11y.skip': 'Skip to main content',

      'nav.home': 'Home',
      'nav.artists': 'Artists',
      'nav.genres': 'Genres',
      'nav.menu': 'Open menu',
      'lang.label': 'Switch language',

      'theme.label': 'Theme',
      'theme.light': 'Light theme',
      'theme.dark': 'Dark theme',
      'search.placeholder': 'Search artists or songs — * and ? supported',
      'search.label': 'Search artists or songs',
      'search.submit': 'Search',
      'search.hint': 'Wildcards: <code>*</code> matches any text, <code>?</code> matches one character. e.g. <code>love*</code>, <code>?ight</code>.',
      'search.title': 'Results for “{q}”',
      'search.artists': 'Artists',
      'search.songs': 'Songs',
      'search.empty': 'No results for “{q}”.',
      'search.emptyHint': 'Try a shorter keyword or add a wildcard, e.g. {example}.',
      'search.scanning': 'Deep-scanning the full catalogue… {done}/{total}',
      'search.scanDone': 'Scanned {total} tracks (cached — next search is instant).',
      'search.stop': 'Stop scanning',
      'search.resultCount': '{n} results',
      'search.shown': 'Showing {shown} of {n} results',

      'home.hero.title': 'A-Music · 聽見音樂',
      'home.hero.desc': 'A curated showcase of independent artists on YouTube. Browse by genre and discover new sounds.',
      'home.hero.cta': 'Explore artists',
      'home.latest': 'Latest releases',
      'home.latest.desc': 'The newest upload from every artist',
      'home.artists': 'Featured artists',
      'home.artists.desc': 'Open an artist page to browse their full catalogue',
      'home.genres': 'Genres',
      'home.genres.desc': 'Explore music by genre',
      'home.viewAll': 'View all',
      'home.stats.artists': 'artists',
      'home.stats.tracks': 'tracks',
      'home.stats.genres': 'genres',

      'genre.all': 'All genres',
      'genres.title': 'Genres',
      'genres.desc': 'Genre tags are classified automatically by TrackRadar for each track. Open a genre to list every matching song.',
      'genres.unused': 'No releases yet',

      'artists.title': 'Artists',
      'artists.desc': 'Every artist featured on A-Music',
      'artist.works': 'All works',
      'artist.worksDesc': 'Scroll to load more — {n} tracks per batch',
      'artist.latest': 'Latest release',
      'artist.about': 'About the artist',
      'artist.bio': '{name} has {count} works on A-Music, mainly in the “{genre}” genre.',
      'artist.bioNoVideo': '{name} has no published works available right now.',
      'artist.channel': 'Open YouTube channel',
      'artist.count': '{n} tracks',
      'artist.loadMore': 'Load more',
      'artist.loadingMore': 'Loading…',
      'artist.allLoaded': 'All {n} tracks loaded',
      'artist.back': 'Back',
      'artist.notFound': 'Artist not found',
      'artist.worksEmpty': 'No track listing is available right now.',

      'video.watch': 'Watch on YouTube',
      'video.unavailable': 'Details unavailable for this video',
      'video.published': 'Published {date}',

      'common.loading': 'Loading…',
      'common.error': 'Failed to load data. Please try again later.',
      'common.retry': 'Retry',
      'common.backHome': 'Back to home',
      'common.duration': 'Duration',

      'footer.note': 'A-Music only aggregates and promotes publicly available YouTube works. All rights belong to their creators.',
      'footer.source': 'Data source',
      'footer.updated': 'Data updated {date}',
      'footer.code': 'Source code',
      'footer.license': 'License: AGPL-3.0-or-later',
      'footer.privacy': 'Privacy policy',
      'footer.sitemap': 'Sitemap',

      'notfound.title': 'Page not found',
      'notfound.desc': 'This address does not exist, or the content has been removed.',

      'seo.artist.desc': '{n} tracks by {name} on YouTube, sorted by genre and kept up to date.',
      'seo.search.desc': 'Search independent artists and songs on A-Music, with * and ? wildcards.',
      'seo.video.desc': '“{title}” by {name} — {genre}. Listen on A-Music.',
      'seo.video.desc.plain': '“{title}” by {name}. Listen on A-Music.'
    },

    ja: {
      'site.name': 'A-Music',
      'site.title': 'A-Music｜インディーアーティスト作品ガイド',
      'site.desc': '華語圏のインディーアーティストによる YouTube 作品を集めて紹介。ジャンルから新しい音に出会えます。',
      'site.tagline': '聴かれるべき一曲を、あなたに',
      'a11y.skip': 'メインコンテンツへスキップ',

      'nav.home': 'ホーム',
      'nav.artists': 'アーティスト',
      'nav.genres': 'ジャンル',
      'nav.menu': 'メニューを開く',
      'lang.label': '言語切り替え',

      'search.placeholder': 'アーティスト・楽曲を検索（* と ? が使えます）',
      'search.label': 'アーティスト・楽曲を検索',
      'theme.label': 'テーマ',
      'theme.light': 'ライトテーマ',
      'theme.dark': 'ダークテーマ',
      'search.submit': '検索',
      'search.hint': 'ワイルドカード：<code>*</code> は任意の文字列、<code>?</code> は1文字。例：<code>星*</code>、<code>?ove</code>。',
      'search.title': '「{q}」の検索結果',
      'search.artists': 'アーティスト',
      'search.songs': '楽曲',
      'search.empty': '「{q}」に一致する結果はありません。',
      'search.emptyHint': 'キーワードを短くするか、{example} のようにワイルドカードをお試しください。',
      'search.scanning': '全楽曲をディープスキャン中… {done}/{total}',
      'search.scanDone': '{total} 曲をスキャンしました（キャッシュ済み・次回は高速）。',
      'search.stop': 'スキャンを停止',
      'search.resultCount': '全 {n} 件',
      'search.shown': '{n} 件中 {shown} 件を表示',

      'home.hero.title': 'A-Music・聴見音楽',
      'home.hero.desc': '華語圏のインディーアーティストによる YouTube 作品を集めて紹介。ジャンルから新しい音に出会えます。',
      'home.hero.cta': 'アーティストを見る',
      'home.latest': '最新リリース',
      'home.latest.desc': '各アーティストの最新作',
      'home.artists': '参加アーティスト',
      'home.artists.desc': 'アーティストページで全作品を閲覧できます',
      'home.genres': 'ジャンル',
      'home.genres.desc': 'ジャンルから作品を探す',
      'home.viewAll': 'すべて見る',
      'home.stats.artists': 'アーティスト',
      'home.stats.tracks': '作品',
      'home.stats.genres': 'ジャンル',

      'genre.all': 'すべてのジャンル',
      'genres.title': 'ジャンル一覧',
      'genres.desc': 'ジャンルタグは TrackRadar が曲ごとに自動判定します。開くとそのタグの全曲を掲載します。',
      'genres.unused': '作品はまだありません',

      'artists.title': 'アーティスト',
      'artists.desc': 'A-Music に収録されている全アーティスト',
      'artist.works': '全作品',
      'artist.worksDesc': 'スクロールで自動読み込み（{n} 件ずつ）',
      'artist.latest': '最新作',
      'artist.about': 'アーティスト紹介',
      'artist.bio': '{name} は A-Music に {count} 作品を収録しており、主なジャンルは「{genre}」です。',
      'artist.bioNoVideo': '{name} の公開作品は現在ありません。',
      'artist.channel': 'YouTube チャンネルを開く',
      'artist.count': '{n} 作品',
      'artist.loadMore': 'もっと読み込む',
      'artist.loadingMore': '読み込み中…',
      'artist.allLoaded': '全 {n} 作品を読み込みました',
      'artist.back': '戻る',
      'artist.notFound': 'アーティストが見つかりません',
      'artist.worksEmpty': '表示できる作品リストがありません。',

      'video.watch': 'YouTube で見る',
      'video.unavailable': 'この動画の情報は取得できません',
      'video.published': '{date} 公開',

      'common.loading': '読み込み中…',
      'common.error': 'データの読み込みに失敗しました。しばらくしてからお試しください。',
      'common.retry': '再読み込み',
      'common.backHome': 'ホームへ戻る',
      'common.duration': '再生時間',

      'footer.note': '当サイトは公開されている YouTube 作品の紹介のみを行います。著作権はすべて原作者に帰属します。',
      'footer.source': 'データ提供',
      'footer.updated': 'データ更新日 {date}',
      'footer.code': 'ソースコード',
      'footer.license': 'ライセンス：AGPL-3.0-or-later',
      'footer.privacy': 'プライバシー',
      'footer.sitemap': 'サイトマップ',

      'notfound.title': 'ページが見つかりません',
      'notfound.desc': 'この URL は存在しないか、コンテンツが削除されています。',

      'seo.artist.desc': '{name} の YouTube 作品 {n} 曲。ジャンル別に整理し、随時更新しています。',
      'seo.search.desc': 'A-Music でインディーアーティストと楽曲を検索。* と ? のワイルドカードに対応。',
      'seo.video.desc': '{name} の楽曲「{title}」／{genre}。A-Music で視聴できます。',
      'seo.video.desc.plain': '{name} の楽曲「{title}」。A-Music で視聴できます。'
    }
  };

  var listeners = [];
  var current = DEFAULT_LANG;
  var pageMeta = null;        // per-route override; the router clears it

  var SITE_ORIGIN = 'https://a-music.app';

  /* Routes are real paths; the language is a query parameter on top of them:
   * `/genre/pop/?lang=en`. That keeps one crawlable URL per route per locale,
   * which is what sitemap.xml and the hreflang links point at. */
  function urlLang() {
    var m = /[?&]lang=([a-z-]+)/i.exec(global.location.search);
    if (!m) return null;
    var l = m[1].toLowerCase();
    return DICT[l] ? l : null;
  }

  /* Trailing slash is the canonical form: GitHub Pages redirects `/genres`
   * to `/genres/`, and canonicals must not point at a redirect. */
  function routePath() {
    var p = global.location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '');
    return p + '/';
  }

  function urlFor(path, lang) {
    return SITE_ORIGIN + path + (lang && lang !== DEFAULT_LANG ? '?lang=' + lang : '');
  }

  /* Canonical follows the URL, not the detected language: Googlebot requests
   * `/` with an en Accept-Language, and pointing that at `/?lang=en` would
   * hand the apex's ranking to a variant. Only an explicit ?lang= counts. */
  function canonicalUrl() {
    return urlFor(routePath(), urlLang());
  }

  /* The shells ship hreflang for their own route; in-app navigation has to
   * repoint them or every route would advertise the landing page's variants. */
  function syncAlternates() {
    var path = routePath();
    var map = { 'zh-hant': 'zh', en: 'en', ja: 'ja', 'x-default': DEFAULT_LANG };
    var links = document.querySelectorAll('link[rel="alternate"][hreflang]');
    Array.prototype.forEach.call(links, function (link) {
      var key = (link.getAttribute('hreflang') || '').toLowerCase();
      if (map[key]) link.setAttribute('href', urlFor(path, map[key]));
    });
  }

  function syncUrlLang(lang) {
    if (!global.history || !global.history.replaceState) return;
    var parts = global.location.search.replace(/^\?/, '').split('&').filter(function (p) {
      return p && p.split('=')[0] !== 'lang';
    });
    if (lang !== DEFAULT_LANG) parts.push('lang=' + lang);
    var qs = parts.length ? '?' + parts.join('&') : '';
    try {
      global.history.replaceState(null, '', global.location.pathname + qs + global.location.hash);
    } catch (e) { /* file:// and sandboxed frames reject replaceState */ }
  }

  /* Search-result and not-found views are thin/duplicate by nature: keep them
   * out of the index if a crawler ever renders one, and drop the tag again on
   * the way back to a real page. */
  function setRobots(noindex) {
    var m = document.querySelector('meta[name="robots"]');
    if (!noindex) {
      if (m) m.parentNode.removeChild(m);
      return;
    }
    if (!m) {
      m = document.createElement('meta');
      m.setAttribute('name', 'robots');
      document.head.appendChild(m);
    }
    m.setAttribute('content', 'noindex, follow');
  }

  function detect() {
    var fromUrl = urlLang();
    if (fromUrl) return fromUrl;
    var stored = null;
    try { stored = global.localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (stored && DICT[stored]) return stored;
    var navLangs = (global.navigator.languages || [global.navigator.language || '']).map(String);
    for (var i = 0; i < navLangs.length; i++) {
      var l = navLangs[i].toLowerCase();
      if (l.indexOf('ja') === 0) return 'ja';
      if (l.indexOf('zh') === 0) return 'zh';
      if (l.indexOf('en') === 0) return 'en';
    }
    return DEFAULT_LANG;
  }

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m;
    });
  }

  var I18N = {
    languages: ['zh', 'en', 'ja'],
    meta: META,

    get lang() { return current; },

    t: function (key, vars) {
      var table = DICT[current] || DICT[DEFAULT_LANG];
      var val = table[key];
      if (val == null) val = DICT[DEFAULT_LANG][key];
      if (val == null) return key;
      return interpolate(val, vars);
    },

    has: function (key) { return !!DICT[current][key]; },

    intlLocale: function () { return META[current].intl; },

    /* app.js carries an explicit ?lang= across in-app navigation. */
    urlLang: urlLang,

    setLang: function (lang) {
      if (!DICT[lang] || lang === current) return;
      current = lang;
      try { global.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
      document.documentElement.lang = META[lang].htmlLang;
      syncUrlLang(lang);
      I18N.applyStatic(document);
      for (var i = 0; i < listeners.length; i++) listeners[i](lang);
    },

    onChange: function (fn) { listeners.push(fn); },

    /* Translate declarative markup: data-i18n / data-i18n-ph / data-i18n-aria / data-i18n-html */
    applyStatic: function (root) {
      var scope = root || document;
      each(scope.querySelectorAll('[data-i18n]'), function (el) {
        el.textContent = I18N.t(el.getAttribute('data-i18n'));
      });
      each(scope.querySelectorAll('[data-i18n-html]'), function (el) {
        el.innerHTML = I18N.t(el.getAttribute('data-i18n-html'));
      });
      each(scope.querySelectorAll('[data-i18n-ph]'), function (el) {
        el.setAttribute('placeholder', I18N.t(el.getAttribute('data-i18n-ph')));
      });
      each(scope.querySelectorAll('[data-i18n-aria]'), function (el) {
        el.setAttribute('aria-label', I18N.t(el.getAttribute('data-i18n-aria')));
      });
      if (scope === document) I18N.syncSEO();
    },

    /* Per-route override, set by each view in app.js. null = site defaults. */
    setPageMeta: function (meta) {
      pageMeta = meta && (meta.title || meta.desc || meta.noindex) ? meta : null;
      I18N.syncSEO();
    },

    /* Sync SEO / Open Graph / Twitter meta tags for current route + language. */
    syncSEO: function () {
      var title = pageMeta && pageMeta.title
        ? pageMeta.title + ' · ' + I18N.t('site.name')
        : I18N.t('site.title');
      var desc = (pageMeta && pageMeta.desc) || I18N.t('site.desc');
      setRobots(pageMeta && pageMeta.noindex);
      document.title = title;
      document.documentElement.lang = META[current].htmlLang;
      var m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute('content', desc);
      m = document.querySelector('meta[property="og:title"]');
      if (m) m.setAttribute('content', title);
      m = document.querySelector('meta[property="og:description"]');
      if (m) m.setAttribute('content', desc);
      m = document.querySelector('meta[property="og:locale"]');
      if (m) m.setAttribute('content', META[current].ogLocale);
      m = document.querySelector('meta[name="twitter:title"]');
      if (m) m.setAttribute('content', title);
      m = document.querySelector('meta[name="twitter:description"]');
      if (m) m.setAttribute('content', desc);
      var url = canonicalUrl();
      var link = document.querySelector('link[rel="canonical"]');
      if (link) link.setAttribute('href', url);
      m = document.querySelector('meta[property="og:url"]');
      if (m) m.setAttribute('content', url);
      syncAlternates();
    },

    /* ---- locale-aware formatters ---- */
    formatDate: function (iso, withTime) {
      if (!iso) return '';
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      var opts = { year: 'numeric', month: 'short', day: 'numeric' };
      if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
      try {
        return new Intl.DateTimeFormat(I18N.intlLocale(), opts).format(d);
      } catch (e) {
        return d.toISOString().slice(0, 10);
      }
    },

    formatNumber: function (n) {
      try { return new Intl.NumberFormat(I18N.intlLocale()).format(n); }
      catch (e) { return String(n); }
    },

    formatDuration: function (seconds) {
      if (!seconds && seconds !== 0) return '';
      var s = Math.max(0, Math.round(seconds));
      var h = Math.floor(s / 3600);
      var m = Math.floor((s % 3600) / 60);
      var sec = s % 60;
      var pad = function (v) { return v < 10 ? '0' + v : String(v); };
      return h > 0 ? h + ':' + pad(m) + ':' + pad(sec) : m + ':' + pad(sec);
    }
  };

  function each(nodeList, fn) {
    Array.prototype.forEach.call(nodeList, fn);
  }

  current = detect();
  document.documentElement.lang = META[current].htmlLang;

  global.I18N = I18N;
})(window);
