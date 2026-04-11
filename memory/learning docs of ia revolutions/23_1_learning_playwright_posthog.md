# 23.1 — Lessons Learned: Playwright MCP + PostHog Diagnostics

## 1. Playwright `evaluate()` Is a Diagnostic Swiss Knife

Don't limit Playwright MCP to clicking buttons and filling forms. `browser_evaluate` can run arbitrary JavaScript against the live page runtime — checking globals, cookies, localStorage, the Performance API, and even fetching and scanning production JS files.

**Rule:** When debugging any third-party integration (analytics, SDKs, auth), your first move should be `browser_evaluate` with runtime checks, not clicking through the UI hoping to find the answer.

## 2. Never Trust a Single Negative Signal

`window.posthog === undefined` looked like PostHog wasn't loading. But the React provider pattern (`posthog-js/react`) doesn't expose a global. We needed 4 more layers before the real picture emerged:

1. `window.posthog` → undefined (misleading — React provider keeps it internal)
2. Cookies → `ph_phc_*` cookie found with distinct_id and session ✓
3. localStorage → PostHog persistence data present ✓
4. Performance API → `/e/` endpoint requests returning 200 ✓
5. JS chunk scan → all 6 custom event strings found in deployed bundle ✓

**Rule:** Check at least 3 independent indicators (globals, storage, network) before concluding a third-party integration is broken. Each layer either confirms or overrides the previous.

## 3. Verify the Deployed Artifact, Not the Source Code

We fetched the actual `_next/static/chunks/*.js` files served by production and searched for our custom event strings (`section_viewed`, `parent_hook_clicked`, etc.). This was the definitive proof that our code was deployed.

This matters because Next.js `NEXT_PUBLIC_*` env vars are inlined at **build time**, not runtime. If a var is missing during `docker build`, the code compiles without error but the feature silently doesn't initialize.

**Rule:** When debugging production, scan the served JavaScript — `fetch()` the chunk URLs from within `browser_evaluate` and search the text. Reading local source tells you what *should* be deployed; scanning production JS tells you what *is* deployed.

## 4. Separate Data Acquisition from Data Visualization

PostHog was capturing every event perfectly. The user's problem was that the **default PostHog dashboard** used generic `$pageview` funnel steps, which couldn't surface custom events. The fix was creating a custom funnel insight — zero code changes needed.

**Rule:** When someone says "the data isn't showing," ask two separate questions: (1) Is data being *sent*? (Performance API, network tab) (2) Am I *looking in the right place*? (default dashboards often don't show custom events). The problem is usually #2.

## 5. Snapshot + Grep > Reading the Full Tree

PostHog's accessibility snapshots are enormous (1000+ lines). Instead of reading them line by line, we saved snapshots to files and used `Grep` to find specific refs, event names, or UI elements.

**Rule:** For complex web apps, use `browser_snapshot` with `filename` param, then `Grep` on the YAML file to find what you need. This is 10x faster than parsing the full tree visually.

## 6. Performance API Reveals What Network Tab Hides

`performance.getEntriesByType('resource')` returns every network request with URL, status, timing, and initiator type — even requests that happened before you started watching. This caught PostHog event requests (`/e/`, `/s/`) that our `fetch` interceptor missed because PostHog was already initialized.

**Rule:** When you need to check if requests were made, use the Performance API rather than trying to intercept `fetch`/`XHR`. It's retroactive and catches all request types (fetch, beacon, XHR, script loads).

## 7. Analytics Data Drives Product Decisions

The PostHog Web Analytics dashboard revealed facts no amount of code reading could:

| Finding | Implication |
|---------|-------------|
| 78% mobile traffic | Optimize mobile first, not desktop |
| 54% bounce rate | Hero has ~5 seconds to hook visitors |
| 6-14s median session | Most users never scroll past hero |
| 95% from Google Ads | Zero organic traffic — SEO not working yet |
| Traffic only Fri-Sat | Ad schedule or audience behavior pattern |
| 1 rage click on `/` | Something looks clickable but isn't |

**Rule:** Instrument first, then optimize. Without `section_viewed` tracking, you're guessing where users drop off. Without device breakdowns, you might optimize for desktop when 78% are on phones.

## 8. PostHog Custom Events Need Custom Insights

PostHog's default templates and dashboards use `$pageview` and `$pageleave`. They will never surface your custom events (`game_started`, `parent_hook_clicked`, `section_viewed`) automatically. You must:

1. Create **custom funnel insights** with your specific events as steps
2. Add **filters** on event properties (e.g., `section_name = "Hero"`) to make steps specific
3. Add **breakdowns** by `$device_type`, `$initial_utm_campaign`, etc. to segment users
4. Save each insight with a descriptive name and add it to a custom dashboard

**Rule:** Default dashboards answer generic questions. Custom events answer *your* questions — but only if you build the insights to visualize them.

## 9. Useful PostHog Diagnostic Checks via `browser_evaluate`

```javascript
// Check if PostHog SDK is active (even without window.posthog)
() => ({
  cookies: document.cookie.split(';').filter(c => c.trim().startsWith('ph_')),
  localStorage: Object.keys(localStorage).filter(k => k.includes('posthog')),
  network: performance.getEntriesByType('resource')
    .filter(e => e.name.includes('posthog'))
    .map(e => ({ url: e.name.substring(0, 120), status: e.responseStatus })),
})

// Verify custom events exist in deployed JS chunks
async () => {
  const scripts = document.querySelectorAll('script[src*="_next/static/chunks"]');
  const results = {};
  for (const s of scripts) {
    const text = await (await fetch(s.src)).text();
    for (const term of ['section_viewed', 'game_started', 'parent_hook_clicked']) {
      if (text.includes(term)) results[term] = s.src.split('/').pop();
    }
  }
  return results;
}
```

**Rule:** Keep these snippets handy. They answer "is PostHog working?" in 30 seconds without touching the PostHog UI.
