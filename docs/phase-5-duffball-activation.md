# Duffball16 activation — 18 November 2026

Phase 5 enables only Duffball16, channel UC2iwDFfrVjWYFpXahr-o8cA. Its RSS feed and first-video oEmbed author URL were rechecked against the Phase 3 evidence and resolve to Duffball16 / @Duffball16. The five existing active configurations remain unchanged; Blackjack Setzer, Crystals Dream Drops and SalaHare remain disabled.

The existing implementation is reused: five upload pages (250 items), three public-playlist pages (150 playlists), statistics, normalized video/stream/replay lists, raw catalog, section timestamps and expiring LIVE observations. No schema, credential handling or browser client change is needed.

The existing full-coverage generator test verifies 14 list calls per Duffball run with no search. At 48 scheduled Hub runs/day this adds at most 672 units/day, bringing the conservative six-feed estimate to 2,976 units/day before manual runs/retries. Browser and ESP JSON reads add no YouTube quota. Scheduled Actions can be delayed; the website and ESP must not assume five-minute or thirty-minute execution guarantees.

The ESP continues at /live/esp.json with the same five fields and types: subscribers/views/videos are numbers; status/updated are strings. Its original exact status strings are preserved: Streaming Live and Not Livestreaming. Only a fresh positive observation produces Streaming Live. The non-live string includes unknown, stale and unavailable observations; it is a conservative binary compatibility mapping, not proof the channel is offline. The richer Hub status remains unknown when appropriate. Saved counts and their timestamp survive outages, without retaining an old LIVE label. No device firmware is changed and physical hardware compatibility is not claimed.

Deployment order: Hub tests and main push, existing feed-update Action, all-six-feed verification, then Duffball's focused tests, main push and ESP Action/public JSON verification. No other creator website is modified.
