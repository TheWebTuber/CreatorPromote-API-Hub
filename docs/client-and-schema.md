# Shared client and additive version-1 schema

The public client is public/js/creatorpromote-hub.js, an ES module with no dependencies. It is not deployed yet. Future websites may vendor this file locally to avoid coupling their script availability to the Hub; keep one maintained source here and record its version when copying. Do not use the old site-patches unchanged: their placeholder URLs and stale-live behavior remain historical migration examples.

## Existing contract retained

All endpoint paths and version:1 remain. Existing fields: slug, label, updatedAt, source, channel, uploads, replays, live, liveChecked, latestVideos, latestLivestreams, latestReplays, liveStatus, collabs, collabIssues, scannedUploadCount, scanNote. channel.snippet and channel.statistics remain. Counts can grow where configured; array item formats remain compatible. Legacy live may become null on failed or stale observation; this is intentional safety behavior.

Additions:
- catalog: bounded raw upload metadata including contentDetails.duration, liveStreamingDetails (including scheduled start), statistics and status. Enables per-site categories/Shorts heuristics without losing the filtered dataset. Duration alone does not prove a video is a Short.
- channel.contentDetails and channel.brandingSettings, for cached upload lookup and existing description-link features.
- playlists: optional public channel playlists; enable includePlaylists and bounded playlistPages only where needed.
- Normalized video additions: duration, scheduledAt, upcoming, embeddable.
- sections: status (fresh/cached/unavailable) and successful updatedAt per channel, videos, playlists, collaboration source and aggregate collaborations.
- collabSources: successful items and observation time per configured playlist. legacyCollabs preserves older unattributed lists during repeated partial failures until sources recover.
- issues: generic section failure summaries without upstream messages or credentials.
- liveStatus.expiresAt and freshness: conservative observation expiry and evaluation metadata.

updatedAt is the snapshot assembly time when some real section succeeds; section timestamps determine the age of each component. A total failure retains the old snapshot time. The index time is an index generation time, not proof every channel or section refreshed.

## Client use during a later approved migration

    import {createHubClient} from './js/creatorpromote-hub.js';
    const client = createHubClient();
    const unsubscribe = client.subscribe('thedocrot', ({data, source}) => {
      // Map data to EXISTING renderers. Preserve layout, classes and features.
      // Show section timestamps; source === 'fallback' means network refresh failed.
    }, () => {
      // Preserve last rendered content and show a channel link/unavailable state.
    });
    // Call unsubscribe() when the page component is removed.

get(slug,{force:true}) supports a manual refresh. Concurrent requests are deduplicated; normal requests use a five-minute cache. Storage failure falls back to memory. Invalid JSON, wrong creator, invalid version, bad video IDs, HTTP errors and timeouts cannot overwrite good cached data. Older deployments cannot overwrite newer cached snapshots. The client never uses a YouTube key and does not request YouTube endpoints.

LIVE observations expire after at most 45 minutes, independently of browser fetch time. Failed video refresh immediately yields unknown live status. Cached content remains available. subscribe schedules expiry independently of the network, checks every 30 seconds, and rechecks on visibility changes. Browser suspension can delay timers; visibility re-evaluation corrects the view on return. Use subscribe for live UI; a one-time get does not keep an already-rendered badge current. A snapshot can never guarantee real-time broadcast state; display 'observed live' plus the observation time, not a promise of instantaneous tracking.

The updater clears stale legacy/raw and normalized LIVE flags, but static JSON cannot change after deployment until the next run. Existing unmigrated consumers that ignore timestamps remain vulnerable to stale flags during a prolonged workflow outage. Phase 2 must use the freshness-aware client.

## Failure and quota behavior

Sections refresh independently. A failed video scan retains the prior complete catalog; partial scans are not substituted. A successful empty result is accepted as empty. Collaboration sources and optional public playlists retain previous results on failure. Legacy cached feeds may lack a complete catalog or uploads-playlist metadata: preserve what is available until a successful refresh supplies it.

The updater validates all enabled endpoints before writing output, writes JSON through temporary-file rename, and refuses to publish a partial index when a channel has no valid result. A clean checkout can recover last-good data from the fixed https://api.creatorpromote.com origin. This requires network availability and valid existing feeds; otherwise it stops. Each file replacement is atomic, but a whole multi-file directory is not transactional; any write failure fails the workflow before deployment.

Scanning is bounded to 1–8 upload pages, 50 IDs per videos.list request, six collaboration playlists, and 1–8 public-playlist pages. Current active scan caps are 2/8/3/2 for TheDocRot/Crew/Daddy/Bonak. With full pages, the four base channel scans cost at most 34 list requests per run; three collaboration playlists add up to six (or three failures plus one featured batch). At 48 scheduled runs/day this is about 1,920 list units in the upper normal case, excluding manual runs. Actual costs depend on pagination and project quotas. No search.list call is introduced.
