# CLAUDE.md

工程規範、檔案分工、驗證流程一律以 [`AGENTS.md`](./AGENTS.md) 為準，本檔不重複。本檔只處理一件事：**這個站的安全邊界與弱點掃描**。改動任何檔案前，先讀 `AGENTS.md` 的「硬性限制」與「上游資料的既知地雷」，再讀本檔。

## 威脅模型

| 項目 | 現況 |
| --- | --- |
| 架構 | 純靜態站，無後端、無 API key、無登入、無 cookie、無 session |
| 不可信輸入①（主要） | TrackRadar 的 JSON（`channels.json`、`latest-videos.json`、`genres.json`、`data/<channelId>.json`）——**爬蟲產物，等同第三方使用者輸入** |
| 不可信輸入② | URL hash（`#/search?q=`、`#/artist/<id>`、`#/genre/<slug>`），任何人都能做成連結給別人點 |
| 不可信輸入③ | YouTube oEmbed / noembed 回傳的 `title`、`author_name` |
| 要保護的資產 | 訪客瀏覽器（XSS／惡意重導）、`localStorage` 快取完整性、站台聲譽（不得被拿來當開放重導或釣魚跳板） |
| 主要攻擊面 | 上游 repo 被污染或接管 → 惡意欄位值流進 DOM／URL／iframe |
| 不在範圍 | 上游資料「內容真偽」（我們不驗證影片是不是本人作品）；GitHub 帳號／Pages 本身的權限管理 |

判準：**上游 JSON 的每個欄位都當成攻擊者可控字串**。它可能是 `null`、可能是頻道 ID、也可能是 `"><img src=x onerror=...>` 或 `javascript:`。

## 已實作的控制（改動時不得破壞）

1. **無 HTML 注入面。** 文字一律 `textContent`（`h()` 的 `text:`）或 `data-i18n`。搜尋命中反白用 `highlighted()` 建立真正的 `<mark>` 節點，不做字串拼接。
   - `innerHTML` 只有兩處：`js/app.js` 的 `h()` `html:` 參數、`js/i18n.js` 的 `data-i18n-html`。**兩者只允許餵入 i18n 字典常數**（目前唯一使用者是 `search.hint`）。把上游欄位或 query 餵進去＝高風險缺陷。
2. **識別碼白名單（`js/api.js`）。** `VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/`、`CHANNEL_ID = /^[A-Za-z0-9_-]{6,64}$/`、`safeImageUrl()` 只接受絕對 `https://`。所有 URL 組裝器（`watchUrl`、`thumb`、`embedUrl`、`channelUrl`、`artist`）先驗證再拼接，驗不過回空字串／`null`／`reject`。
   - 圖片大小參數也白名單（`/^[a-z]+$/`），避免 `../` 逃出路徑。
   - `js/app.js` 的 `mountWorkGrid()`、`js/search.js` 的掃描佇列都先濾掉非法 videoId；`indexChannels()` 濾掉非法 channelId。
3. **iframe 沙盒化來源。** 播放器只從 `https://www.youtube-nocookie.com/embed/<驗證過的 id>` 載入，`Api.embedUrl()` 驗不過就不插入 iframe。
4. **不用字串拼 selector。** 首頁作品數標註改用節點參照（`infoById`）。曾經是 `querySelector('[href="#/artist/' + ch.id + '"]')`——上游 id 只要含引號就能讓查詢壞掉或擴大命中。
5. **CSP allow-list（`index.html` 的 `<meta http-equiv>`）。**
   ```
   default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
   img-src 'self' data: https://i.ytimg.com https://*.ytimg.com https://yt3.ggpht.com https://*.ggpht.com https://*.googleusercontent.com;
   connect-src https://raw.githubusercontent.com https://www.youtube.com https://noembed.com;
   frame-src https://www.youtube-nocookie.com; base-uri 'none'; form-action 'self'
   ```
   - `script-src 'self'` → 不得引入任何 CDN script、analytics、inline `<script>`。
   - `style-src` 的 `'unsafe-inline'` 是必要之惡：進度條寬度用 `element.style.width` 設定。
   - `frame-ancestors`／`X-Frame-Options` 在 `<meta>` 會被瀏覽器忽略，GitHub Pages 也無法設自訂 header，**因此點擊劫持防護目前缺席**（見殘餘風險）。
6. **外連與 referrer。** 站外連結一律 `target="_blank" rel="noopener"`；頁面層 `referrer` 設 `strict-origin-when-cross-origin`；頭像 `<img referrerpolicy="no-referrer">`。
7. **localStorage 衛生（`js/api.js`）。** 只存影片標題快取（`amusic:vcache:v1`）、語言（`amusic:lang`）、主題（`amusic:theme`），無任何機敏資料。讀取一律 `try/catch` + `JSON.parse` 防禦，14 天 TTL、上限 `CACHE_MAX = 4000` 筆（避免被塞爆配額）。
8. **無第三方 JS、無 npm 依賴。** 供應鏈只剩「TrackRadar 資料」與「YouTube iframe」兩個外部信任點。

## 掃描清單

每次改完 `js/` 或 `index.html`，用 `grep` 工具跑這幾條，逐一確認命中都有正當理由：

| 目的 | pattern |
| --- | --- |
| HTML sink | `innerHTML\|outerHTML\|insertAdjacentHTML\|document\.write` |
| 動態求值 | `\beval\(\|new Function\|setTimeout\(\s*['"\x60]\|setInterval\(\s*['"\x60]` |
| 導向控制 | `location\s*=\|location\.(href\|replace\|assign\|hash)\s*=\|window\.open` |
| URL 拼接 | `(src\|href)\s*[:=].*\+` |
| selector 拼接 | `querySelector(All)?\(\s*['"\x60][^'"\x60]*['"\x60]\s*\+` |
| 未驗證識別碼 | `videoId\|channelId\|avatarUrl` → 確認每個使用點都經過 `Api.safeVideoId` / `safeChannelId` / `safeImageUrl` |
| 危險 sink 屬性 | `\son[a-z]+\s*=\s*["']`（HTML 內嵌事件；本站應為 0 命中。`\s` 開頭才不會誤命中 `content=`／`aria-controls=` 這類屬性） |

目前的合法命中只有這些，其他一律視為缺陷：HTML sink 兩處（`h()` 的 `html:`、`data-i18n-html`，只吃字典）；導向一處（`location.hash = '#/search?q=' + encodeURIComponent(q)`）；URL 拼接皆為站內 hash，且 `channelId` 先過 `Api.safeChannelId()`、`Genres.slug()` 對未知曲風回 `encodeURIComponent()`。動態求值與 selector 拼接必須維持 0 命中。

新增第三方網域時，**必須同步更新 CSP**，否則功能會靜默失敗（在 console 顯示 `Refused to ...`）。

## 負面測試（每次動到 `js/api.js` 的驗證邏輯就重跑）

本機起 server（`python3 -m http.server 4173`），在頁面 console 執行：

```js
Api.thumb('../../../etc/passwd')                       // 預期 ''
Api.thumb('VlPInz7dIDs', '../../x')                    // 預期 .../mqdefault.jpg（size 被白名單擋掉）
Api.embedUrl('abc?list=PLhostile')                     // 預期 ''
Api.watchUrl('javascript:alert(1)')                    // 預期 ''
Api.safeImageUrl('javascript:alert(1)')                // 預期 null
Api.safeImageUrl('data:image/svg+xml,<svg onload=alert(1)>')  // 預期 null
Api.safeImageUrl('//evil.example/x.png')               // 預期 null（協定相對）
Api.safeImageUrl('http://evil.example/x.png')          // 預期 null（非 https）
Api.safeChannelId('UC1234"] , [href^=#')               // 預期 null（selector 注入字串）
Api.artist('../../channels').catch(e => e.message)     // 預期 'bad channel id'
Api.videoMeta('x').catch(e => e.message)               // 預期 'bad video id'
```

再加一次 DOM 層檢查：把惡意標題塞進渲染路徑，確認只會變成字面文字。

```js
// 應該看到字面字串，且 document.querySelectorAll('img[onerror]').length === 0
I18N.t('video.watch');
document.querySelector('.card-title').textContent = '"><img src=x onerror=alert(1)>';
```

CSP 生效驗證：載入首頁與任一藝人頁，console 不得出現 `Refused to load/connect`（`frame-ancestors` 那則 meta 警告除外，已知且刻意保留）。

## 修補原則

- **在邊界修，不在 view 修。** 驗證屬於 `js/api.js`（識別碼與 URL）與 `js/i18n.js`（字串輸出），不要在每個 view 各補一次 `if`。
- **不要用 `try/catch` 或 `.catch()` 蓋掉例外。** 這個 repo 已經吃過一次教訓：`viewHome` 的 `.catch` 把 `TypeError` 偽裝成「載入失敗」畫面，console 乾淨、整頁壞掉。防禦要濾掉壞資料（如 `liveFeed()`），不是吞掉錯誤。
- **修完必附證據**：負面測試輸出 + 受影響路由的實測（清單見 `AGENTS.md`「驗證方式」）。
- 發現弱點但無法立即修：寫進本檔「殘餘風險」，附影響範圍與觸發條件，不要留在 commit message 裡。

## 殘餘風險（已知並接受）

| 風險 | 影響 | 為何接受 |
| --- | --- | --- |
| 上游 repo 被接管 | 可注入任意「標題文字」與任意 YouTube 影片 ID | 文字只會以純文字顯示（無 script 執行），影片來源受 `frame-src` 限制在 youtube-nocookie；資料本來就由該 repo 定義 |
| 無 `frame-ancestors` / `X-Frame-Options` | 站台可被他站 iframe 內嵌（點擊劫持） | 靜態站無登入、無狀態改變操作，可被劫持的動作只有「點連結」；GitHub Pages 無法設自訂 header，要修得換 Cloudflare Pages 之類可設 header 的託管 |
| `noembed.com` 為次要 oEmbed 來源 | 該服務可看到訪客查詢的 videoId | 只在 YouTube oEmbed 失敗時觸發，送出內容僅 videoId，無個資 |
| `style-src 'unsafe-inline'` | 允許 inline style | 進度條寬度需要；本站無使用者可控的 style 字串 |
| localStorage 快取可被同源腳本讀取 | 可讀到曾瀏覽的影片標題 | 內容非機敏，且同源腳本只有本站自己（`script-src 'self'`） |

## 明確禁止

- 引入 CDN script、analytics、第三方字體或任何 npm 套件
- 放任何 token／API key／私密 URL 進 repo（本站不需要憑證）
- 用 `innerHTML` 顯示上游或使用者輸入
- 放寬或移除 CSP 來「讓功能動起來」——先確認該來源是否真的必要，必要才加入 allow-list
- 為了通過驗證而用 `try/catch` 吞掉例外
