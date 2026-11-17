# Phase 4: PMOG activation — 17 November 2026

PMOG alone is enabled, using the existing verified ID UCdOJvhjojFe3Z0yKeGEIERA. YouTube RSS and oEmbed were rechecked against the Phase 3 evidence: the channel is Portal Master Of Games, and video 9miY_By-CMQ identifies its author as @PMOG. The four previous active configurations remain unchanged; all other candidates remain disabled.

Both PMOG integrations were already pushed to main and publicly served before this phase (standalone e712ee6, nested 54b0fe4). Their existing shared client, layout, content, books, GIFs and animations are reused. The missing Hub feed was the deployment blocker.

No JSON schema or client change is needed. PMOG's two upload pages cost at most five list requests per run (one channel, two upload pages, two video batches), or 240 units/day at 48 runs. The five active channels have a conservative total bound of 2,304 units/day before retries/manual runs. No search requests are introduced. Credentials remain in the existing Actions secret.

Configuration assertions now permit exactly the four original feeds plus PMOG. A focused PMOG generator test covers full scan cost, channel identity, statistics, videos, replays, section timestamps and LIVE expiration. The existing client and resilience tests remain applicable.

Deployment order: test and push the Hub on main, run its existing update-and-publish workflow, verify all five public feeds, then validate the two already-deployed PMOG clients against the real feed. Website commits, if needed, follow successful Hub validation. No other creator is activated or modified.
