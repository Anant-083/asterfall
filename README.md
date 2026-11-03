# Asterfall

**Find your gravity.** A cinematic browser game about crossing deep space, following a lost signal, and bringing your spacecraft safely onto unfamiliar worlds.

## Play

```sh
cd game
npm start
```

Open http://localhost:10000. No installation, build, account, AI provider, or API key is needed. Requires Node.js 22+ for the server and a modern browser with Canvas 2D.

- **↑** main thruster · **← →** lateral thrusters · **↓** braking burn
- **P / Escape** pause · **R** restart · **V** change view
- Touch controls are available on phones.
- Land inside the illuminated pad with vertical speed ≤28 m/s and horizontal speed ≤18 m/s.
- The dotted prediction shows your unpowered future path. Fuel is finite. Releasing the controls does not remove momentum.

## After the signal

An original three-chapter story inspired by cinematic space exploration, including Interstellar’s themes of discovery and finding a new home. This is an independent story, not an official adaptation or sequel; no film assets, music, or dialogue are used.

1. **Selene:** recover an abandoned relay’s coordinates.
2. **Ember:** navigate crosswinds beneath a black hole’s accretion glow.
3. **Nereid:** reach the ice-world station and discover what became of the expedition.

Cinematic, chase, and cockpit/FPV landing-camera views share the same flight physics. The cockpit is a stylized instrument view, not a 3D space simulator. All worlds are available for free flight. Completed chapters and best scores save in browser storage where available. Flight pauses when the tab loses focus.

## Validation

```sh
cd game
npm test
```

Physics tests exercise gravity, thrust, braking, fuel exhaustion, safe and unsafe landings, trajectory prediction, and a full controlled landing.

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
