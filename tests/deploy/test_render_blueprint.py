"""Asterfall's Render contract: no inference services or provider secrets."""
import json
from pathlib import Path
import yaml
ROOT = Path(__file__).resolve().parents[2]

def test_render_serves_browser_game():
    service = yaml.safe_load((ROOT / "render.yaml").read_text())["services"][0]
    assert service["name"] == "asterfall"
    assert service["dockerCommand"] == "node /app/game/server.mjs"
    assert service["dockerfilePath"] == "./deploy/docker/Dockerfile"
    assert service["healthCheckPath"] == "/health"
    assert service["envVars"] == [{"key": "PORT", "value": "10000"}]

def test_container_copies_only_game_and_runs_without_root():
    content = (ROOT / "deploy/docker/Dockerfile").read_text()
    copies = [line for line in content.splitlines() if line.startswith("COPY ")]
    assert copies == ["COPY --chown=node:node game/ ./game/"]
    assert "USER node" in content
    assert 'CMD ["node", "/app/game/server.mjs"]' in content
    assert "/usr/local/bin/jarvis" in content

def test_game_has_no_runtime_dependencies():
    package = json.loads((ROOT / "game/package.json").read_text())
    assert not package.get("dependencies")
    assert package["scripts"]["start"] == "node server.mjs"
