# 聽見音樂 A-Music

推廣獨立音樂人 YouTube 作品的靜態網站。無建置流程、無相依套件，純 HTML / CSS / ES5-safe JavaScript。線上：<https://a-music.app/>。

## 執行

```bash
python3 -m http.server 4173
# http://127.0.0.1:4173/
```

必須透過 HTTP 伺服器開啟（`file://` 會被瀏覽器阻擋 fetch）。路由是真實路徑（`/artist/<id>/`），每條路由都有自己的 `index.html`，因此不需要伺服器改寫規則；部署時直接上傳整個目錄即可。缺 shell 的路徑會落到 `404.html`，畫面仍正常。

## 目錄

| 路徑 | 內容 |
| --- | --- |
| `index.html` | 外殼：header、語言切換、搜尋列、footer；canonical／Open Graph／Twitter Card |
| `css/style.css` | Mobile-first RWD；斷點 560 / 900 / 1240 px；亮色／暗色兩套變數 |
| `js/theme.js` | 佈景主題：亮色／暗色切換與記憶（在 `<head>` 先行載入，避免閃爍） |
| `js/i18n.js` | i18n 核心：zh / en / ja 字典、`data-i18n*` 宣告式套用、`Intl` 日期與數字格式 |
| `js/genres.js` | 曲風標籤三語對照（鍵值＝TrackRadar `genres.json` 的原始字串） |
| `js/api.js` | 資料層：TrackRadar JSON + YouTube oEmbed，含 localStorage 快取與併發控制 |
| `js/search.js` | 萬用字元比對與全曲庫漸進式掃描 |
| `js/app.js` | Path 路由（pushState / popstate / 連結攔截）與各頁面 view、瀑布流、延遲載入 |
| `tools/build-pages.py` | 產生各路由 `index.html`、`404.html`、`sitemap.xml`、`sitemap-videos.xml`（唯一模板是 `index.html`） |
| `tools/version-assets.py` | 依內容 sha256 幫 `index.html` 裡的本地 `js`／`css` 加上 `?v=` 查詢字串，避免瀏覽器／CDN 快取到舊版本；在 `build-pages.py` 之前跑，讓每條路由 shell 都繼承新版號 |
| `.github/workflows/build-pages.yml` | 每 5 分鐘重跑產生器，上游有變動才 commit |
| `assets/og-image.png` | 社群分享圖（1200×630） |
| `robots.txt` | 允許所有搜尋引擎收錄，並指向兩份 sitemap |
| `sitemap.xml` | 全部可爬路由與 hreflang 對應（產生器輸出，勿手改） |
| `sitemap-videos.xml` | 影片 sitemap：每位音樂人頁面掛上該頁可播放的全部作品（產生器輸出，勿手改） |
| `404.html` | 無 shell 路徑的 fallback（產生器輸出，`noindex`） |
| `latest/`、`artists/`、`genres/`、`genre/<slug>/`、`artist/<id>/`、`search/` | 產生器輸出的路由 shell（勿手改） |
| `.pages-stamp` | 上游指紋，讓排程能快速判斷「沒變就不用重建」 |
| `CNAME` | GitHub Pages 自訂網域 `a-music.app` |

## 資料來源

網站本身不存放任何音樂資料，所有內容都在瀏覽器端即時取自 **TrackRadar**：

> https://github.com/YueyuHoshizora/TrackRadar

讀取位址為該 repo 的 raw 檔案（`js/api.js` 的 `BASE`）：

```
https://raw.githubusercontent.com/YueyuHoshizora/TrackRadar/refs/heads/main/
```

| 檔案 | 用途 | 使用的欄位 |
| --- | --- | --- |
| `channels.json` | 音樂人名冊（權威來源：顯示名稱與頭像皆以此為準） | `id`、`name`、`avatarUrl` |
| `latest-videos.json` | 各頻道最新一首作品 | `updatedAt`、`channels[].channelId`、`latestVideo.{videoId,title,thumbnail,durationSeconds,publishedAt,genre}` |
| `genres.json` | 曲風分類定義（鍵值即曲風原始字串） | 全部鍵值 |
| `data/<channelId>.json` | 該音樂人的完整作品列表 | `allVideoIds[]{videoId,title,genre}`、`latestVideo`、`lastUpdated` |

資料是上游即時抓取的結果，因此本站對兩種情況做了防禦：

- `latestVideo` 可能為 `null`（頻道剛被追蹤、還沒索引到第一首作品）。這類資料列在 `liveFeed()` 一律濾除，不會進入任何畫面。
- `latest-videos.json` 的 `channelTitle` 在未索引時等於頻道 ID，顯示名稱與頭像因此一律以 `channels.json` 為準（`indexChannels()`）。

歷史作品的標題與曲風已寫在 `allVideoIds` 裡；缺 title 時才向 YouTube oEmbed 取得（失敗時退回 noembed），結果寫入 `localStorage`（key `amusic:vcache:v1`，14 天 TTL）。卡片仍分批上架，不會一次渲染整份曲庫。

音樂人頭像直接使用 `avatarUrl`（YouTube 圖片 CDN，`loading="lazy"` + `referrerpolicy="no-referrer"`）；載入失敗時自動退回姓名首字的漸層圓形佔位。

## 音樂人排序

音樂人清單（首頁、`/artists/`、搜尋結果的藝人區）每次繪製都以 Fisher-Yates 洗牌（`shuffled()`），不會有固定的人長期佔據第一個位置。洗牌只作用在複本上，快取的 `channels.json` 陣列不受影響。

## 頁面

- `/`：Hero 統計、曲風快速篩選、最新音樂（最多三列）、音樂人列表
- `/latest/`、`/artists/`、`/genres/`、`/genre/<slug>/`
- `/artist/<channelId>/`：簡介（依作品數、主要曲風、最新作品自動生成三語文案）、最新作品、全部作品
- `/search/?q=<query>`：藝人與歌曲搜尋結果

## 歷史作品：瀑布流 + 延遲載入

`js/app.js` 的 `createMasonry()` 以固定欄位（1 / 2 / 3 / 4 欄，依容器寬度）實作瀑布流，每張卡片插入當下最短的欄位；因此追加新批次不會重排已顯示的卡片（CSS multi-column 會）。欄數改變時才整體重新分配。

載入節奏：`IntersectionObserver` 只用 `rootMargin: 120px`，也就是使用者真的捲到接近底部才抓下一批 12 首；閒置時不會自行往下長。若首批不足以撐出捲軸，`fillViewport()` 會補到出現捲動空間為止。搜尋結果同樣採瀑布流，命中結果先進緩衝區，捲動時每次再顯示 24 筆。

## 搜尋

- 無萬用字元：不分大小寫的子字串比對（先做 NFKC 正規化）
- `*`：任意長度字串；`?`：單一字元；皆為「包含」語意，例如 `星*語` 可命中標題中間的片段
- 藝人比對即時完成；歌曲需掃描全曲庫，掃描進度以進度條顯示並可隨時停止，已命中的結果即時串流顯示

## 佈景主題

亮色與暗色兩套主題，色票各自定義在 `css/style.css` 的 `:root[data-theme="dark"]` 與 `:root[data-theme="light"]`；元件只使用 `--bg` / `--surface` / `--line` / `--text` / `--muted` / `--brand` 等變數，不寫死顏色。

`js/theme.js` 在 `<head>` 內同步執行，於首次繪製前就把 `data-theme` 寫到 `<html>`，因此不會出現主題閃爍。預設跟隨系統 `prefers-color-scheme`（系統設定變更會即時套用）；使用者一旦在右上角按下亮色／暗色按鈕，選擇即寫入 `localStorage`（key `amusic:theme`）並固定下來，同時更新 `<meta name="theme-color">`。

## 新增語言

1. `js/i18n.js`：在 `META` 加入語系（`htmlLang`、`intl`），並於 `DICT` 補齊同一組 key
2. `js/genres.js`：為每個曲風加上該語系的 `xx` 與 `dxx` 欄位
3. `index.html`：在 `.lang-switch` 加一顆 `data-lang="xx"` 按鈕

介面字串一律走 `I18N.t()`；靜態標記使用 `data-i18n` / `data-i18n-ph` / `data-i18n-aria` / `data-i18n-html`。切換語言會即時重繪目前頁面並寫入 `localStorage`（key `amusic:lang`），首次造訪則依瀏覽器語言判斷。

語言也可以用網址指定：`https://a-music.app/?lang=en`、`/genre/pop/?lang=ja`（`?lang=` 優先於 `localStorage` 與瀏覽器語言）。切換語言時會以 `history.replaceState` 更新這個參數，路徑與其他參數都保留，所以 `/genres/?lang=ja` 可以直接分享。

## SEO

- 路由是真實路徑，且**每條路由都有實體 `index.html`**（`tools/build-pages.py` 產生）。GitHub Pages 沒有 rewrite，沒有實體檔案的路徑只會回 404，因此這些 shell 是「路由能被索引」的前提。
- 每個 shell 的 `<head>` 就帶好該頁的 `<title>`、`description`、canonical、hreflang 與 `og:*`，爬蟲不必執行 JavaScript 就能拿到正確 meta；`js/app.js` 進站後再用 `I18N.setPageMeta()` 維持 SPA 導覽時的同步。
- canonical 跟著網址而不是顯示語言：`/` 永遠 canonical 到 `/`，只有明確帶 `?lang=en` / `?lang=ja` 才 canonical 到對應變體，避免 apex 的權重被語系變體吃掉。
- 站內連結不帶 `lang`（爬蟲看到乾淨 URL），使用者的明確選擇則由 `navigate()` 在站內導覽時帶著走。
- 搜尋結果頁與找不到頁面加上 `robots: noindex, follow`；每頁維持單一 `h1`。
- `index.html` 內嵌 JSON-LD（`Organization` + `WebSite`）描述站台本身。

## 路由 shell 的維護

```bash
python3 tools/version-assets.py             # 改了 css/js 才需要：刷新 index.html 的 ?v= 版號
python3 tools/build-pages.py                # 完整重建（會讀最新的 index.html，含上一步的版號）
python3 tools/build-pages.py --if-changed   # 上游沒變就直接結束（排程用）
```

頁面內容永遠是瀏覽器端即時抓上游，不受 shell 影響；shell 只影響 `<head>` 的 meta 與「哪些路徑有實體檔案」。`.github/workflows/build-pages.yml` 每 5 分鐘跑一次 `--if-changed`，上游 `updatedAt` 或音樂人名冊有變才完整重建並 commit。因此上游新增音樂人後，該藝人頁會有最多一個排程週期是靠 `404.html` 渲染（畫面正常，狀態碼 404、暫不進索引），重建後就變成 200。

GitHub 的排程是 best-effort（常延遲數分鐘），且 repo 連續 60 天沒有任何活動時會自動停用排程 workflow；必要時在 Actions 頁面手動觸發一次即可恢復。

## 授權

本專案以 **GNU Affero General Public License v3.0 或更新版本**（AGPL-3.0-or-later）釋出，全文見 [`LICENSE`](./LICENSE)。

```
Copyright (C) 2026 Yueyu Hoshizora

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <https://www.gnu.org/licenses/>.
```

AGPL 的重點在第 13 條：**若你修改本站並讓使用者透過網路使用，必須向這些使用者提供你修改後的完整原始碼**。為此頁面 footer 常設「原始碼」連結指向本 repo，改站時請一併把連結改成你自己的版本。

授權範圍僅限本 repo 的程式碼與樣式。網站呈現的音樂作品、縮圖、頻道名稱與頭像屬於各自的創作者與 YouTube，不在本授權範圍內；上游資料由 [TrackRadar](https://github.com/YueyuHoshizora/TrackRadar) 提供，其授權以該 repo 為準。
