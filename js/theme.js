/* A-Music · theme
 * Copyright (C) 2026 Yueyu Hoshizora · SPDX-License-Identifier: AGPL-3.0-or-later
 * Two themes: light / dark. The stored choice wins; otherwise the OS preference
 * is followed live (until the visitor picks one explicitly).
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'amusic:theme';
  var META_COLOR = { dark: '#0b0b12', light: '#f6f6fb' };
  var listeners = [];
  var explicit = null;

  var mql = global.matchMedia ? global.matchMedia('(prefers-color-scheme: light)') : null;

  function systemTheme() { return mql && mql.matches ? 'light' : 'dark'; }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', META_COLOR[theme]);
    for (var i = 0; i < listeners.length; i++) listeners[i](theme);
  }

  try { explicit = global.localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
  if (explicit !== 'light' && explicit !== 'dark') explicit = null;

  apply(explicit || systemTheme());

  if (mql && mql.addEventListener) {
    mql.addEventListener('change', function () { if (!explicit) apply(systemTheme()); });
  }

  global.Theme = {
    get current() { return document.documentElement.getAttribute('data-theme') || 'dark'; },
    get isExplicit() { return !!explicit; },

    set: function (theme) {
      if (theme !== 'light' && theme !== 'dark') return;
      explicit = theme;
      try { global.localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
      apply(theme);
    },

    toggle: function () { this.set(this.current === 'dark' ? 'light' : 'dark'); },

    onChange: function (fn) { listeners.push(fn); }
  };
})(window);
