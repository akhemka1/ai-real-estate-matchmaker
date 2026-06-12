"""Claude (Anthropic) integration.

A thin wrapper over the official ``anthropic`` Python SDK that the AI services
call into. Three primitives cover every use case in this app:

* :meth:`complete`     — free-text generation (listing copy, assistant replies)
* :meth:`extract_json` — structured output via **forced tool use** (robust JSON)
* :meth:`analyze_image` — vision: structured tags from a property photo URL

The SDK is imported lazily and every method raises :class:`LLMNotConfiguredError`
when ``ANTHROPIC_API_KEY`` is unset (or the SDK isn't installed). Callers catch
that and fall back to deterministic heuristics, so the app runs — and tests pass
— with no API key, and upgrades to real AI the moment a key is provided.

Model defaults to ``claude-opus-4-8`` (configurable via ``ANTHROPIC_MODEL``;
set ``claude-haiku-4-5`` or ``claude-sonnet-4-6`` to trade capability for cost
at high volume).
"""

from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("llm")


class LLMNotConfiguredError(RuntimeError):
    """Raised when Claude is not configured/available; callers fall back."""


class LLMService:
    def is_configured(self) -> bool:
        return settings.ai_enabled

    def _client(self):
        if not self.is_configured():
            raise LLMNotConfiguredError("ANTHROPIC_API_KEY is not set")
        try:
            import anthropic  # lazy: only needed when AI is enabled
        except ImportError as exc:  # pragma: no cover - depends on deploy env
            raise LLMNotConfiguredError("anthropic SDK is not installed") from exc
        return anthropic.Anthropic(
            api_key=settings.anthropic_api_key, timeout=settings.anthropic_timeout_seconds
        )

    # --- Free-text generation -------------------------------------------
    def complete(self, *, system: str, prompt: str, max_tokens: int | None = None) -> str:
        client = self._client()
        message = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=max_tokens or settings.anthropic_max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in message.content if block.type == "text").strip()

    # --- Structured output via forced tool use --------------------------
    def extract_json(
        self,
        *,
        system: str,
        prompt: str,
        tool_name: str,
        tool_description: str,
        input_schema: dict[str, Any],
        max_tokens: int | None = None,
    ) -> dict[str, Any]:
        """Force Claude to return data matching ``input_schema`` (valid JSON)."""
        client = self._client()
        tool = {"name": tool_name, "description": tool_description, "input_schema": input_schema}
        message = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=max_tokens or settings.anthropic_max_tokens,
            system=system,
            tools=[tool],
            tool_choice={"type": "tool", "name": tool_name},
            messages=[{"role": "user", "content": prompt}],
        )
        for block in message.content:
            if block.type == "tool_use" and block.name == tool_name:
                return dict(block.input)
        raise LLMNotConfiguredError("Claude did not return structured output")

    # --- Vision ----------------------------------------------------------
    def analyze_image(
        self,
        *,
        image_url: str,
        system: str,
        prompt: str,
        tool_name: str,
        tool_description: str,
        input_schema: dict[str, Any],
        max_tokens: int | None = None,
    ) -> dict[str, Any]:
        client = self._client()
        tool = {"name": tool_name, "description": tool_description, "input_schema": input_schema}
        message = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=max_tokens or settings.anthropic_max_tokens,
            system=system,
            tools=[tool],
            tool_choice={"type": "tool", "name": tool_name},
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {"type": "url", "url": image_url}},
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
        )
        for block in message.content:
            if block.type == "tool_use" and block.name == tool_name:
                return dict(block.input)
        raise LLMNotConfiguredError("Claude did not return structured output")


llm_service = LLMService()
