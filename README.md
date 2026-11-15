# CreatorPromote API Hub (GitHub-only)

One private **YouTube Data API key**, one scheduled **GitHub Actions** updater, and static cached JSON for your GitHub Pages websites. **No Cloudflare, PHP, or separate server.**

**Start with [`START-HERE.md`](START-HERE.md).** It explains the one-time GitHub Pages and secret setup.

## Public feeds (after first successful deployment)

`https://thewebtuber.github.io/CreatorPromote-API-Hub/data/thedocrot.json`

Also: `dreamdropscrew.json`, `daddydepresso.json`, `bonakvt.json`, and `data/index.json`.

Five additional creators are prepared but **disabled** pending independent identity verification and activation approval. See [channel identities](docs/channel-identities.md).

## How it works

- `.github/workflows/update-youtube.yml` runs every 30 minutes (subject to GitHub scheduling).
- `scripts/update.mjs` reads `config/channels.json`, calls YouTube, then writes `public/data/*.json`.
- Uses `channels.list`, `playlistItems.list`, and `videos.list` instead of `search.list`.
- Existing good JSON remains if a refresh fails.
- The workflow **deploys Pages explicitly**, because GitHub's `GITHUB_TOKEN` commits alone don't trigger GitHub Pages builds.
- Visitors fetch the public JSON, not YouTube; your API key stays a secret.

## Add another creator

Add a disabled entry in `config/channels.json`. Verify and document its canonical channel identity before setting `identityVerified: true`. Enable and run the workflow only after activation/deployment approval.

## Included website patches

`site-patches/` contains the replacement JavaScript for your existing TheDocRot, Dream Drops Crew, and Daddy Depresso designs. They are **not** part of the hub itself and should **not** be copied into your new hub repo unless you want example files there. After the hub works, copy the corresponding patch into each creator's own website repository.

## Notes

- No site can guarantee permanently live status: if a broadcast doesn't appear among recent public uploads, status is **unknown**, not offline.
- The hub refreshes on a schedule, not instantly. GitHub scheduled runs may be delayed or disabled after 60 days of public repo inactivity.
- Public channel stats and video information are saved in JSON. Do not put private data or secrets in `public/`.
- Your original websites will continue making direct YouTube API calls until you replace their old JavaScript with the included patches.
- In GitHub Pages settings, choose **Source: GitHub Actions**, not `Deploy from a branch`.
- To test locally with no key: `npm test` (Node 22+); no packages need installing.

## Phase 1 preparation (local, not deployed)

- [Complete workspace audit and migration plan](docs/workspace-audit-and-migration.md)
- [Shared client, schema, freshness and failure handling](docs/client-and-schema.md)
- [Channel identity evidence](docs/channel-identities.md)
- [Validation and remaining risks](docs/phase-1-validation.md)

The maintained client is `public/js/creatorpromote-hub.js`. Existing `site-patches/` are historical examples, not approved migration-ready replacements: they have placeholder URLs and incomplete stale-LIVE handling. Do not copy them unchanged. No individual website has been migrated.
