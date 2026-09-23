# Security Policy

Traditional Chinese follows the English text.

## Supported versions

Only the `main` branch is deployed (GitHub Pages: <https://a-music.app/>). There are no versioned releases. Please test against current `main`.

## Reporting a vulnerability

**Do not open a public issue** for an unfixed vulnerability.

Preferred: GitHub private vulnerability reporting on this repository  
(Security → Report a vulnerability).

Alternatively email [yueyuhoshizora@gmail.com](mailto:yueyuhoshizora@gmail.com) with:

- affected URL or file
- what you expected vs what happened
- steps to reproduce (a minimal URL is enough; no exploit chain required)
- your browser and a short impact assessment

You should get an acknowledgement within **7 days**. If we confirm the report, we will discuss a fix on `main` and credit you if you want it. Please give us time to ship the fix before public disclosure.

Good-faith research on this site is welcome. Do not:

- attack GitHub, YouTube, noembed, or other third-party services
- attempt to take over the TrackRadar upstream repo as a “demo”
- include personal data of visitors (this site does not collect any)

## Scope

In scope — anything that lets an attacker run script in a visitor’s browser, navigate them somewhere unexpected, or poison `localStorage` via this origin:

- XSS (including via TrackRadar JSON or oEmbed titles)
- open redirects / `javascript:` URLs
- CSP bypass
- injecting a third-party script or unexpected iframe origin
- secrets or credentials committed to this repo (there should be none)

Out of scope:

- whether a YouTube video is “really” that artist’s work
- YouTube, GitHub Pages, or the upstream data host `data.a-music.app` themselves
- clickjacking (see below)
- availability of upstream JSON or oEmbed endpoints
- self-XSS that requires the visitor to paste into DevTools

## What this site is

A static site: no backend, no accounts, no cookies, no API keys. All UI strings go through i18n; untrusted data is treated as text. Identifiers used in URLs (`videoId`, `channelId`, image URLs) are allow-listed in `js/api.js` before concatenation. Players load only from `https://www.youtube-nocookie.com/embed/<id>`.

Untrusted inputs we already assume an attacker can control:

1. TrackRadar JSON served from `data.a-music.app` (`channels.json`, `latest-videos.json`, `genres.json`, `data/<channelId>.json`)
2. the URL path and query string (`/search/?q=`, `/artist/<id>/`, `/genre/<slug>/`, `?lang=`)
3. YouTube oEmbed / noembed `title` fields

A report that “the title text is attacker-controlled” is expected; it is a vulnerability only if that text executes as HTML/JS or becomes a URL/iframe source.

## Known accepted risks

Please do not report these as new issues unless you have a way to escalate them:

| Risk | Why it stays |
| --- | --- |
| No `frame-ancestors` / `X-Frame-Options` (the site can be iframed) | GitHub Pages cannot set those headers; `<meta>` is ignored by browsers. There is no login or state-changing action to hijack. |
| Compromised TrackRadar repo can supply arbitrary titles and YouTube IDs | Titles render as text; iframes are restricted by CSP `frame-src` to youtube-nocookie. |
| Fallback oEmbed via `noembed.com` sees the queried `videoId` | Used only if YouTube oEmbed fails; payload is the video id, no personal data. |
| CSP `style-src 'unsafe-inline'` | Required for progress-bar width. Untrusted data is never written to `style`. |
| AdSense telemetry (`sodar`/`adtrafficquality.google`) occasionally hits the CSP allowlist | Google only officially supports nonce-based strict CSP for AdSense, which a static GitHub Pages `<meta>` CSP cannot generate per-request; ad serving itself (`adsbygoogle.js`, `pagead2.googlesyndication.com`) is allow-listed and works, only ancillary telemetry beacons are occasionally blocked. |

Engineering notes for people changing this code live in [`CLAUDE.md`](./CLAUDE.md).

---

## 支援版本

只有 `main` 會部署到 GitHub Pages（<https://a-music.app/>），沒有版號發行。請以當前 `main` 為準。

## 如何回報弱點

**未修復的弱點請不要開公開 issue。**

優先使用本 repo 的 GitHub 非公開弱點回報（Security → Report a vulnerability）。

或寄信至 [yueyuhoshizora@gmail.com](mailto:yueyuhoshizora@gmail.com)，請附：

- 受影響的網址或檔案
- 預期行為與實際行為
- 重現步驟（一個最小的網址即可，不需要完整 exploit）
- 瀏覽器與簡短影響評估

我們會在 **7 天內**回覆是否收到。確認後會在 `main` 修復；若你願意，修復時會署名致謝。請等到修復上線再公開細節。

善意研究歡迎。請不要：

- 對 GitHub、YouTube、noembed 等第三方做攻擊性測試
- 用「示範」為由嘗試接管上游 TrackRadar
- 蒐集訪客個資（本站本來就不蒐集）

## 範圍

**算弱點**：能在訪客瀏覽器執行腳本、把人導向非預期位址、或污染本站 origin 的 `localStorage`。例如 XSS（含經 TrackRadar JSON 或 oEmbed 標題）、開放重導／`javascript:` URL、CSP 繞過、插入第三方 script 或非預期 iframe 來源、repo 裡出現憑證（不應存在）。

**不算**：影片是不是該音樂人本人作品；YouTube／GitHub Pages／上游資料主機 `data.a-music.app` 本身；點擊劫持（見下表）；上游 JSON 或 oEmbed 的可用性；需要使用者自己在 DevTools 貼上的 self-XSS。

本站是純靜態站：無後端、無帳號、無 cookie、無 API key。不可信輸入包括 `data.a-music.app` 上的 TrackRadar JSON、網址路徑與查詢字串（`/search/?q=`、`/artist/<id>/`、`/genre/<slug>/`、`?lang=`），以及 YouTube oEmbed／noembed 標題，一律當純文字；寫進 URL 的識別碼先經 `js/api.js` 白名單；播放器只從 `youtube-nocookie` 載入。

「標題文字可被攻擊者控制」本身不是弱點——只有當它被當成 HTML／JS 執行，或變成 URL／iframe 來源時才是。

## 已知並接受的風險

除非你能把它升級成實際執行或重導，否則請勿當新弱點回報：點擊劫持（GitHub Pages 無法設防 iframe 的 header）；上游 repo 被接管後仍只能注入純文字標題與 YouTube 影片 ID；YouTube oEmbed 失敗時才會打 `noembed.com`（僅送 videoId）；CSP 允許 inline style（進度條寬度，不可信資料不會寫入 `style`）。

改程式時的工程約束見 [`CLAUDE.md`](./CLAUDE.md)。
