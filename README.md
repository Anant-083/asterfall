# Asterfall

**Find your gravity.** A laptop and desktop spacecraft simulator with full 360° attitude control, a cockpit, station docking, and separate planetary landing expeditions.

## Play

```sh
cd game
npm start
```

Open http://localhost:10000 for the new flight simulator. Requires a keyboard, a fine-pointer device, and a viewport at least 960 pixels wide; phone controls are disabled. No installation, build, account, AI provider, or API key is needed. Requires Node.js 22+ for the server and a modern browser. WebGL2 provides true 3D rendering; a Canvas 2D fallback remains available. Three.js 0.180.0 is vendored locally with its MIT license.

## Desktop simulator controls

- **Arrow keys:** pitch and yaw through 360°; **Q/E:** roll.
- **W/S:** increase/decrease persistent throttle. Thrust follows the ship's nose.
- **A/D:** strafe; **R/F:** translate vertically relative to the ship.
- **X:** cut throttle and brake; **Shift:** boost while throttle is above zero.
- **Z:** toggle angular damping. With damping off, rotation continues after releasing controls.
- **C:** cycle chase, cockpit, and 360° exterior views. Drag to look around; scroll to zoom the exterior camera.
- **Mouse steering:** captures the pointer for cockpit pitch/yaw; Escape releases it and pauses.
- **P:** pause; **H:** flight manual; **G:** request docking.

Dock at Kepler station within 65 metres, below 8 m/s, facing down its approach corridor. Flight instruments show velocity, throttle, propellant, pitch/yaw/roll, and an artificial horizon. Optional local gravity attracts the ship to the selected destination. Planet contact ends the free-flight session; use **Begin landing expedition** for a playable surface approach.

The navigation computer selects all eleven destinations. **Transfer to approach** resets the ship near the selected globe with fresh fuel; this is a compressed travel shortcut, not continuous orbital travel. Motion has six degrees of freedom and quaternion attitude without rotation limits. Physics and scale are tuned for play, not scientific navigation. The simulator requires WebGL2; a clear error explains unsupported graphics.

## Landing expeditions

Open **Expeditions** or `/expedition` to access the existing Solar Atlas, landing tutorial, rover, journal, and story. The destination handoff preserves the selected body. This mode has a separate, simplified lander control scheme:

- **↑:** lift; **←/→:** steer; **↓:** brake; **W/S:** depth movement.
- **P/Escape:** pause; **R:** restart; **V:** view; **M:** Solar Atlas; **J:** journal; **E:** scan.
- Land on the illuminated pad below 28 m/s vertically and 18 m/s horizontally. Fuel and momentum matter.
- A 2D fallback is available for the expedition mode. Both modes target laptops/desktops.

## Flight academy, surface exploration, and journal

- **Flight academy** teaches thrust, steering, and braking in protected drills, then releases the ship for a real assisted landing. Training can be ended at any time.
- **Assist** applies steering and braking only on axes without manual input. It consumes normal fuel and does not guarantee a landing after unsafe manual maneuvers.
- After a successful surface landing, choose **Deploy surface rover**. Use arrows/thumbstick to drive; get within 45 game metres of a landmark and press **Scan** or **E**. Return to the ship to begin another flight.
- **Follow the Signal** is an original fictional campaign: recover the four survey-relay transmissions on the Moon, Mars, Europa, and Titan in any order. Geology scans also save to the journal.
- The **Journal** keeps the latest 40 arrivals, landing scores, scans, fragments, and four photos in this browser's local storage. It can export a JSON backup. Photo captures the scene without the UI. Clearing site data removes the local journal; no account sync is claimed.
- Phone touch controls are hidden in this desktop edition.

### Visual resources

Nine planetary globes use original JPEG textures from NASA's official NASA-3D-Resources repository. Credits and exact source paths are in [game/ASSET_CREDITS.md](game/ASSET_CREDITS.md). These are reference maps, not live photographs; some use enhanced/false color. Ground terrain is procedural and differs by destination: lunar craters, red Martian regolith, Europa's fractured ice, and Titan's hazy dunes. No surveyed landing-site fidelity is claimed.

## Solar Atlas and discoveries

Open **Solar atlas** to pan, zoom, and choose among all eight planets plus the Moon, Europa, and Titan. Transfer sequences compress interplanetary travel into a few seconds. Rocky destinations have playable landing approaches. Gas and ice giants have observation-orbit arrivals because they have no accessible solid surface.

Successful arrivals reveal NASA-linked facts about radius, gravity, atmosphere, orbital period, and the named region. Discovered destinations are saved locally in the browser. Terrain and landing zones are fictional, not NASA surface maps. Real-world gravity values are displayed in field notes; flight physics are tuned for playability.

The metallic Nomad lander includes twin engines, radiator panels, cockpit windows, deployable landing struts, an antenna, and reaction-control jets. The three fictional story destinations remain available separately in the bottom deck.

### NASA/JPL connection

`GET /api/ephemeris` queries the public [NASA/JPL Horizons API](https://ssd.jpl.nasa.gov/horizons/). It requests Sun-centered ecliptic J2000 vectors in AU at 00:00 UTC for the current date. Responses are cached for an hour; partial/failed results retry after the cache interval (fully failed results cache for one minute). Concurrent requests share the same fetch.

Each body retains its data provenance. If JPL is unavailable, the map explicitly labels its circular-orbit estimates. The fallback is illustrative, not an accurate ephemeris. Map distances are compressed, planet sizes are exaggerated, and moons are offset from their parent for readability. The map is not suitable for real navigation.

No NASA API key is needed. The hosting server needs outbound HTTPS access to `ssd.jpl.nasa.gov`. Live requests could not be verified from the development workspace because that destination is blocked; parser, successful-response, partial-failure, and offline behavior were tested with synthetic fixtures. Inspect the atlas status on Render to verify live service access.

Destination facts link to [NASA Science](https://science.nasa.gov/solar-system/). No NASA endorsement is implied.

## After the signal

An original three-chapter story inspired by cinematic space exploration, including Interstellar’s themes of discovery and finding a new home. This is an independent story, not an official adaptation or sequel; no film assets, music, or dialogue are used.

1. **Selene:** recover an abandoned relay’s coordinates.
2. **Ember:** navigate crosswinds beneath a black hole’s accretion glow.
3. **Nereid:** reach the ice-world station and discover what became of the expedition.

Cinematic, chase, and cockpit views share true three-axis flight physics. The default WebGL renderer draws a modeled spacecraft, rover, planetary globes, and terrain; the alternate 2D renderer preserves gameplay on unsupported devices. This is a stylized exploration game, not a scientific orbital-mechanics simulator. All worlds are available for free flight. Completed chapters and best scores save in browser storage where available. Flight pauses when the tab loses focus.

## Validation

```sh
cd game
npm test
```

Tests additionally exercise ship-relative thrust, unlimited quaternion attitude, momentum, angular damping, free-flight braking, gravity, and docking constraints. Expedition tests exercise gravity, three-axis thrust and braking, fuel exhaustion, landing alignment, assist/manual priority, all seven real solid-body destinations, journal persistence, relay progression, rover movement, Horizons parsing, request coordinates, and honest fallback behavior.

## Render

The root `render.yaml` names the new service **asterfall** and deploys `deploy/docker/Dockerfile`. The container serves the game and `/health` on `$PORT` (default 10000). It has no Python or Rust build step.

For the existing manually created Render service:

- Dockerfile Path: `./deploy/docker/Dockerfile`
- Docker Command: `node /app/game/server.mjs`
- Health Check Path: `/health`
- Rename it to **asterfall** in Settings if desired; Render owns the resulting hostname.
- Remove the old AI-provider and OpenJarvis secrets from Render. The game never reads them.

A compatibility executable supports the earlier `jarvis serve ...` command so the current service can start after redeploy even before its dashboard override is updated. Existing OpenJarvis service workers are retired to prevent the old UI remaining cached. If an old tab still shows the chat UI, hard-refresh once.

## Repository history

The active product is in `game/`. The previous OpenJarvis source remains in this repository for history and attribution, but is not copied into the production image. Its Apache-2.0 license is retained in `LICENSE`. Older backend documentation and tests apply only to that legacy application.
