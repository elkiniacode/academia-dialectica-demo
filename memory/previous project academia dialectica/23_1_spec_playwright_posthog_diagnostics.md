# SPEC-23.1 — Third-Party Integration Diagnostics

**Status:** Approved  
**Author:** Elkin / Claude  
**Date:** 2026-04-11  
**Applies to:** Any third-party client-side integration (PostHog, Google Analytics, SDKs, auth providers)

---

## 1. Purpose

Define a repeatable diagnostic protocol for verifying that client-side third-party integrations are working correctly in production. This spec addresses the common scenario where a developer says "it's not working" but the root cause is ambiguous — the integration may have failed to load, failed to send data, or be sending data that the developer is looking for in the wrong place.

## 2. Scope

- Client-side JavaScript SDKs loaded via React providers or script tags
- Next.js applications with `NEXT_PUBLIC_*` environment variables inlined at build time
- Docker-based deployments where build-time and runtime environments differ

## 3. Definitions

| Term | Definition |
|------|-----------|
| **Data acquisition** | The process of capturing and transmitting events from the browser to the analytics backend |
| **Data visualization** | The process of querying and displaying captured events in a dashboard or insight |
| **Deployed artifact** | The actual JavaScript files served by the production web server |
| **Diagnostic signal** | An observable indicator (cookie, network request, localStorage entry) that confirms or denies the presence of a running integration |

## 4. Requirements

### 4.1 Multi-Layer Verification

When diagnosing whether a third-party integration is operational, the developer **SHALL** check at least 3 of the following 5 independent diagnostic signals before concluding the integration is broken:

| # | Signal | How to check | Positive indicator |
|---|--------|-------------|-------------------|
| 1 | Global variable | `typeof window.<sdk>` | Returns `"object"` or `"function"` |
| 2 | Cookies | `document.cookie` filtered by SDK prefix | Cookie exists with session/user ID |
| 3 | Local storage | `Object.keys(localStorage)` filtered by SDK prefix | Persistence entry exists |
| 4 | Network requests | `performance.getEntriesByType('resource')` filtered by SDK domain | Event endpoint returns status 200 |
| 5 | JS bundle content | Fetch production chunk files and search for expected strings | Event names found in served JavaScript |

**Rationale:** A single negative signal can be misleading. React provider patterns often do not expose SDK instances as globals (`window.posthog === undefined` does not mean PostHog is not running). The Performance API is retroactive and catches requests made before monitoring began.

### 4.2 Acquisition vs. Visualization Separation

When a user reports "the data isn't showing," the developer **SHALL** diagnose these two layers independently:

1. **Acquisition check:** Are events being transmitted from the browser to the backend? (Verify via network requests to the SDK's event endpoint — e.g., `us.i.posthog.com/e/`)
2. **Visualization check:** Is the dashboard or insight configured to display the relevant events? (Default dashboards use generic events like `$pageview`; custom events require custom insights)

The developer **SHALL NOT** modify application code until both layers have been evaluated.

**Rationale:** In the observed incident, PostHog was capturing all events correctly. The user saw no data because the default PostHog dashboard uses `$pageview` funnels, which do not surface custom events. The fix was creating a custom funnel insight — zero code changes required.

### 4.3 Deployed Artifact Verification

Before concluding that a feature is missing from production, the developer **SHALL** verify the deployed JavaScript artifact rather than relying on local source code inspection.

**Method:**
1. Extract chunk URLs from the production HTML (`_next/static/chunks/*.js`)
2. Fetch each chunk and search for expected strings (event names, API keys, feature flags)
3. Confirm the expected strings are present in the served files

**Rationale:** In Next.js with Docker, `NEXT_PUBLIC_*` environment variables are inlined at build time. If a variable is absent during `docker build`, the code compiles without error but the feature silently fails to initialize. Local source code shows what *should* be deployed; production chunks show what *is* deployed.

### 4.4 Custom Event Lifecycle

For any custom analytics event added to the application, the developer **SHALL** verify the following lifecycle before marking the feature as complete:

| Stage | Verification |
|-------|-------------|
| 1. Code exists | Event string present in source code (`lib/analytics.ts`) |
| 2. Build includes it | Event string present in production JS chunks |
| 3. SDK is initialized | Cookies/localStorage/network confirm SDK is running |
| 4. Event is transmitted | Network request to event endpoint returns 200 after trigger action |
| 5. Event is queryable | Event appears in the analytics backend's event explorer (e.g., PostHog Activity → Explore) |
| 6. Event is visualized | A saved insight or dashboard displays the event data |

An event that passes stages 1–5 but fails stage 6 is a **visualization problem**, not a code problem.

## 5. Diagnostic Tools

### 5.1 Playwright MCP `browser_evaluate`

The primary diagnostic tool for runtime checks. Use for:
- Checking globals, cookies, localStorage
- Querying the Performance API for network activity
- Fetching and scanning production JS chunks
- Running arbitrary JavaScript against the live page

### 5.2 Performance API

```javascript
performance.getEntriesByType('resource')
  .filter(e => e.name.includes('<sdk-domain>'))
  .map(e => ({ url: e.name, status: e.responseStatus, type: e.initiatorType }))
```

Advantages over fetch/XHR interception:
- Retroactive — captures requests made before monitoring started
- Covers all request types (fetch, beacon, XHR, script loads)
- No need to patch globals

### 5.3 Production JS Chunk Scanning

```javascript
async () => {
  const scripts = document.querySelectorAll('script[src*="_next/static/chunks"]');
  const results = {};
  for (const s of scripts) {
    const text = await (await fetch(s.src)).text();
    for (const term of ['event_name_1', 'event_name_2']) {
      if (text.includes(term)) results[term] = s.src.split('/').pop();
    }
  }
  return results;
}
```

### 5.4 Snapshot + Grep Pattern

For complex web UIs (e.g., PostHog dashboards):
1. `browser_snapshot` with `filename` parameter to save the accessibility tree as YAML
2. `Grep` on the YAML file to locate specific elements, event names, or refs
3. This is faster than reading 1000+ line accessibility trees line by line

## 6. PostHog-Specific Checklist

| Check | Command / Location |
|-------|-------------------|
| SDK loaded | Look for `us-assets.i.posthog.com/array/{key}/config.js` in network |
| Cookie set | `document.cookie` → `ph_phc_*` cookie with `distinct_id` |
| Events sent | `performance.getEntriesByType('resource')` → `us.i.posthog.com/e/` returning 200 |
| Key inlined | PostHog key visible in config.js URL or in JS chunk content |
| Custom events in build | Fetch chunks, search for event name strings |
| Custom events queryable | PostHog → Activity → Explore → filter by event name |
| Insights configured | Custom funnel or trend insight saved with the correct event steps and filters |
| UTM params flowing | Breakdown by `$initial_utm_campaign` shows campaign names (requires Google Ads Final URL suffix) |

## 7. Anti-Patterns

| Anti-pattern | Correct approach |
|-------------|-----------------|
| Concluding integration is broken from one failed check | Check 3+ independent signals |
| Modifying code before verifying data pipeline | Run acquisition check first |
| Trusting local source as proof of deployment | Scan production JS chunks |
| Searching default dashboards for custom events | Create custom insights with specific event steps |
| Intercepting `fetch` to monitor SDK traffic | Use Performance API (retroactive, covers all types) |
| Reading full accessibility tree manually | Save snapshot to file, Grep for what you need |

## 8. Acceptance Criteria

A third-party integration diagnostic is considered **complete** when:

- [ ] At least 3 of the 5 diagnostic signals have been checked
- [ ] Data acquisition and data visualization have been evaluated independently
- [ ] The deployed artifact has been verified (not just local source)
- [ ] The root cause has been identified as either acquisition failure, visualization misconfiguration, or deployment issue
- [ ] If visualization: a custom insight has been created and saved
- [ ] If acquisition: the code fix has been deployed and verified via chunk scan + event explorer
