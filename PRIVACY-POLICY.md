# Privacy Policy · 隱私權說明

Last updated: 2026-09-19  
Site: <https://a-music.app/>  
Operator: Yueyu Hoshizora (<yueyuhoshizora@gmail.com>)

Traditional Chinese follows the English text.

This is a **static website**. We do not run an application server and we do not create accounts. Nothing you do on the site is sent to a backend we control.

## What we do not collect

We do not collect names, email addresses, payment details, or location. There is no login, no newsletter, no comment form, and no analytics script of our own. We do run **Google AdSense** (see below): we never receive your personal data from it, only aggregate earnings reports.

The search box only changes the **URL path** in your browser (`/search/?q=…`). The query string is part of the request to GitHub Pages; we do not log it, and GitHub Pages gives us no access to request logs.

A **Buy Me a Coffee** donation button is loaded on every page from their CDN. Clicking it opens their checkout iframe. Donations are processed by Buy Me a Coffee, not us. Their widget may set a first-party cookie named `visited` on this origin (used to hide a one-time tooltip). See [Buy Me a Coffee’s privacy policy](https://www.buymeacoffee.com/privacy-policy).

## Advertising

Every page except the 404 error page loads **Google AdSense** (publisher `ca-pub-7132586781018963`). Google is an independent controller for this processing.

- Google and its partners may set or read **cookies** and similar device identifiers in your browser to serve, measure, and improve ads, and to limit how often you see the same ad.
- Google may use your **IP address, user-agent, approximate location, and the page you are on**. With personalised advertising enabled, it may also use your prior visits to this and other sites.
- We do not send Google any account, contact, or payment data — we hold none.

Your controls:

- Opt out of personalised advertising at [Google Ads Settings](https://adssettings.google.com/) (`My Ad Center`).
- Manage third-party vendors at [youradchoices.com](https://optout.aboutads.info/) or [youronlinechoices.eu](https://www.youronlinechoices.eu/).
- Block cookies or use an ad blocker; the site works normally without ads.
- Details: [How Google uses information from sites or apps that use our services](https://policies.google.com/technologies/partner-sites) and [Google’s advertising policies](https://policies.google.com/technologies/ads).

In the EEA, the UK, and Switzerland, Google’s consent flow is shown before personalised ads are served, as required by the EU user consent policy. Your choice there is stored by Google, not by us.

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
| `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`, `fundingchoicesmessages.google.com` | Google AdSense script, ad creatives, and (in the EEA / UK / CH) the consent message | Ad request with IP address, user-agent, and the page URL; may set or read cookies |

Clicking “Watch on YouTube” opens `youtube.com` in a new tab (`rel="noopener"`).

We do not receive those third-party logs. Their processing is governed by GitHub, Google / YouTube / AdSense, noembed, and Buy Me a Coffee respectively.

Page-level referrer policy is `strict-origin-when-cross-origin`.

## Children

The site does not target children and does not knowingly collect personal data from anyone, including children.

## Your choices

- Change or clear language and theme from the header, or by deleting site data.
- Do not press play if you do not want YouTube’s embed to load. Do not click the coffee button if you do not want Buy Me a Coffee’s checkout iframe to load.
- Block `localStorage` or third-party requests in the browser; the catalogue may load more slowly or titles may stay unresolved.
- Turn off personalised ads in [Google Ads Settings](https://adssettings.google.com/), or block ad domains; pages still render without them.

## Changes

Updates will be committed to this file in the [AMusic repository](https://github.com/YueyuHoshizora/AMusic). The date at the top will change.

## Contact

Questions about this policy: <yueyuhoshizora@gmail.com>  
Security issues: see [SECURITY.md](./SECURITY.md)

---

## 我們不蒐集什麼

這是**靜態網站**：沒有應用伺服器、沒有帳號。你在站上的操作不會送到我們控制的後端。

我們不蒐集姓名、電子郵件、付款資料、位置。沒有登入、電子報或留言表單，也沒有我們自己的分析腳本。本站有放 **Google AdSense**（見下節）：我們不會從中取得你的個人資料，只看得到彙總後的收益報表。

搜尋只改瀏覽器裡的 **URL 路徑**（`/search/?q=…`）。查詢字串會隨請求送到 GitHub Pages；我們不記錄，GitHub Pages 也不提供我們存取請求日誌。

每一頁會從 CDN 載入 **Buy Me a Coffee** 贊助按鈕。點下去才會打開他們的結帳 iframe。贊助由 Buy Me a Coffee 處理，不是我們。該 widget 可能在本站 origin 寫入名為 `visited` 的第一方 cookie（用來隱藏一次性提示）。見 [Buy Me a Coffee 隱私權政策](https://www.buymeacoffee.com/privacy-policy)。

## 廣告

除了 404 錯誤頁以外，每一頁都會載入 **Google AdSense**（發布商 `ca-pub-7132586781018963`）。這部分的處理由 Google 以獨立控管者身分進行。

- Google 及其合作夥伴可能在你的瀏覽器寫入或讀取 **cookie** 與類似的裝置識別碼，用於放送、衡量與最佳化廣告，並限制同一則廣告出現的頻率。
- Google 可能使用你的 **IP 位址、User-Agent、概略位置與你正在瀏覽的頁面**。若你啟用個人化廣告，還可能使用你在本站與其他網站的先前造訪紀錄。
- 我們不會把任何帳號、聯絡或付款資料交給 Google——我們根本沒有這些資料。

你可以控制：

- 到 [Google 廣告設定](https://adssettings.google.com/)（「我的廣告中心」）關閉個人化廣告。
- 到 [youradchoices.com](https://optout.aboutads.info/) 或 [youronlinechoices.eu](https://www.youronlinechoices.eu/) 管理第三方廣告供應商。
- 封鎖 cookie 或使用廣告封鎖器；沒有廣告網站照常運作。
- 細節見 [Google 如何使用來自採用我們服務的網站或應用程式的資訊](https://policies.google.com/technologies/partner-sites) 與 [Google 廣告政策](https://policies.google.com/technologies/ads)。

在歐洲經濟區、英國與瑞士，依 Google 的歐盟使用者同意政策，放送個人化廣告前會先顯示 Google 的同意聲明。你的選擇由 Google 保存，不在我們這裡。

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
| `pagead2.googlesyndication.com`、`googleads.g.doubleclick.net`、`tpc.googlesyndication.com`、`fundingchoicesmessages.google.com` | Google AdSense 腳本、廣告素材，以及（歐洲經濟區／英國／瑞士）同意聲明 | 廣告請求，含 IP、User-Agent 與頁面網址；可能寫入或讀取 cookie |

點「在 YouTube 觀看」會開新分頁到 `youtube.com`（`rel="noopener"`）。

我們拿不到上述第三方的日誌。其處理分別受 GitHub、Google／YouTube／AdSense、noembed、Buy Me a Coffee 的政策拘束。

頁面 Referrer 政策為 `strict-origin-when-cross-origin`。

## 兒童

本站不以兒童為對象，也不會故意蒐集任何人（包括兒童）的個人資料。

## 你可以怎麼做

- 在頁首切換語言與主題，或刪除網站資料。
- 若不想載入 YouTube 內嵌播放器，不要按播放。若不想載入 Buy Me a Coffee 結帳 iframe，不要點咖啡按鈕。
- 可在瀏覽器封鎖 `localStorage` 或第三方請求；目錄會變慢，標題可能無法解析。
- 到 [Google 廣告設定](https://adssettings.google.com/) 關閉個人化廣告，或封鎖廣告網域；頁面照樣顯示。

## 變更

更新會提交到 [AMusic 倉庫](https://github.com/YueyuHoshizora/AMusic) 的本檔，並改頁首日期。

## 聯絡

本政策相關問題：<yueyuhoshizora@gmail.com>  
安全弱點請見 [SECURITY.md](./SECURITY.md)
