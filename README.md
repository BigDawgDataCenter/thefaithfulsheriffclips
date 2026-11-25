# The Faithful Sheriff Clips (site)

Static site, no build. Host anywhere (GitHub Pages).

- `assets/config.js`: Twitch login, clips YouTube link, `clipsChannelId` (UC...), playlists, schedule.
- `clips.json`: the Wanted Board. The clipper on Walley appends after each upload:
  `{"id": "<11-char YouTube id>", "title": "...", "game": "World of Warcraft", "date": "2026-11-25"}`.
  Newest 12 show. Empty file + `clipsChannelId` set = shows the channel's uploads playlist instead.
- Twitch player and chat use the page's own hostname as `parent`, so any domain works with no edit.
- Live status: decapi.me (public). Daily verse: KJV (public domain), rotates daily.
- Rules: positive voice, kids filter, no drama. Never the Sheriff's avatars (peanut, cat sheriff).
