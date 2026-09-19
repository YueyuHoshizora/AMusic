# AGENTS.md

給在本 repo 工作的 AI agent 的作業規則。使用者說明文件在 `README.md`，本檔只寫「怎麼改這份程式碼」。

## 專案是什麼

靜態音樂推廣網站「聽見音樂 A-Music」，把 [TrackRadar](https://github.com/YueyuHoshizora/TrackRadar) 蒐集到的音樂人與 YouTube 作品做成可瀏覽、可搜尋的站台。部署在 GitHub Pages（`main` 分支根目錄），線上位址 <https://a-music.app/>。

## 硬性限制（不要打破）

1. **瀏覽器端無建置流程、無相依套件。** 沒有 `package.json`、沒有 bundler、沒有 CSS 前處理器。不要引入。唯一的產生器 `tools/build-pages.py` 只跑在 CI／本機，產出物（路由 shell、`sitemap.xml`）是純靜態檔，瀏覽器不需要它。
2. **傳統 `<script>`，不是 ES module。** 各檔案用 IIFE 包住，經 `window.X` 掛出單一全域（`I18N`、`Genres`、`Api`、`SearchEngine`、`Theme`）。不要加 `type="module"` 或 `import`／`export`。
3. **語法保守（ES5-safe）。** 現有程式一律 `var` + `function`，不用 arrow function、template literal、`class`、`const`／`let`、optional chaining。新程式碼跟著現狀寫。
4. **Path 路由（History API）。** 路由是真實路徑（`/genres/`、`/genre/pop/`、`/artist/<id>/`），結尾斜線是 canonical 形式。GitHub Pages 沒有 rewrite，所以**每條路由都必須有實體 `index.html`**，由 `tools/build-pages.py` 產生；缺檔的路徑只會落到 `404.html`（畫面正常但狀態碼 404，不會被索引）。不要改回 hash 路由，也不要手寫這些 shell。
5. **顏色不寫死。** 只能用 `css/style.css` 頂端宣告的 CSS 變數；新增色票要同時補 `[data-theme="dark"]` 與 `[data-theme="light"]` 兩套。
6. **UI 字串不寫死。** 任何使用者看得到的文字都必須經 `I18N.t()` 或 `data-i18n*`，且 zh／en／ja 三個字典同時補齊。
7. **歷史作品不得一次載入全部卡片。** `data/<channelId>.json` 的 `allVideoIds` 現在是 `{videoId,title,genre}`（舊版可能仍是字串 ID）；卡片仍分批上架。標題以 JSON 為準，缺 title 才走 oEmbed。
8. **授權標頭不得移除。** 專案採 AGPL-3.0-or-later（`LICENSE`）。`index.html`、`css/style.css`、`js/*.js` 每個檔案第一段都有 `SPDX-License-Identifier: AGPL-3.0-or-later`，新增檔案要跟著加；footer 的「原始碼」連結是 AGPL 第 13 條的義務，不得刪除。引入外部程式碼前先確認授權相容（GPL/AGPL 相容才行）。

## 檔案分工

| 檔案 | 職責 | 不該做的事 |
| --- | --- | --- |
| `index.html` | 外殼：header／nav／搜尋列／footer，靜態字串用 `data-i18n*` | 不放頁面內容（由 `js/app.js` 渲染進 `#main`） |
| `404.html` | 無 shell 路徑的 fallback（產生器輸出，`noindex`、無 canonical） | 不要手改；不要改成轉址到 `/`（會變 soft 404） |
| `sitemap.xml` / `robots.txt` | 可爬 URL 清單與 hreflang 對應（`sitemap.xml` 由產生器輸出） | `sitemap.xml` 不要手改 |
| `tools/build-pages.py` | 從 `index.html` 產生各路由 shell、`404.html`、`sitemap.xml`、`.pages-stamp` | 不要讓它變成瀏覽器端的相依 |
| `.github/workflows/build-pages.yml` | 每 5 分鐘重跑產生器，有 diff 才 commit | 不要拿掉 `--if-changed`（排程會變成每 5 分鐘抓 21 份上游 JSON） |
| `css/style.css` | 全站樣式、兩套主題變數、RWD（斷點 560 / 900 / 1240 px） | 不寫死顏色、不加第三方字體 |
| `js/theme.js` | 亮／暗主題；在 `<head>` 內同步執行 | 不要移到 `</body>` 前（會主題閃爍） |
| `js/i18n.js` | `META` 語系設定、`DICT` 三語字典、`t()`／`applyStatic()`／`Intl` 格式化 | 不在其他檔案內嵌字串字典 |
| `js/genres.js` | 曲風 slug／emoji／三語名稱與說明（含上游沒有的本機分類如 Vocaloid） | 與上游重疊的鍵值必須等於 `genres.json` 的原始字串 |
| `js/api.js` | 唯一的資料層：TrackRadar JSON、YouTube oEmbed、localStorage 快取 | 其他檔案不得直接 `fetch()` 上游 |
| `js/search.js` | 萬用字元比對、全曲庫漸進式掃描 | 不做 DOM 操作 |
| `js/app.js` | Path 路由（pushState／popstate／連結攔截）、各頁 view、卡片、瀑布流、延遲載入 | 不直接組 raw URL（一律經 `Api`） |

載入順序（`index.html`）：`theme.js` 在 `<head>`；其餘依 `i18n → genres → api → search → app` 放在 body 末端，`app.js` 尾端自行 `route(true)` 啟動。

## 上游資料的既知地雷

資料是爬蟲即時產出的，schema 會鬆動。已踩過並且**必須維持防禦**的兩點：

- `latest-videos.json` 的 `channels[].latestVideo` 可能是 `null`（頻道剛被追蹤、尚未索引到第一首）。所有讀取 feed 的地方一律先過 `liveFeed(latest)`，它只回傳 `latestVideo && latestVideo.videoId` 的列。曾因缺這層防禦而整頁噴 `TypeError`，並被 `.catch` 吞成「載入失敗」畫面。
- `latest-videos.json` 與 `data/<channelId>.json` 的 `channelTitle`，在未索引時等於頻道 ID。**顯示名稱與頭像一律以 `channels.json` 為權威來源**（`indexChannels()` / `feedCard()`；`js/search.js` 內為 `ch.name || data.channelTitle`）。
- raw CDN 會短時間並行提供新舊兩版 JSON，同一份程式可能拿到不同筆數。不要寫死筆數，也不要以「數字對不上」判定有 bug。

新增讀取上游欄位時，先用 `curl` 看實際資料再寫，並假設欄位可能缺失。

## 延遲載入與瀑布流的約定

- `createMasonry()` 是 JS 固定欄位瀑布流（1 / 2 / 3 / 4 欄），新卡片插入當下最短的欄位。**不要換成 CSS multi-column**：追加批次會重排已顯示的卡片。
- `IntersectionObserver` 的 `rootMargin` 維持 `120px`：必須是使用者真的捲到接近底部才抓下一批（`PAGE_SIZE = 12`）。閒置不得自行往下長。
- 首批撐不出捲軸時，靠 `fillViewport()` 補位，避免觀察器永不再觸發。
- 每個 view 註冊的 observer／掃描都要 push 進 `teardown`，`route()` 會在切頁時呼叫。新增長時間任務務必註冊，否則換頁後仍在跑。

## 搜尋語意

- 無萬用字元：NFKC 正規化後的不分大小寫子字串比對。
- `*` = 任意長度、`?` = 單一字元，且是**未錨定**（「包含」）語意——`可*` 要能命中 `COYA可夜`。不要改回錨定全字串比對。
- 歌曲搜尋需掃描全曲庫：先吃 JSON 內建標題，再吃 localStorage 快取（零請求），未命中的才併發 6 條抓 oEmbed，並可 `abort()`。

## SEO 的既定作法

- **路由是路徑，語系是 query string**：`/genre/pop/?lang=en`。`urlLang()` 優先於 localStorage 與 `navigator`，`setLang()` 用 `history.replaceState` 改寫 `lang` 參數（保留路徑與其他參數）。站內連結一律不帶 `lang`，讓爬蟲看到乾淨 URL；`navigate()` 會把使用者當下的明確選擇帶過去。
- **每條路由都要有實體 shell**：`tools/build-pages.py` 以 `index.html` 為唯一模板，替換該路由的 `<title>`／description／canonical／hreflang／`og:*`，所以爬蟲在 JS 執行前就拿到正確 meta。新增路由樣式（例如 `/tag/<x>/`）時，必須同時加進產生器的 route 表、`isAppRoute()` 與 `OWNED_DIRS`，否則線上會是 404。
- **產生器必須是 idempotent**：`write()` 只在內容真的變動時寫檔，`lastmod` 取自上游 `updatedAt` 而不是系統時間；否則排程會每 5 分鐘產生一筆假 commit。快篩指紋 = `updatedAt` + `channels.json` 名冊的 sha256（名冊要算進去，否則上游新增音樂人卻沒動 `updatedAt` 時會被永久跳過）。
- **canonical 跟著 URL，不跟著顯示語言**：Googlebot 用 en 的 Accept-Language 抓 `/`，若把 canonical 指到 `/?lang=en` 會把 apex 的權重讓給變體。只有明確帶 `?lang=` 才給變體 canonical（`canonicalUrl()`）。in-app 導覽時 `syncAlternates()` 會把 hreflang 重新指向當前路由。
- **每頁 meta 走 `I18N.setPageMeta({title, desc, noindex})`**：`route()` 先 `setPageMeta(null)` 還原站台預設，各 view 自己設定。`syncSEO()` 一次同步 `<title>`、description、`og:*`、`twitter:*`、canonical 與 `robots`。
- 搜尋頁與找不到頁面必須 `noindex: true`（內容單薄／重複）。
- 每個 view 只能有一個 `h1`：`section(titleKey, descKey, extra, 'h1')` 用在頂層頁面，首頁的區塊標題維持 `h2`（`h1` 在 hero）。
- `index.html` 的 JSON-LD 只描述站台本身（Organization + WebSite）。要加 `BreadcrumbList`／`MusicGroup` 的話必須寫進 shell（靜態 HTML），JS 注入對只抓 HTML 的爬蟲無效。

## 驗證方式（改完一定要做）

沒有測試套件，驗證＝**實際跑起來看**。

```bash
python3 -m http.server 4173    # 必須用 HTTP；file:// 會被擋 fetch
# http://127.0.0.1:4173/
```

`http.server` 會把 `/genres` 301 到 `/genres/`（跟 GitHub Pages 一樣），但**不會**對缺檔路徑回 `404.html`。要驗 fallback（例如上游剛新增、還沒產生 shell 的音樂人），得用會回退到 `404.html` 的簡易 server。

改動後至少走過：`/`、`/latest/`、`/artists/`、`/genres/`、`/genre/<slug>/`、`/artist/<channelId>/`、`/search/?q=可*`，逐項確認：

- console 無 error、無 pageerror、無 requestfailed（view 的 `.catch` 會把例外偽裝成「載入失敗」畫面，只看畫面會誤判）
- 三個語系都切一遍，日期／數字格式跟著變
- 亮／暗主題都看一次，重新載入後仍保持選擇
- 至少量一次手機寬度（390px）與桌機（1280px），確認無水平溢位
- 瀑布流：閒置時卡片數不變，捲到底部才追加

**瀏覽器會吃 JS／CSS 快取**：驗證前關掉快取或加 query string，否則會看到舊行為（已經發生過一次誤判）。

## 送出與部署

- commit message 用中文，首行 `type: 摘要`（`feat:` / `fix:` / `docs:`），內文列出實際改動點。
- push 到 `main` 即觸發 Pages 重建；要確認部署完成再回報：

```bash
gh api repos/YueyuHoshizora/AMusic/pages/builds/latest --jq '.status + " " + .commit'
```

- 線上驗證與本機同一份清單，且線上是 HTTPS，跨網域抓 `raw.githubusercontent.com` 與 YouTube oEmbed 皆已確認允許跨域。

## 新增語言的步驟

1. `js/i18n.js`：`META` 加語系（`htmlLang`、`intl`），`DICT` 補齊同一組 key
2. `js/genres.js`：每個曲風加該語系的名稱與說明欄位
3. `index.html`：`.lang-switch` 加一顆 `data-lang="xx"` 按鈕

字典缺 key 時 `t()` 會先退回預設語系（zh），再退回 key 字串本身；缺漏不會讓畫面壞掉，但也不會自己浮出來，補完後務必三語各切一次確認。
