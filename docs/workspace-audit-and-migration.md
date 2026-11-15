# Complete workspace audit and staged migration report

Audit date: 14 November 2026. Workspace: C:\Users\amste\Documents\GitHub.
Phase 1 approval: modify only CreatorPromote-API-Hub; no creator website changes, commit, push or deployment. Initial audit was read-only. This document consolidates that audit and the approved Hub preparation. Secrets, private datasets and Git object history were not inspected. Browser-key values were redacted before displaying source findings.

## 1. Inventory

Paths are relative to the workspace above. All 13 top-level folders contain independent .git directories; no additional nested Git repositories were found. All observed HEAD files identify main. Initial Git status was permission-blocked; with Hub write access, its pre-edit status was clean. Other repositories' working-tree cleanliness is not asserted.

| Project | Purpose / entry points | Technology | CreatorPromote? | YouTube | Action |
|---|---|---|---|---|---|
| CreatorPromote | index.html directory; channelsearch.html, joinus.html, ourjob.html, work.html; nested creator sites | HTML/CSS/JS, FormSubmit, mcstatus.io | Yes | Curated galleries; nested PMOG live API | Later migrate nested live data only |
| CreatorPromote-API-Hub | scripts/update.mjs, scripts/hub.mjs, public/index.html | Node 22 ESM, Actions, Pages, JSON; no npm dependencies | Yes | Central server-side API | Approved Phase 1 |
| blackjacksetzer | index.html creator/stream profile; emotes.html | HTML/CSS/JS | Yes | Direct streams, avatar, description links | Verify identity, later migrate |
| bonakvt | index.html profile/social links | HTML/CSS/JS | Yes | Link only | No new gallery needed |
| crystalsdreamdrops | index.html stream profile; emotes.html | HTML/CSS/JS | Yes | Direct streams and separate emote avatar API | Later migrate both |
| daddydepresso | index.html profile, collaboration and personal streams; emotes.html | HTML/CSS/JS | Yes | Direct API and three collaboration playlists | Preserve both feed types |
| dreamdropscrew | index.html profiles/themes/streams; emotes.html crew directory | HTML/CSS/JS; auxiliary Python/PowerShell | Yes | Browser API; separate legacy Python updater | Later migrate active feed |
| duffball16 | index.html, content.html, community.html; games, legal, contact, Minecraft history and TidusLink pages | HTML/CSS/JS, Actions | Yes; own domain | Videos, Shorts, streams, playlists, stats, ESP JSON | Largest feature-preservation migration |
| portalmasterofgames-website | index.html, content.html, live.html; art, GIFs, DND, moon, books, merch, Minecraft | HTML/CSS/JS; Node ICS generator, Actions | Yes | Direct live stats; curated content | Later migrate statistics only |
| salahare | index.html streams/profile; emotes.html | HTML/CSS/JS | Yes | Direct streams, avatar, description links | Later migrate |
| thedocrot | index.html categorized videos, replay gallery, stats, live spotlight | HTML/CSS/JS | Yes | Direct channels/uploads/videos/search | First Phase 2 target |
| orbitfx | index.html, guide.html, studio/content.html; website-server.cjs and studio/server.cjs | HTML/CSS/JS, Node, VDO.Ninja SDK | PMOG-authored related tool; out of scope | No API integration found | Leave untouched |
| studyboop | No checked-out files beyond .git | Undetermined | Undetermined | None observable | Leave untouched |

The static sites have no application framework/build pipeline. Styles, images and scripts are repo-local. Auxiliary integrations include Google Fonts and Font Awesome CDN assets, YouTube thumbnails/embeds, social links, emote assets, Discord widgets, AdSense (Duffball), Google Calendar (PMOG), FormSubmit (main site), Minecraft status/map services and VDO.Ninja (OrbitFX). Links to Twitch, Ko-fi, Patreon, PayPal, StreamElements and social platforms are not automatically API integrations.

## 2. Directory and hosting map

    GitHub/
      CreatorPromote/                    creatorpromote.com
        blackjack/                      older profile
        bonak/                          older profile
        dreamdropscrew/                 older crew site and curated galleries
        gaminthunder/                   additional creator profile
        minecraft/                      server-status tool
        portalmasterofgames/             older PMOG site
          dnd/
          fools-stage/                  books
          moon/
        thedocrot/                      older profile
      CreatorPromote-API-Hub/
        config/ scripts/ public/ tests/ site-patches/ docs/
      blackjacksetzer/                   blackjacksetzer.creatorpromote.com
      bonakvt/                           bonakvt.creatorpromote.com
      crystalsdreamdrops/                crystalsdreamdrops.creatorpromote.com
      daddydepresso/                     daddydepresso.creatorpromote.com
      dreamdropscrew/                    dreamdropscrew.creatorpromote.com
      duffball16/                        duffball16.com
      portalmasterofgames-website/        pmog.creatorpromote.com
      salahare/                          salahare.creatorpromote.com
      thedocrot/                         thedocrot.creatorpromote.com
      orbitfx/
      studyboop/

Website domains are from local CNAME files, not an authenticated audit of every repository's Pages settings. The Hub workflow explicitly deploys public/ with Actions. PMOG's separate workflow generates a moon ICS calendar; Duffball's workflow writes ESP stats every five minutes. Dream Drops Crew has a Python feed generator but no matching local workflow was found.

## 3. Current data flow and connections

Current creator pages load local configuration containing browser-visible keys, request YouTube from each visitor, then render and cache per browser. The Hub separately runs scheduled Node requests, writes JSON, commits data in its existing workflow and uploads public/ to Pages. No active creator-site migration to that Hub was found. Existing site-patches are unapplied examples with placeholder URLs and incomplete stale-data handling.

The main CreatorPromote directory links independent creator domains while retaining older copies. Crew pages cross-link member sites and emote galleries. PMOG's portfolio links CreatorPromote and Duffball16. Bonak CSS/JS and several PMOG book pages match older copies exactly. Other overlapping pages have diverged; copying whole sites would lose features. No repositories should be merged.

## 4. Every identified YouTube API path

| Repository / source | Flow and features | Cache / refresh / issue |
|---|---|---|
| thedocrot/js/app.js and js/youtube-config.js | channels, upload playlist pages, videos, live search; stats, title-based category filtering, replays, live spotlight | 45-minute browser cache, manual refresh; stale cache can retain LIVE |
| dreamdropscrew/js/site.js and js/youtube-config.js | handle to uploads, up to 8 pages, video details; six streams | Hourly cache/visible-page refresh; saved live flags persist after errors |
| dreamdropscrew/scripts/update_livestreams.py | channels then live/completed search and videos; data/livestreams.json | Auxiliary legacy generator; no active frontend consumer found |
| daddydepresso/js/youtube.js and js/youtube-config.js | Personal streams plus supplied playlists and featured collaborations | Browser cache; partial failures and expired fallback need preservation |
| blackjacksetzer/js/youtube.js and js/youtube-config.js | Up to 3 upload pages; six streams, avatar, public-description links | Hourly cache; stale fallback can retain LIVE; handle explicitly unverified |
| salahare/js/youtube.js and js/youtube-config.js | Stream scan, avatar, snippet/branding description links | Hourly cache; expired cache not retained consistently |
| crystalsdreamdrops/js/youtube.js and js/youtube-config.js | Four upload pages, stream cards, avatar and description links | Hourly cache; cache-expiry fallback weakness |
| crystalsdreamdrops/js/avatar.js | Additional channels request from emote page | Applies saved avatar but still requests API; comment implies stronger caching than code |
| duffball16/js/content-youtube.js and js/youtube-config.js | Up to 5 configured upload pages; videos/Shorts/streams; public playlists grouped by topic | Hourly cache; duration <=180 seconds is only a Shorts heuristic |
| duffball16/js/live.js on community.html | channels statistics and live search, animated counters/goal | Every minute per visitor |
| duffball16/.github/workflows/update-esp-live.yml | channels statistics and live search to live/esp.json | Every 5 minutes; errors can become zero counts/offline; external ESP consumers not inventoried |
| portalmasterofgames-website/js/live.js | channels stats and live search | Every minute; dynamically loaded by js/live-ui.js on live.html |
| CreatorPromote/portalmasterofgames/js/live.js | Older PMOG stats and live search | Every minute; directly loaded by nested live.html |
| CreatorPromote-API-Hub/scripts/hub.mjs | Central channels, playlistItems, videos; optional playlists after Phase 1 | Scheduled every 30 minutes; no search introduced |

Curated thumbnails, YouTube links and embeds in other pages are existing content, not unnecessary Data API requests. Preserve them. Eleven key-shaped occurrences were found in public website source/configuration; no values are included here, and no keys were tested. This phase does not rotate credentials or rewrite Git history.

## 5. Hub compatibility findings before changes

The four public endpoints returned HTTP 200, version-1 JSON and Access-Control-Allow-Origin: *. Their recorded updatedAt values were approximately 08:02 UTC / 09:02 Amsterdam on 14 November. Endpoint schema: version, slug, label, updatedAt, source, channel, uploads, replays, live, liveChecked, latestVideos, latestLivestreams, latestReplays, liveStatus, collabs, collabIssues, scannedUploadCount and scanNote.

The original Hub lacked durations, scheduled metadata, public playlists, branding descriptions and a full catalog for site category filtering. It defaulted to two scan pages, capped at three, and returned only six uploads by default. Entire-channel failures retained old files, but partial collaboration failure could discard successful old sections. Patches warned about stale data while still showing LIVE. The local checkout had no public/data, no public/CNAME, and a README link to missing START-HERE.md. The remote feeds did exist; local/remote parity was not assumed.

## 6. Existing maintenance findings outside Phase 1

- CreatorPromote index.html, channelsearch.html and joinus.html reference absent assets/mark.svg.
- Crystal emotes.html references ../js/youtube-config.js although js is at that site's root.
- Dream Drops Crew index.html references absent js/index.js. site.js provides a welcome-slider fallback, not all historical curated galleries.
- Duffball minecrafthistory.html links an absent Minecraft backup ZIP.
- PMOG minecraft.html and websites.html have image and /creations/.../ paths with no corresponding local targets.
- Hub README references missing START-HERE.md (repaired by Phase 1 documentation).

These are static reference findings, not confirmed live failures. No unrelated repair was made.

## 7. Approved Phase 1 changes

See client-and-schema.md for the exact additive contract and failure semantics, channel-identities.md for every candidate's evidence, and phase-1-validation.md for executed checks. Existing endpoints and version remain. Only four creators remain enabled. The shared client is prepared for future adapters; no creator page or historical site-patch was migrated. A CNAME file documents the already-working custom domain; account/DNS settings were not changed.

## 8. Proposed Phase 2: TheDocRot first, approval required

Files: thedocrot/js/app.js, js/youtube-config.js, index.html, and a new local js/creatorpromote-hub.js copied from the tested Hub source. Replace data fetching and API-key instructions, preserving current rendering, stats counters, category filters, live spotlight, replay grid, navigation and CSS. Use the larger raw catalog for title categories. Use subscribe for expiry while a page remains open. Do not simply copy the historical patch.

Test independently: real Hub JSON plus mock current/ended/upcoming/stale broadcasts; empty sections; corrupt storage; network/HTTP/JSON failures; category filters; counters; replays; manual refresh; mobile/desktop layout; navigation and screenshots. Verify requests contain no YouTube API key and no direct YouTube Data API calls. No publish/deploy without separate approval.

## 9. Later migration file scope

- Crew: js/site.js, js/youtube-config.js, index.html and shared client. Keep character/theme/emote logic. Legacy updater remains until its ownership is established.
- Daddy: js/youtube.js, js/youtube-config.js, index.html and shared client; retain personal/collaboration distinctions.
- Blackjack/Salahare: each js/youtube.js, js/youtube-config.js, index.html and shared client; preserve avatars/description links.
- Crystal: js/youtube.js, js/avatar.js, js/youtube-config.js, index.html, emotes.html and shared client.
- Duffball: js/content-youtube.js, js/live.js, js/youtube-config.js, content.html, community.html, ESP workflow and shared client. Keep ESP field contract and investigate device consumers before changing status vocabulary.
- PMOG: js/live.js, live.html and shared client; retain live-ui.js observers and counter/goal behavior unless adapter-specific adjustment is necessary.
- Main CreatorPromote: nested PMOG js/live.js and live.html plus its shared client.
- Bonak: no migration needed for a links-only page. OrbitFX, studyboop and unrelated tools remain untouched.

## 10. Deployment and adding future sites

No deployment occurred. Before any future deployment, compare local Hub code/data with remote changes, inspect the authenticated Pages custom domain and Source: GitHub Actions settings, retain the existing Actions secret, and run tests. Only after separate deployment approval, use the existing workflow to update and explicitly publish public/. Verify all four existing endpoints, CORS and the domain before publishing any website adapter. A GITHUB_TOKEN data commit alone is not the deployment step in this workflow.

For a new creator: verify identity; document canonical ID and evidence; add a disabled configuration entry with appropriate scan counts; test mock data and feature mapping; obtain activation approval; enable only after verification; verify the real feed; then migrate that website separately. Do not add a generic feed UI where no feed currently exists.

## 11. Limitations

This is a source/HTTP audit, not a visual acceptance test of all sites. The initial 88 JS syntax checks and six Hub unit tests passed; those do not prove runtime navigation/layout correctness. Private account settings, Google quotas, scheduler history and new channel identities were not independently verified. Public HTTP success is not proof future scheduled updates run. JSON snapshots cannot guarantee instantaneous live state. Unmigrated sites retain their current keys and stale-live behavior until their own approved migration.

Quota reference checked during audit: https://developers.google.com/youtube/data/determine_quota_cost. Current documentation describes a separate default search allowance; actual account allocations are unknown. The one-minute browser search loops and five-minute ESP search schedule are avoidable regardless of quota model.
