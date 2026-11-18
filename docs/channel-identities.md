# Channel identity verification — 14 November 2026

Only the four previously active creators remain enabled. No new creator was activated.

| Candidate | Public handle | Candidate channel ID | Evidence | Status |
|---|---|---|---|---|
| Duffball16 | @Duffball16 | UC2iwDFfrVjWYFpXahr-o8cA | Local website configuration and membership URL agree | Pending independent verification; disabled |
| Portal Master Of Games | @PMOG | UCdOJvhjojFe3Z0yKeGEIERA | Local live-stat source | Pending independent verification; disabled |
| Blackjacksetzer | @Blackjacksetzer | Unknown | Local config explicitly calls the handle a starting guess | Unverified; disabled |
| Crystalsdreamdrops | @Crystalsdreamdrops | Unknown | Local website links and config agree | Pending independent verification; disabled |
| Salahare | @Salahare | Unknown | Local website links and config agree | Pending independent verification; disabled |

Verification attempted against https://www.youtube.com/@Duffball16, https://www.youtube.com/@PMOG, https://www.youtube.com/@Blackjacksetzer, https://www.youtube.com/@Crystalsdreamdrops, and https://www.youtube.com/@Salahare. Public responses led to a consent page or a generic page without usable channel identity metadata. HTTP 200 on those pages is NOT evidence of identity. No browser API key was used. No candidate ID was inferred from a name alone.

Before enabling: resolve the handle using the authorized server-side YouTube API or inspect the channel's own public canonical ID; compare title, handle and profile links with the intended creator; record the canonical ID, evidence URL/method and verification date here; set identityVerified to true only after verification. Then separately approve activation. Configuration validation rejects enabled entries explicitly marked identityVerified:false.

Existing active channel IDs were pinned to IDs returned by the currently deployed Hub's four working endpoints, not independently re-certified:
- thedocrot: UCiXeV-jUw_yCqScuZGopvVQ
- dreamdropscrew: UCuK6uJXgGlJd4TLNjTwtluA
- daddydepresso: UCKP2iEDv2W4ptqNObi7rSzQ
- bonakvt: UCKE1MnwHQBM8i7Or5K_zcmA

Bonak has a Hub feed but its website currently needs no automatic feed. Gamin Thunder is an additional nested creator page with no identified API migration requirement; it has not been added or enabled.

Blackjack Setzer was verified on 18 November 2026. The [YouTube RSS feed](https://www.youtube.com/feeds/videos.xml?channel_id=UCZ1YWkHXSEW1aqPjMERmKcg) identifies the channel as Blackjack Dream Drops. YouTube oEmbed for a video in that feed returned the author handle [@blackjacksetzer](https://www.youtube.com/@blackjacksetzer), matching the website configuration. Three uploads pages preserve coverage of up to 150 uploads. One channel request, up to three playlistItems requests and three videos requests add at most seven units per run, or 336 per day at 48 runs. The seven-feed estimate is 3,312 units per day before retries and manual runs.

Crystal’s Dream Drops was verified on 18 November 2026. Both creator pages link to [@Crystalsdreamdrops](https://www.youtube.com/@Crystalsdreamdrops). The [YouTube RSS feed](https://www.youtube.com/feeds/videos.xml?channel_id=UCtaRwYXdPWmrXhwirPL3oKw) identifies this channel, and [YouTube oEmbed for its video t7wuA3THESI](https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=t7wuA3THESI) returns the same author handle. Four upload pages cover 200 videos. At most nine list calls per run add 432 units per day at 48 runs, bringing the eight-feed estimate to 3,744 before retries or manual runs.
