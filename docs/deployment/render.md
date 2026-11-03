# Deploy Asterfall on Render

Use the root render.yaml Blueprint, or keep the existing Docker web service pointed at main.

- Dockerfile: ./deploy/docker/Dockerfile
- Docker command: node /app/game/server.mjs
- Health endpoint: /health
- PORT: 10000

No API key is required. Remove OPENROUTER_API_KEY, OPENJARVIS_API_KEY, OPENJARVIS_HOME, and any older provider secrets from the Render dashboard.

The image includes a compatibility executable for the old `jarvis serve ...` dashboard command. The browser game is served even if that override is still present.

A repository commit cannot rename a manually created Render service. Set its name to `asterfall` under Settings. A GitHub repository rename must be performed through GitHub Settings or authorized GitHub API access; renaming render.yaml does not rename the repository.

The free tier may sleep between visits. Game progress and high scores are stored in the player's browser, not the ephemeral server filesystem.
