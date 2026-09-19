# Privacy Policy · 隱私權說明

Last updated: 2026-09-19  
Site: <https://a-music.app/>  
Operator: Yueyu Hoshizora (<yueyuhoshizora@gmail.com>)

Traditional Chinese follows the English text.

This is a **static website**. We do not run an application server and we do not create accounts. Nothing you do on the site is sent to a backend we control.

## What we do not collect

We do not collect names, email addresses, payment details, location, or advertising identifiers. There is no login, no newsletter, no comment form, and no advertising or analytics script of our own.

The search box only changes the **URL hash** in your browser (`#/search?q=…`). Hash fragments are not sent to GitHub Pages as part of the request.

A **Buy Me a Coffee** donation button is loaded on every page from their CDN. Clicking it opens their checkout iframe. Donations are processed by Buy Me a Coffee, not us. Their widget may set a first-party cookie named `visited` on this origin (used to hide a one-time tooltip). See [Buy Me a Coffee’s privacy policy](https://www.buymeacoffee.com/privacy-policy).

## What stays on your device

The site writes three keys to `localStorage` on this origin only. They never leave your browser:

| Key | Purpose | Lifetime |
| --- | --- | --- |
| `amusic:lang` | Interface language you picked (zh / en / ja). First visit follows the browser language. | Until you change it or clear site data |
| `amusic:theme` | Light / dark theme after you press the switch. Until then the site follows `prefers-color-scheme`. | Until you change it or clear site data |
| `amusic:vcache:v1` | Cached YouTube video titles (and related oEmbed fields) so repeat visits and search do not re-fetch every id. | 14 days per entry; at most 4 000 entries |

Clearing this site’s data in the browser, or using private mode, removes them. The site still works without `localStorage` (cache stays in memory for that tab only).

## Requests your browser makes

Opening a page causes the browser to fetch files from this site (HTML, CSS, JS, logo) and then:

| Destination | Why | What is sent |
| --- | --- | --- |
| GitHub Pages (`a-music.app`) | Hosts this site | Ordinary page request (IP address and user-agent are visible to GitHub as for any website) |
| `raw.githubusercontent.com` (TrackRadar) | Channel list, latest videos, genres, per-artist video ids | Ordinary HTTPS request; no account token |
| `i.ytimg.com`, `yt3.ggpht.com`, `*.googleusercontent.com` | Video thumbnails and channel avatars | Image request. Avatars are loaded with `referrerpolicy="no-referrer"` |
| `www.youtube.com` (oEmbed) | Resolve a video title when it is not in the local cache | The YouTube watch URL of that video id |
| `cdnjs.buymeacoffee.com`, `cdn.buymeacoffee.com` | Donation widget script, icon, and font | Loaded on every page |
| `www.buymeacoffee.com`, `buymeacoffee.com` | Donation checkout iframe | **Only after you click the coffee button** |
| `noembed.com` | Fallback only if YouTube oEmbed fails | The same watch URL (video id only) |
| `www.youtube-nocookie.com` | In-page player, **only after you press play** | YouTube’s embed; subject to [Google’s privacy policy](https://policies.google.com/privacy) |

Clicking “Watch on YouTube” opens `youtube.com` in a new tab (`rel="noopener"`).

We do not receive those third-party logs. Their processing is governed by GitHub, Google / YouTube, noembed, and Buy Me a Coffee respectively.

Page-level referrer policy is `strict-origin-when-cross-origin`.

## Children

The site does not target children and does not knowingly collect personal data from anyone, including children.

## Your choices

- Change or clear language and theme from the header, or by deleting site data.
- Do not press play if you do not want YouTube’s embed to load. Do not click the coffee button if you do not want Buy Me a Coffee’s checkout iframe to load.
- Block `localStorage` or third-party requests in the browser; the catalogue may load more slowly or titles may stay unresolved.

## Changes

Updates will be committed to this file in the [AMusic repository](https://github.com/YueyuHoshizora/AMusic). The date at the top will change.

## Contact

Questions about this policy: <yueyuhoshizora@gmail.com>  
Security issues: see [SECURITY.md](./SECURITY.md)

---

## 我們不蒐集什麼

這是**靜態網站**：沒有應用伺服器、沒有帳號。你在站上的操作不會送到我們控制的後端。

我們不蒐集姓名、電子郵件、付款資料、位置、廣告識別碼。沒有登入、電子報或留言表單，也沒有我們自己的分析或廣告腳本。

搜尋只改瀏覽器裡的 **URL hash**（`#/search?q=…`）。Hash 不會當作 GitHub Pages 請求的一部分送出。

每一頁會從 CDN 載入 **Buy Me a Coffee** 贊助按鈕。點下去才會打開他們的結帳 iframe。贊助由 Buy Me a Coffee 處理，不是我們。該 widget 可能在本站 origin 寫入名為 `visited` 的第一方 cookie（用來隱藏一次性提示）。見 [Buy Me a Coffee 隱私權政策](https://www.buymeacoffee.com/privacy-policy)。

## 只留在你裝置上的資料

本站只在此 origin 的 `localStorage` 寫入三個鍵，不會上傳：

| 鍵 | 用途 | 保存期間 |
| --- | --- | --- |
| `amusic:lang` | 你選的介面語言（zh / en / ja）。第一次造訪依瀏覽器語言。 | 直到你更改或清除網站資料 |
| `amusic:theme` | 按下切換後的亮／暗主題。在那之前跟隨系統 `prefers-color-scheme`。 | 直到你更改或清除網站資料 |
| `amusic:vcache:v1` | 快取的 YouTube 影片標題（及相關 oEmbed 欄位），避免每次重抓。 | 每筆 14 天；最多 4 000 筆 |

在瀏覽器清除此站資料、或使用私密模式，就會刪除。沒有 `localStorage` 時網站仍可運作（快取只留在該分頁記憶體）。

## 瀏覽器會對外發出的請求

開啟頁面時，瀏覽器會載入本站檔案（HTML、CSS、JS、標誌），接著可能連到：

| 目的地 | 原因 | 送出的內容 |
| --- | --- | --- |
| GitHub Pages（`a-music.app`） | 託管本站 | 一般網頁請求（IP、User-Agent 與任何網站一樣會被 GitHub 看到） |
| `raw.githubusercontent.com`（TrackRadar） | 音樂人名冊、最新作品、曲風、各頻道 video id | 一般 HTTPS 請求，不含帳號憑證 |
| `i.ytimg.com`、`yt3.ggpht.com`、`*.googleusercontent.com` | 影片縮圖與頻道頭像 | 圖片請求。頭像帶 `referrerpolicy="no-referrer"` |
| `www.youtube.com`（oEmbed） | 本機快取沒有標題時，解析影片標題 | 該 video id 的 YouTube 觀看網址 |
| `noembed.com` | 僅在 YouTube oEmbed 失敗時作為備援 | 同一個觀看網址（只有 video id） |
| `www.youtube-nocookie.com` | 頁內播放器，**只有你按下播放之後**才載入 | YouTube 內嵌播放，適用 [Google 隱私權政策](https://policies.google.com/privacy) |
| `cdnjs.buymeacoffee.com`、`cdn.buymeacoffee.com` | 贊助按鈕腳本、圖示、字型 | 每一頁都會載入 |
| `www.buymeacoffee.com`、`buymeacoffee.com` | 贊助結帳 iframe | **只有你點下咖啡按鈕之後**才載入 |

點「在 YouTube 觀看」會開新分頁到 `youtube.com`（`rel="noopener"`）。

我們拿不到上述第三方的日誌。其處理分別受 GitHub、Google／YouTube、noembed、Buy Me a Coffee 的政策拘束。

頁面 Referrer 政策為 `strict-origin-when-cross-origin`。

## 兒童

本站不以兒童為對象，也不會故意蒐集任何人（包括兒童）的個人資料。

## 你可以怎麼做

- 在頁首切換語言與主題，或刪除網站資料。
- 若不想載入 YouTube 內嵌播放器，不要按播放。若不想載入 Buy Me a Coffee 結帳 iframe，不要點咖啡按鈕。
- 可在瀏覽器封鎖 `localStorage` 或第三方請求；目錄會變慢，標題可能無法解析。

## 變更

更新會提交到 [AMusic 倉庫](https://github.com/YueyuHoshizora/AMusic) 的本檔，並改頁首日期。

## 聯絡

本政策相關問題：<yueyuhoshizora@gmail.com>  
安全弱點請見 [SECURITY.md](./SECURITY.md)
