# Jarvis glass workspace

This checkout extends OpenJarvis with a responsive glass welcome screen, light/dark styling, keyboard focus indicators, reduced-motion support, and four editable prompt starters. Decision Studio helps compare options and identify a reversible experiment. Starters append to existing drafts and never send automatically.

## Development

From `/workspace/OpenJarvis`:

```sh
uv sync --frozen --extra server --extra inference-cloud --extra inference-google
cd frontend
npx --yes npm@11.19.0 ci
npm run dev -- --host 0.0.0.0
```

Configure your chosen cloud provider securely before starting the backend. Never commit keys. The backend needs a real provider credential and permitted network access to that provider. From the repository root:

```sh
OPENJARVIS_HOME=/workspace/jarvis-runtime .venv/bin/jarvis serve --host 127.0.0.1 --port 8000 --engine cloud --model openrouter/openai/gpt-4o-mini
```

The frontend proxies API calls to port 8000. A missing provider connection prevents backend startup; the frontend reports the unavailable backend. The interface does not simulate AI answers.

## Verification

`cd frontend && npm run build` produces the frontend in `src/openjarvis/server/static`. `npm test` runs the existing frontend suite. Both passed during implementation (117 tests). Cloud inference, voice, and connectors require their respective provider configuration and have not been validated end to end.

## Suggested next feature

A decision journal could save the options you considered, the evidence behind them, and a review date, so Jarvis can help you learn from outcomes over time. The current Decision Studio is a prompt starter; it does not implement a persistent decision journal.

## OpenRouter connection

The selected provider is OpenRouter, using its native `OPENROUTER_API_KEY` environment binding and `https://openrouter.ai/api/v1` endpoint. Enter a replacement key in secure environment settings. The earlier `JARVIS_OPENAI_KEY` requirement is unnecessary for this workflow. Model: `openrouter/openai/gpt-4o-mini`. Live inference remains unverified until a secure credential is available.
