# Additional channel verification — 16 November 2026

Both channels below remain disabled. These findings supersede their pending identity status in the 14 November audit. No existing channel ID was changed.

| Creator | Channel ID | Independent YouTube evidence |
|---|---|---|
| Duffball16 | UC2iwDFfrVjWYFpXahr-o8cA | [RSS](https://www.youtube.com/feeds/videos.xml?channel_id=UC2iwDFfrVjWYFpXahr-o8cA) returned Duffball16 and that canonical channel URL. The first video Q8VOmiAEOp8 returned author_name Duffball16 and author_url https://www.youtube.com/@Duffball16 through [YouTube oEmbed](https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DQ8VOmiAEOp8). These match the existing local ID, membership URL and handle. |
| Portal Master Of Games | UCdOJvhjojFe3Z0yKeGEIERA | [RSS](https://www.youtube.com/feeds/videos.xml?channel_id=UCdOJvhjojFe3Z0yKeGEIERA) returned Portal Master Of Games and that canonical channel URL. Video 9miY_By-CMQ returned author_name Portal Master Of Games and author_url https://www.youtube.com/@PMOG through [YouTube oEmbed](https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D9miY_By-CMQ). These match both local PMOG implementations. |

Only identityVerified changed to true for these entries. enabled remains false.

Blackjack Setzer (@Blackjacksetzer), Crystals Dream Drops (@Crystalsdreamdrops) and SalaHare (@Salahare) still have no verified canonical channel IDs. Direct handle/about requests returned consent or generic pages without channel metadata; public searches did not resolve a trustworthy ID. HTTP 200 on such a page was not treated as identity evidence. Blackjack's local config calls its handle a starting guess. These three remain identityVerified:false and enabled:false; their sites are unchanged. The user was asked for canonical channel URLs or IDs. No API key was used for verification.
