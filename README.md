<p align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="Insta Unfollow Checker">
</p>

<h1 align="center">Insta Unfollow Checker</h1>

<p align="center">
  Instagram에서 맞팔하지 않는 사람을 찾아 언팔로우하는 Chrome Extension
  <br>
  <em>Find Instagram users who don't follow you back</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-34A853" alt="Manifest V3">
  <img src="https://img.shields.io/badge/version-3.1.1-cc2366" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

---

## Features

| Category | Features |
|----------|----------|
| **Analysis** | Following/Follower comparison, Non-follower detection, Mutual follows tab |
| **Unfollow** | One-click unfollow, Batch unfollow, Scheduled unfollow (3-5 min intervals) |
| **Statistics** | Trend charts, Follower change tracking, Snapshot comparison, Ratio health indicator |
| **Data** | Whitelist, User memos & tags, CSV export, JSON backup/restore |
| **UI/UX** | Dark mode, Korean/English, Virtual scroll, Keyboard shortcuts, Search & filter |
| **Automation** | 24h auto-analysis via `chrome.alarms`, Badge notifications |

## Installation

```
1. chrome://extensions 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. 이 폴더 선택
```

## Tech Stack

- **JavaScript** — Vanilla JS, no build tools
- **Chrome Extension Manifest V3**
- **Google OAuth 2.0** — `chrome.identity` + Sheets API
- **No backend** — Instagram web session 직접 활용

## Project Structure

```
├── manifest.json             # Extension config (Manifest V3)
├── _locales/
│   ├── ko/messages.json      # 한국어
│   └── en/messages.json      # English
├── background/
│   └── service-worker.js     # Instagram API, auto-analysis, Google OAuth
├── popup/
│   ├── popup.html            # Launcher (opens new tab)
│   └── popup.js
├── tab/
│   ├── tab.html              # Main UI
│   ├── tab.css               # CSS variable theme system
│   └── tab.js                # Core logic
├── icons/                    # 16/48/128px icons
└── docs/                     # Store assets, privacy policy
```

## Privacy

모든 데이터는 브라우저 로컬에만 저장됩니다. 외부 서버로 전송하지 않습니다.

All data is stored locally in your browser. No external server is involved.

See [Privacy Policy](docs/privacy-policy.html) for details.

## License

MIT
