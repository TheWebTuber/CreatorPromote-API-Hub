# Phase 1 validation and change record

Date: 14 November 2026. Status: local Hub preparation complete; awaiting review. No creator website, unrelated project, Git branch/remote, secret, DNS setting or deployed artifact was changed. No commit, push, workflow dispatch or deployment occurred. The production updater was not run with a real YouTube key.

## Exact changed/new files

Modified:
- README.md — links to the audit/client/identity/test documentation; candidate verification instructions; warns historical patches are not ready to copy.
- config/channels.json — preserves four enabled creators; pins their IDs to existing public feeds; TheDocRot latestCount 60; Crew scanPages 8; Daddy scanPages 3; prepares five disabled/unverified candidates, with Duffball optional playlists and five scan pages, Crystal four pages, Blackjack/Salahare three.
- scripts/hub.mjs — independent section retention, complete bounded catalog, extra video metadata and branding, optional public playlists, per-source collaboration retention, timestamped freshness, safe errors and response validation, unverified-channel guard.
- scripts/update.mjs — exported testable runner; atomic JSON replacement; fixed-origin last-good bootstrap; refusal to write a partial endpoint set; safe outage handling and concise credential-free logs. No deployment code was added.
- tests/hub.test.mjs — retained all six original tests; updated the inventory assertion for nine configured entries and four enabled entries.

Added:
- public/js/creatorpromote-hub.js — dependency-free ES module client, cache/fallback/deduplication/validation, live freshness projection and subscription expiry.
- public/CNAME — records api.creatorpromote.com; informational for this custom Actions deployment, not a substitute for Pages settings.
- tests/resilience.test.mjs — feed, failure, cache, privacy-of-errors, identity guard and client regression tests.
- tests/update.test.mjs — disk-backed updater integration tests using temporary directories inside this repository, cleaned after tests.
- START-HERE.md — test/use instructions, activation gate and custom-domain verification limitations.
- docs/workspace-audit-and-migration.md — complete inventory, directory map, integrations, maintenance findings, staged migration and deployment plan.
- docs/channel-identities.md — evidence and unresolved identity status for all five candidates.
- docs/client-and-schema.md — additive version-1 contract, client usage, freshness/caching rules, retention semantics and quota estimate.
- docs/phase-1-validation.md — this record.

Unchanged: .github/workflows/update-youtube.yml, package.json, historical site-patches, current public/index.html, and every creator website. No packages were installed.

## Executed tests

Command: node --test tests/*.test.mjs (equivalent to the existing npm test script).
Result: 33 tests passed, 0 failed: the original six plus 27 new tests.

Coverage includes legacy contract fields; duration/catalog/branding/playlists; bounded pagination and ID deduplication; independent channel/video failures; missing statistics; playlist and per-source collaboration preservation; repeated legacy-cache failures; empty success versus malformed responses; channel mismatch and activation guard; upstream error redaction; invalid/future timestamps; raw and normalized LIVE suppression; cache request deduplication; HTTP/malformed/wrong-creator fallback; blocked storage; request timeout; older-deployment rejection; subscription expiry without a new download; complete updater outages; bootstrap; missing endpoints; and target rejection.

One test initially exposed loss of legacy unattributed collaborations on repeated partial failure. The fix retains legacyCollabs until sources recover; the regression test now exercises consecutive failed refreshes.

All 13 Hub JavaScript/ESM files passed node --check, including the untouched historical patch examples. Git diff --check passed; Git reports only line-ending normalization notices, not whitespace errors. No temporary test directories remained.

## Real public integration checks (read-only)

The new client loaded all four existing public endpoints over HTTPS and validated their existing version-1 responses. HTTP 200 and Access-Control-Allow-Origin: * were confirmed for every endpoint:

| Endpoint | Channel ID | Observed updatedAt UTC |
|---|---|---|
| /data/thedocrot.json | UCiXeV-jUw_yCqScuZGopvVQ | 2026-11-14T08:02:10.527Z |
| /data/dreamdropscrew.json | UCuK6uJXgGlJd4TLNjTwtluA | 2026-11-14T08:02:11.817Z |
| /data/daddydepresso.json | UCKP2iEDv2W4ptqNObi7rSzQ | 2026-11-14T08:02:12.807Z |
| /data/bonakvt.json | UCKE1MnwHQBM8i7Or5K_zcmA | 2026-11-14T08:02:14.232Z |

The public /data/index.json also returned HTTP 200. safeFeed applied at 46 minutes after each observation returned live:null. These tests used the currently deployed OLD JSON, not a deployment of the new updater. Mock tests cover the new updater output. No claim is made that the updated server-side YouTube request path has run against the real YouTube API.

## Domain verification

Resolve-DnsName confirmed api.creatorpromote.com CNAME -> thewebtuber.github.io. HTTPS feed access and CORS passed. The unauthenticated GitHub Pages-settings request returned 404; account-level custom domain, HTTPS enforcement, scheduling and deployment settings were not authenticated or changed. GitHub documentation states that custom Actions deployments ignore CNAME files for configuration: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site. Verify the repository Pages setting before a later approved deployment. Current domain functionality remains unaffected because no deployment occurred.

## Remaining risks and gates

- All five additional creators remain disabled and identityVerified:false. YouTube consent/generic pages prevented independent canonical-ID verification; local IDs are candidates, not confirmed identities. Verification and activation require a later explicit step.
- Static feeds describe observations, not instantaneous live state. Existing websites remain unchanged and do not gain freshness safety until migrated. No broadcast discovery method guarantees all broadcasts appear among recent public uploads.
- Freshness checks depend on a reasonably accurate client clock. Background suspension can delay timers; the subscription rechecks when visibility changes.
- Expanded scans raise centralized request counts; the estimate is documented but actual account quota usage was not measured.
- Tests run in Node, not a browser. DOM rendering, mobile responsiveness, CSP/import behavior, navigation and real website adapters require Phase 2 testing.
- Bootstrap depends on reachable, valid public cached feeds if local public/data is absent. The updater fails before output publication if any enabled feed lacks valid data.
- Per-file atomic replacement does not make the entire directory transactional. A disk failure prevents workflow deployment but may leave some locally replaced files.
- Historical patches remain unchanged and should not be copied as-is. No website API key was removed or rotated in this phase.

## Next approval

Phase 2 should migrate TheDocRot first, locally, preserving all features and appearance. Proposed changes are limited to its js/app.js, js/youtube-config.js, index.html and a vendored shared client, with independent browser/failure tests. Do not begin without user approval; do not deploy either project without separate deployment approval.
