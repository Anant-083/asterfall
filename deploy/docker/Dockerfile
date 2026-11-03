# Asterfall is a browser game; no model server, Rust build, or API key required.
FROM node:22.23.0-slim@sha256:d9f850096136edbc402debdd8729579a288aac64574ada0ff4db26b6ae58b0b2
WORKDIR /app
COPY --chown=node:node game/ ./game/
# Compatibility for the existing manual Render override (jarvis serve ...).
# Render replaces ENTRYPOINT as well as CMD; this shim starts the new game.
RUN printf '#!/bin/sh\nexec node /app/game/server.mjs\n' > /usr/local/bin/jarvis && chmod 755 /usr/local/bin/jarvis
ENV NODE_ENV=production
ENV PORT=10000
USER node
EXPOSE 10000
CMD ["node", "/app/game/server.mjs"]
