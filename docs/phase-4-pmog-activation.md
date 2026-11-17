# Phase 4: PMOG activation — 17 November 2026

PMOG alone is enabled, using the existing verified ID UCdOJvhjojFe3Z0yKeGEIERA. YouTube RSS and oEmbed were rechecked against the Phase 3 evidence: the channel is Portal Master Of Games, and video 9miY_By-CMQ identifies its author as @PMOG. The four previous active configurations remain unchanged; all other candidates remain disabled.

Both PMOG integrations were already pushed to main and publicly served before this phase (standalone e712ee6, nested 54b0fe4). Their existing shared client, layout, content, books, GIFs and animations are reused. The missing Hub feed was the deployment blocker.

No JSON schema or client change is needed. PMOG's two upload pages cost at most five list requests per run (one channel, two upload pages, two video batches), or 240 units/day at 48 runs. The five active channels have a conservative total bound of 2,304 units/day before retries/manual runs. No search requests are introduced. Credentials remain in the existing Actions secret.

Configuration assertions now permit exactly the four original feeds plus PMOG. A focused PMOG generator test covers full scan cost, channel identity, statistics, videos, replays, section timestamps and LIVE expiration. The existing client and resilience tests remain applicable.

Deployment order: test and push the Hub on main, run its existing update-and-publish workflow, verify all five public feeds, then validate the two already-deployed PMOG clients against the real feed. Website commits, if needed, follow successful Hub validation. No other creator is activated or modified.

## Verified Hub deployment

Activation commit c07f9bb was pushed by the user. [Actions run 44176053996](https://github.com/TheWebTuber/CreatorPromote-API-Hub/actions/runs/44176053996) completed successfully on 17 November 2026, generating feed commit cbc0457. All five active public endpoints returned HTTP 200 with their expected IDs and fresh sections, without reported issues.

PMOG's initial snapshot (21:05:34 UTC / 22:05:34 Amsterdam) contains 100 catalog items, six replays, and statistics of 279 subscribers, 79,493 views and 397 videos. No current stream was detected; the safe status is unknown rather than an assertion that the channel is offline. Both deployed PMOG clients display those counts. The Hub's 36 tests passed before publication; the standalone client's eight tests and nested client's nine tests also pass.
