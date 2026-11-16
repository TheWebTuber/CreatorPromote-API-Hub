# CreatorPromote Phase 3 — local migration report

Date: 16 November 2026. No commits, pushes, deployments, new enabled feeds, paid services or unrelated project edits.

## Repository inventory and outcome

| Repository inspected | Outcome |
|---|---|
| dreamdropscrew | Migrated locally; published Hub feed works. |
| daddydepresso | Migrated locally; published Hub feed works. |
| portalmasterofgames-website | Prepared and fixture-tested; verified ID, missing published feed blocks deployment. |
| duffball16 | Content, stats and ESP workflow prepared/tested; verified ID, missing feed blocks deployment. |
| CreatorPromote | Nested portalmasterofgames live page prepared/tested; same missing feed. Nested bonak, blackjack, dreamdropscrew, thedocrot and Gamin Thunder pages have no direct YouTube Data API integration requiring migration. Directory and Minecraft status functionality untouched. |
| bonakvt | No change required: static links/profile; existing Hub feed is already available. |
| thedocrot | Read-only reference; deployed migration unchanged. |
| crystalsdreamdrops | Blocked by missing verified channel ID and feed. Includes a separate avatar fetch on the emotes page; both integrations must be migrated together. |
| blackjacksetzer | Blocked by missing verified channel ID and feed. |
| salahare | Blocked by missing verified channel ID and feed. |
| CreatorPromote-API-Hub | Verified two disabled identities, corrected Duffball playlist coverage, added tests and documentation. |
| orbitfx | Classified as unrelated tooling; excluded and unchanged. |
| studyboop | Classified as school/unrelated repository; excluded and unchanged. |

## Before / after

The migrated browser scripts previously used public keys and per-visitor YouTube channels/videos/playlist requests; the statistics pages also polled search. They now load an unchanged local copy of the shared Hub client and fetch their pinned creator JSON from https://api.creatorpromote.com. Credentials and browser YouTube Data API URLs were removed from those working trees.

Existing cards, styling, themes, navigation, assets, emotes and animations remain. No CSS or emote manifest was edited. All HTML is unchanged except one Duffball loading-status sentence that no longer asks for an API key. Rendering helpers and milestone thresholds were compared with Git HEAD. Dream's six streams, Daddy's four collaboration/three personal cards and featured fallbacks, and Duffball's video/playlist categories remain. Stats use feed observation times; missing/stale live data says unavailable or no stream detected rather than claiming offline.

The five prepared site locations each include the unchanged shared client, a small identity/lifecycle adapter, independent fixtures/tests and their own migration notes. There are no new website runtime dependencies. Successful cached snapshots survive outages, malformed responses and wrong-channel responses. LIVE expires independently of HTTP refreshes and is reevaluated after page restore. A failed forced refresh retains the cached-results notice.

## Public feed checks

All four existing endpoints (thedocrot, dreamdropscrew, daddydepresso, bonakvt) returned HTTP 200 and valid JSON with the previously pinned channel IDs. The Dream endpoint also returned Access-Control-Allow-Origin: * and application/json when rechecked. The deployed schema now includes catalog/section freshness fields. Dream exposed 400 catalog items and six livestreams; Daddy exposed 48 catalog items, three personal streams and four collaborations at the checked snapshot. Site tests use captured public snapshots and older-v1 variants.

duffball16, portalmasterofgames, crystalsdreamdrops, blackjacksetzer and salahare endpoints returned HTTP 404. Synthetic fixtures for the two verified candidates do not imply deployed feed availability. Test fixtures are not referenced by production website code.

## Hub changes and compatibility

Only Duffball16 and PMOG identityVerified flags changed to true; both enabled flags remain false. Their IDs were confirmed by YouTube RSS plus video oEmbed author-handle matching; see [verification evidence](phase-3-channel-verification.md). No ID was invented and no browser key was used.

The separate compatibility adjustment is Duffball16 playlistPages:3. Its old website scans up to three public playlist pages (150 playlists); the Hub default of two would have reduced coverage. Upload scanPages:5 remains unchanged. A new generator test verifies 250 catalog items, 150 playlists and 14 list calls with no search. The four active configurations, shared client code, JSON schema, generated feeds, domain and deployment workflow are unchanged.

## Test results

| Check | Result |
|---|---|
| Existing Hub tests plus two Phase 3 tests | 35/35 pass |
| Dream Drops Crew | 8/8 pass |
| Daddy Depresso | 8/8 pass |
| PMOG standalone | 8/8 pass |
| PMOG nested | 8/8 pass |
| Duffball content/client/ESP | 13/13 pass |
| Total automated repository tests | 80/80 pass |
| JavaScript syntax across 11 relevant repositories | 109 files, zero failures |
| DOM scenarios across five locations plus Duffball stats | 23 scenarios pass |
| Browser key/direct YouTube Data API scan in migrated working trees | Zero matches |
| Shared client copy integrity | Identical SHA-256 across five copies and Hub |
| Original-source comparison | Layout/styles/assets/emotes unchanged; core UI helpers and milestone thresholds preserved |

Repository tests cover correct slug/identity and URL, published or proposed schema, older-v1 compatibility, memory/persistent fallback, malformed and wrong-channel data, cold HTTP errors, empty and partial sections, LIVE expiry, manual refresh and page lifecycle. Duffball tests additionally cover public video classification, scheduled streams, stale broadcasts, public/nonempty playlist grouping, and ESP outage behavior. Hub tests verify original endpoints remain enabled and new channels stay disabled.

DOM checks executed actual page scripts against the page HTML using LinkeDOM 0.18.12 as a workspace-only QA dependency. They exercised Dream themes, mobile-menu state, character previous/next controls and welcome slider; Daddy menus, card flip, email-copy callback and refresh; Duffball menu/refresh/content; PMOG and Duffball counters/goals/clock and stale live labels. Requests were intercepted and verified against the exact expected Hub URL. Normal, empty, offline and wrong-channel paths were tested. Real mail, social links, form submissions and deployments were not triggered.

Run repository suites with node --test tests/*.test.mjs from each repository (for the nested PMOG page, from CreatorPromote/portalmasterofgames). The workspace QA harness is C:/Users/amste/Documents/Codex/2026-11-14/bt/work/dom-qa.mjs; invoke with node --experimental-vm-modules followed by that path and the repository name. Add --mode=offline, --mode=wrong or --mode=empty; Duffball --stats selects community statistics. Source comparison is work/regression-check.cjs in the same workspace.

## Limits and remaining problems

- Desktop/mobile visual rendering, real-browser CORS/module loading, animation smoothness and external video playback remain unverified in this phase. Headless Brave and Edge processes could not launch. The computer-use helper then stopped because it could not confidently determine the browser URL; UI automation stopped at that point. DOM tests are not screenshots or a rendering-engine substitute.
- Dream's HTML already references missing js/index.js. Its existing welcome fallback works and is preserved, but the legacy curated video sliders are already empty. This migration did not remove or repair that unrelated source file.
- Daddy's captured feed has four collaborations and no playlist issues. Partial/unavailable playlist and featured-session handling is retained for future failures; private/deleted upstream videos cannot be restored by the site.
- The three unverified sites are deliberately unchanged, including their existing browser API integrations and exposed credentials. Their migration cannot be called complete. After their canonical IDs are verified, prepare/approve their feeds before switching the sites. Deployed copies and Git history of all previous browser keys are untouched; removing local keys does not revoke them.
- Duffball's <=180-second Shorts classification is preserved as an approximation. Catalog and playlist scans remain capped at 250/150. A feed without catalog gets a limited raw-v1 fallback and an explicit coverage notice.
- The Hub checks recent uploads every 30 minutes, not real-time global live search. No detected stream means unknown, and LIVE observations expire after 45 minutes. Counts can be cached and are labelled with observation time.
- ESP keeps its five existing field names and number/string types. New unknown/not-detected status strings need testing on the actual hardware if it compares exact text. live/esp.json was not changed; its scheduled publishing step was not run. Existing schedules only change after an approved future deployment.
- Statistics depend on the data YouTube makes public. Hidden counts display unavailable. Cached values and thumbnails can be old during a prolonged outage.

## Quota

Current activation increase: zero, because no new channel is enabled. At the existing 48 scheduled runs/day, enabling PMOG would add at most 5 units/run (240/day); Duffball at most 14/run (672/day), for 912/day combined. The four existing feeds have a conservative full-scan upper bound of 43/run (2,064/day, including all Daddy playlist checks and optional featured lookup); with the two candidates the bound is 62/run (2,976/day). Retries, manual runs and other applications sharing the project are extra. Website JSON reads consume no YouTube API quota.

These estimates use channels.list, playlistItems.list, playlists.list and videos.list at one unit per request. Current [Google quota documentation](https://developers.google.com/youtube/data/determine_quota_cost), checked 16 November 2026 (page updated 12 November), describes a separate default bucket of 100 search.list calls/day and 10,000 daily units for other methods. Earlier project comments/audits describing search as 100 units per call are historical and should not be used as the current budget. The old Duffball five-minute ESP schedule attempted up to 288 search calls/day; the prepared workflow uses zero YouTube requests and no credentials. No search method was introduced.

## Recommended deployment order — approval required

1. Finish desktop/mobile browser acceptance for Dream Drops Crew, then approve and deploy that site alone. Verify module MIME/CORS, six cards, theme/menu/sliders, refresh behavior and no direct API requests.
2. Repeat for Daddy Depresso; confirm available collaborations, personal streams and featured/partial notices.
3. Separately approve enabling PMOG in the Hub. Generate and inspect its real feed, confirm the four existing endpoints remain healthy, then publish the Hub. Only after /data/portalmasterofgames.json returns valid HTTP 200 data, accept/deploy standalone PMOG, then the older nested copy if still intended to be served.
4. Separately approve Duffball16's Hub feed, including catalog and three playlist pages. Verify real counts/categories/playlists and existing feed compatibility. Then accept/deploy Duffball's site and ESP workflow, checking the hardware status contract.
5. Obtain canonical channel IDs for Blackjack Setzer, Crystals Dream Drops and SalaHare. Verify each identity and feed before preparing and approving its site migration. Do not enable guessed handles or IDs.

Dream and Daddy are locally code-ready against existing feeds, subject to browser acceptance and deployment approval. PMOG and Duffball are prepared but blocked for deployment by missing feeds. Phase 3 is therefore partially complete; all currently verifiable migrations are prepared, and three creator migrations await identity information. Nothing has been deployed.

## Exact changed files

### CreatorPromote-API-Hub

- config/channels.json
- docs/phase-3-channel-verification.md
- docs/phase-3-migration-report.md
- tests/phase3.test.mjs

### dreamdropscrew

- docs/api-hub-migration.md
- js/creatorpromote-hub.js
- js/hub-feed.mjs
- js/site.js
- js/youtube-config.js
- tests/fixtures/published.json
- tests/hub.test.mjs

### daddydepresso

- docs/api-hub-migration.md
- js/creatorpromote-hub.js
- js/hub-feed.mjs
- js/youtube-config.js
- js/youtube.js
- tests/fixtures/published.json
- tests/hub.test.mjs

### portalmasterofgames-website

- docs/api-hub-migration.md
- js/creatorpromote-hub.js
- js/hub-feed.mjs
- js/live.js
- tests/fixtures/proposed.json
- tests/hub.test.mjs

### duffball16

- .github/workflows/update-esp-live.yml
- content.html
- docs/api-hub-migration.md
- js/content-model.mjs
- js/content-youtube.js
- js/creatorpromote-hub.js
- js/hub-feed.mjs
- js/live.js
- js/youtube-config.js
- scripts/update-esp.mjs
- tests/content.test.mjs
- tests/fixtures/proposed.json
- tests/hub.test.mjs

### CreatorPromote

- portalmasterofgames/docs/api-hub-migration.md
- portalmasterofgames/js/creatorpromote-hub.js
- portalmasterofgames/js/hub-feed.mjs
- portalmasterofgames/js/live.js
- portalmasterofgames/tests/fixtures/proposed.json
- portalmasterofgames/tests/hub.test.mjs

