[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/kuroro0125/makefun-stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/kuroro0125/makefun-stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

# NIGHT ARCHIVE — 夜のアーカイブ

A top-down stealth game that runs offline in a desktop browser from static files.
You are a thief slipping through a moonlit archive-museum at night: lift three
star charts and the golden Astrolabe from their display cases, then reach the
north exit unseen.

## How to play

Serve `game/` with any static server (for example `node serve.ts`) and open
`http://localhost:8080` in desktop Chrome. No network is needed; all sound is
synthesised with WebAudio.

- **WASD / arrow keys** — move. Running is fast but loud: a noise ring shows
  and guards who hear it come to investigate.
- **Shift** — crouch-walk. Slow and silent.
- **E (hold)** — pick a display case. A progress ring fills; picking is
  slightly noisy.
- **Light and shadow** — lamp pools and moonbeams are lit; everywhere else is
  shadow. Standing in shadow shortens how far guards can see you.
- **Detection meter** — fills while a guard sees you, decays when you break
  line of sight. When it fills, you get a short grace window to escape before
  you are caught.
- **Guards** — four guards walk learnable patrol loops and pause to look
  around at each corner. Their vision cones are carved by walls and cover:
  bookshelves, planters and statues block sight.

Win by escaping with all four pieces; the win screen grades you by time and
how many times you were seen.

## Layout

- `game/index.html` — page, HUD and overlay screens
- `game/style.css` — night palette and HUD styling
- `game/js/main.js` — game loop and state machine (title / playing / spotted / caught / won)
- `game/js/level.js` — the hall: walls, cover, cases, lamps, exit, patrol routes
- `game/js/vision.js` — line of sight and wall-occluded vision cones
- `game/js/guards.js` — patrol, suspicion, investigation and chase
- `game/js/player.js` — movement, noise, crouching and lock-picking
- `game/js/render.js` — canvas drawing: floor, light, cover, cones, thief
- `game/js/audio.js` — WebAudio-only footsteps, alert sting and case clicks
- `game/js/scenes.js` — deterministic preview poses (`?scene=cover|shadow|caught`)
- `main.ts` — copies `game/` and `screenshots/` to the output dir and writes
  `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`
- `screenshots/` — real browser renders of the game

## License

MIT — see `LICENSE`.
