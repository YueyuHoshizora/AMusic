/* A-Music · genre localisation
 * Copyright (C) 2026 Yueyu Hoshizora · SPDX-License-Identifier: AGPL-3.0-or-later
 * Keys match TrackRadar genres.json (and `video.genre`) when the genre exists
 * upstream. Extra local entries (e.g. Vocaloid) still appear in the catalogue;
 * they stay unused until the feed emits the same key.
 */
(function (global) {
  'use strict';

  var TABLE = {
    '流行 Pop': {
      slug: 'pop', icon: '🎵',
      zh: '流行 Pop', en: 'Pop', ja: 'ポップス',
      dzh: '主流流行歌曲，旋律導向、編曲精緻。',
      den: 'Mainstream pop — melody-driven songs with polished production.',
      dja: 'メロディ重視で洗練されたアレンジのメインストリーム・ポップ。'
    },
    '抒情/情歌 Ballad': {
      slug: 'ballad', icon: '💗',
      zh: '抒情／情歌 Ballad', en: 'Ballad', ja: 'バラード',
      dzh: '慢節奏、以情感與歌詞敘事為主的抒情歌。',
      den: 'Slow, emotional songs built around lyrics and storytelling.',
      dja: 'スローテンポで、歌詞と感情の物語を中心に据えたバラード。'
    },
    '搖滾 Rock': {
      slug: 'rock', icon: '🎸',
      zh: '搖滾 Rock', en: 'Rock', ja: 'ロック',
      dzh: '以電吉他、鼓組為主的搖滾編曲，節奏強烈。',
      den: 'Guitar- and drum-driven arrangements with a strong beat.',
      dja: 'エレキギターとドラムを軸にした、力強いビートのロック。'
    },
    '電子 Electronic': {
      slug: 'electronic', icon: '🎛️',
      zh: '電子 Electronic', en: 'Electronic', ja: 'エレクトロニック',
      dzh: '以電子合成器、節拍機、DJ 混音為主的電子音樂／EDM。',
      den: 'Synth, drum machine and DJ-mix driven electronic music / EDM.',
      dja: 'シンセやドラムマシン、DJミックス中心のエレクトロ／EDM。'
    },
    '嘻哈/饒舌 Hip-Hop/Rap': {
      slug: 'hiphop', icon: '🎤',
      zh: '嘻哈／饒舌 Hip-Hop', en: 'Hip-Hop / Rap', ja: 'ヒップホップ／ラップ',
      dzh: '以饒舌、節奏口白為主的嘻哈曲風。',
      den: 'Rap and rhythmic spoken delivery at the centre of the track.',
      dja: 'ラップやリズミカルな語りを主体としたヒップホップ。'
    },
    'R&B/Soul': {
      slug: 'rnb', icon: '🎙️',
      zh: 'R&B／靈魂樂', en: 'R&B / Soul', ja: 'R&B／ソウル',
      dzh: '節奏藍調與靈魂樂，強調律動與轉音唱腔。',
      den: 'Rhythm & blues and soul — groove and vocal runs to the fore.',
      dja: 'グルーヴとフェイクを活かしたリズム＆ブルース／ソウル。'
    },
    '民謠/Acoustic': {
      slug: 'acoustic', icon: '🪕',
      zh: '民謠／不插電 Acoustic', en: 'Folk / Acoustic', ja: 'フォーク／アコースティック',
      dzh: '木吉他或不插電為主的民謠、抒情小品。',
      den: 'Acoustic-guitar led folk and unplugged pieces.',
      dja: 'アコギ中心のフォークやアンプラグドの小品。'
    },
    '爵士 Jazz': {
      slug: 'jazz', icon: '🎷',
      zh: '爵士 Jazz', en: 'Jazz', ja: 'ジャズ',
      dzh: '爵士編曲，含即興、搖擺節奏或爵士和聲。',
      den: 'Jazz arrangements with improvisation, swing or jazz harmony.',
      dja: '即興やスウィング、ジャズ・ハーモニーを含むジャズ。'
    },
    '古典 Classical': {
      slug: 'classical', icon: '🎻',
      zh: '古典 Classical', en: 'Classical', ja: 'クラシック',
      dzh: '古典音樂、管弦樂、演奏會或聲樂作品。',
      den: 'Classical music: orchestral, recital or art-song works.',
      dja: 'オーケストラや演奏会、声楽などのクラシック作品。'
    },
    '古風/國風 Chinese Style': {
      slug: 'chinese-style', icon: '🏮',
      zh: '古風／國風', en: 'Chinese Style', ja: '古風／中華風',
      dzh: '融合傳統樂器、五聲音階或古典詩詞意境的華語創作。',
      den: 'Mandarin works blending traditional instruments, pentatonic scales and classical poetry.',
      dja: '民族楽器や五音音階、漢詩の情景を織り込んだ中華圏の楽曲。'
    },
    '動漫/ACG': {
      slug: 'acg', icon: '🌸',
      zh: '動漫／ACG', en: 'Anime / ACG', ja: 'アニメ／ACG',
      dzh: '動畫、漫畫、遊戲相關的主題曲與片頭片尾曲。',
      den: 'Theme, opening and ending songs tied to anime, manga and games.',
      dja: 'アニメ・漫画・ゲーム関連の主題歌やOP／ED。'
    },
    'Vocaloid': {
      slug: 'vocaloid', icon: '🎤',
      zh: 'Vocaloid', en: 'Vocaloid', ja: 'ボーカロイド',
      dzh: '以 Vocaloid 等虛擬歌手引擎合成人聲的創作歌曲。',
      den: 'Original songs written for Vocaloid and other virtual-singer engines.',
      dja: '初音ミクなどボーカロイド／仮想歌手エンジンで歌声を合成した楽曲。'
    },
    '遊戲音樂 Game Music': {
      slug: 'game', icon: '🎮',
      zh: '遊戲音樂 Game Music', en: 'Game Music', ja: 'ゲーム音楽',
      dzh: '電玩原聲帶、遊戲配樂或遊戲相關創作。',
      den: 'Game soundtracks, score and game-related original music.',
      dja: 'ゲームのサウンドトラックやBGM、関連楽曲。'
    },
    '翻唱 Cover': {
      slug: 'cover', icon: '🎧',
      zh: '翻唱 Cover', en: 'Cover', ja: 'カバー',
      dzh: '翻唱他人既有歌曲，非原創作品。',
      den: 'Covers of existing songs rather than original works.',
      dja: '既存曲のカバー（オリジナルではない作品）。'
    },
    '純音樂/器樂 Instrumental': {
      slug: 'instrumental', icon: '🎹',
      zh: '純音樂／器樂', en: 'Instrumental', ja: 'インストゥルメンタル',
      dzh: '無人聲的純演奏、純音樂或器樂作品。',
      den: 'Instrumental works with no vocals.',
      dja: 'ボーカルのない純演奏・インスト作品。'
    },
    '獨立音樂 Indie': {
      slug: 'indie', icon: '🌙',
      zh: '獨立音樂 Indie', en: 'Indie', ja: 'インディー',
      dzh: '獨立製作、非主流商業風格的創作歌曲。',
      den: 'Self-produced songs outside mainstream commercial styles.',
      dja: '自主制作でメインストリームに寄らないオリジナル楽曲。'
    },
    '金屬 Metal': {
      slug: 'metal', icon: '🤘',
      zh: '金屬 Metal', en: 'Metal', ja: 'メタル',
      dzh: '重金屬、金屬核等重型搖滾曲風。',
      den: 'Heavy metal, metalcore and other heavy rock styles.',
      dja: 'ヘヴィメタルやメタルコアなどのヘヴィ系ロック。'
    },
    '拉丁 Latin': {
      slug: 'latin', icon: '💃',
      zh: '拉丁 Latin', en: 'Latin', ja: 'ラテン',
      dzh: '拉丁音樂、雷鬼動、西語系曲風。',
      den: 'Latin music, reggaeton and Spanish-language styles.',
      dja: 'ラテン音楽やレゲトン、スペイン語圏のサウンド。'
    },
    '鄉村 Country': {
      slug: 'country', icon: '🤠',
      zh: '鄉村 Country', en: 'Country', ja: 'カントリー',
      dzh: '美式鄉村音樂曲風。',
      den: 'American country music.',
      dja: 'アメリカン・カントリー。'
    },
    '其他/無法判斷 Other': {
      slug: 'other', icon: '✨',
      zh: '其他／未分類', en: 'Other', ja: 'その他',
      dzh: '不屬於上述任何分類，或無法從標題判斷曲風。',
      den: 'Does not fit the categories above, or cannot be determined.',
      dja: '上記に当てはまらない、または判別できない作品。'
    }
  };

  var BY_SLUG = {};
  Object.keys(TABLE).forEach(function (key) {
    TABLE[key].key = key;
    BY_SLUG[TABLE[key].slug] = TABLE[key];
  });

  global.Genres = {
    table: TABLE,

    entry: function (genreKey) {
      return TABLE[genreKey] || null;
    },

    fromSlug: function (slug) {
      return BY_SLUG[slug] || null;
    },

    slug: function (genreKey) {
      var e = TABLE[genreKey];
      return e ? e.slug : encodeURIComponent(genreKey || 'unknown');
    },

    /* Localised label; unknown keys fall back to the raw TrackRadar string. */
    label: function (genreKey) {
      var e = TABLE[genreKey];
      if (!e) return genreKey || '';
      return e[global.I18N.lang] || e.zh;
    },

    description: function (genreKey) {
      var e = TABLE[genreKey];
      if (!e) return '';
      return e['d' + global.I18N.lang] || e.dzh;
    },

    icon: function (genreKey) {
      var e = TABLE[genreKey];
      return e ? e.icon : '🎵';
    }
  };
})(window);
