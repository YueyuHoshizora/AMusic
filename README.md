# 聽見音樂 A-Music

推廣獨立音樂人 YouTube 作品的靜態網站。無建置流程、無相依套件，純 HTML / CSS / ES5-safe JavaScript。

## 執行

```bash
python3 -m http.server 4173
# http://127.0.0.1:4173/
```

必須透過 HTTP 伺服器開啟（`file://` 會被瀏覽器阻擋 fetch）。部署時直接上傳整個目錄即可，路由採 hash（`#/artist/<id>`），不需要伺服器改寫規則，可直接放 GitHub Pages / Cloudflare Pages。

## 目錄

| 路徑 | 內容 |
| --- | --- |
| `index.html` | 外殼：header、語言切換、搜尋列、footer |
| `css/style.css` | Mobile-first RWD；斷點 560 / 900 / 1240 px；亮色／暗色兩套變數 |
| `js/theme.js` | 佈景主題：亮色／暗色切換與記憶（在 `<head>` 先行載入，避免閃爍） |
| `js/i18n.js` | i18n 核心：zh / en / ja 字典、`data-i18n*` 宣告式套用、`Intl` 日期與數字格式 |
| `js/genres.js` | 曲風標籤三語對照（鍵值＝TrackRadar `genres.json` 的原始字串） |
| `js/api.js` | 資料層：TrackRadar JSON + YouTube oEmbed，含 localStorage 快取與併發控制 |
| `js/search.js` | 萬用字元比對與全曲庫漸進式掃描 |
| `js/app.js` | Hash 路由與各頁面 view、瀑布流、延遲載入 |

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
| `data/<channelId>.json` | 該音樂人的完整作品 ID 列表 | `allVideoIds`、`latestVideo`、`lastUpdated` |

資料是上游即時抓取的結果，因此本站對兩種情況做了防禦：

- `latestVideo` 可能為 `null`（頻道剛被追蹤、還沒索引到第一首作品）。這類資料列在 `liveFeed()` 一律濾除，不會進入任何畫面。
- `latest-videos.json` 的 `channelTitle` 在未索引時等於頻道 ID，顯示名稱與頭像因此一律以 `channels.json` 為準（`indexChannels()`）。

歷史作品只有 ID，單曲標題於需要時才向 YouTube oEmbed 取得（失敗時退回 noembed），結果寫入 `localStorage`（key `amusic:vcache:v1`，14 天 TTL），因此二次瀏覽與再次搜尋幾乎不再發送請求。

音樂人頭像直接使用 `avatarUrl`（YouTube 圖片 CDN，`loading="lazy"` + `referrerpolicy="no-referrer"`）；載入失敗時自動退回姓名首字的漸層圓形佔位。

## 音樂人排序

音樂人清單（首頁、`#/artists`、搜尋結果的藝人區）每次繪製都以 Fisher-Yates 洗牌（`shuffled()`），不會有固定的人長期佔據第一個位置。洗牌只作用在複本上，快取的 `channels.json` 陣列不受影響。

## 頁面

- `#/`：Hero 統計、曲風快速篩選、最新音樂（最多三列）、音樂人列表
- `#/latest`、`#/artists`、`#/genres`、`#/genre/<slug>`
- `#/artist/<channelId>`：簡介（依作品數、主要曲風、最新作品自動生成三語文案）、最新作品、全部作品
- `#/search?q=<query>`：藝人與歌曲搜尋結果

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
