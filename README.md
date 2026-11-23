# Web Version Notifier

[![CI](https://github.com/cy-osp/web-version-notifier/actions/workflows/ci.yml/badge.svg)](https://github.com/cy-osp/web-version-notifier/actions/workflows/ci.yml)

Detect when your web app has a new version deployed and notify users to refresh the page — with zero dependencies.

**Web Version Notifier** is a tiny (less than 2 KB), dependency-free JavaScript class for single-page applications (SPA) and multi-page sites. It polls a version endpoint (or any HTML/JSON resource), extracts the current version with a regex, and fires a callback whenever the deployed version changes. Detection runs only when the tab becomes **visible** again (via the `visibilitychange` event), so it never wastes requests while the user is away.

A typical use case: after you deploy a new build, users who keep the old tab open get a "🎉 A new version is available — refresh to update" prompt instead of silently running stale code.

## Features

- ✅ **Zero dependencies** — pure ES6 class, copy & paste into any project (Vue / React / Angular / plain JS)
- ✅ **Regex-based version extraction** — extract a version number, build hash, or any token from the response
- ✅ **Visibility-aware polling** — checks on `visibilitychange`, no timers, no background requests
- ✅ **Cache-busting** — requests use `cache: 'no-store'` + a timestamp query so you always get fresh content
- ✅ **Automatic cleanup** — call `destroy()` to remove the listener

## Install

```bash
npm install web-version-notifier
```

Or copy `index.js` into your project — it has no runtime dependencies:

```javascript
import VersionChecker from 'web-version-notifier';
```

## Usage

```javascript
const checker = new VersionChecker(
  'https://example.com/version.html',   // URL to fetch
  /version:\s*(\d+\.\d+\.\d+)/,         // regex to extract the version (optional)
  () => {                               // called when the version changes
    alert('A new version is available. Please refresh the page.');
  }
);

// stop checking
checker.destroy();
```

### Constructor parameters

| Parameter  | Type              | Description                                                                 |
| ---------- | ----------------- | --------------------------------------------------------------------------- |
| `htmlUrl`  | `string`          | The URL to check for changes (HTML, text, JSON — anything `fetch` can read). |
| `reg`      | `RegExp` (optional) | A regex with one capture group, used to extract the version/build hash from the response. If omitted, the entire response body is compared. |
| `callback` | `function`        | Invoked when the extracted content differs from the last check. Receives the new value as its first argument. |

## Development

```bash
npm install
npm test        # runs vitest (jsdom)
```

CI runs the test suite on Node 18 & 20 for every push via GitHub Actions.

## How it works

1. On construction, the URL is fetched once and the (optionally regex-extracted) content is stored as the baseline.
2. A `visibilitychange` listener is attached.
3. Whenever the page becomes visible again, the URL is re-fetched (with cache busting).
4. If the new content differs from the baseline, your callback fires and the baseline is updated.

## Notes

- Ensure the URL is CORS-accessible from your app's origin.
- Errors during fetch are logged to the console and treated as "no change".
- Detection happens only on tab visibility changes — add your own polling loop on top if you also want periodic checks while the tab is focused.

## License

[MIT](./LICENSE) © 2026 yixiaocao33
