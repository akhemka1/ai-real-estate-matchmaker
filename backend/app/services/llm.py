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
        # Structured-output methods (extract_json/analyze_image) rely on Claude's
        # forced tool use, so they require Anthropic specifically.
        if not settings.anthropic_api_key:
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
        """Free-text generation. Provider priority: Anthropic > Groq > Gemini."""
        if settings.anthropic_api_key:
            return self._anthropic_complete(system=system, prompt=prompt, max_tokens=max_tokens)
        if settings.groq_api_key:
            return self._groq_complete(system=system, prompt=prompt, max_tokens=max_tokens)
        if settings.gemini_api_key:
            return self._gemini_complete(system=system, prompt=prompt, max_tokens=max_tokens)
        raise LLMNotConfiguredError("No LLM provider configured")

    def _groq_complete(self, *, system: str, prompt: str, max_tokens: int | None = None) -> str:
        """Call Groq's free OpenAI-compatible API via httpx — no extra deps."""
        import httpx

        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            json={
                "model": settings.groq_model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": max_tokens or settings.anthropic_max_tokens,
            },
            timeout=settings.anthropic_timeout_seconds,
        )
        resp.raise_for_status()
        data = resp.json()
        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError(f"Groq returned no choices: {data}")
        text = (choices[0].get("message", {}).get("content") or "").strip()
        if not text:
            raise RuntimeError("Groq returned an empty response")
        return text

    def _anthropic_complete(self, *, system: str, prompt: str, max_tokens: int | None = None) -> str:
        client = self._client()
        message = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=max_tokens or settings.anthropic_max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in message.content if block.type == "text").strip()

    def _gemini_complete(self, *, system: str, prompt: str, max_tokens: int | None = None) -> str:
        """Call Google Gemini's REST API (free tier) via httpx — no extra deps."""
        import httpx

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent"
        )
        payload = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": max_tokens or settings.anthropic_max_tokens},
        }
        resp = httpx.post(
            url,
            params={"key": settings.gemini_api_key},
            json=payload,
            timeout=settings.anthropic_timeout_seconds,
        )
        resp.raise_for_status()
        data = resp.json()
        candidates = data.get("candidates") or []
        if not candidates:
            raise RuntimeError(f"Gemini returned no candidates: {data}")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(part.get("text", "") for part in parts).strip()
        if not text:
            raise RuntimeError("Gemini returned an empty response")
        return text

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
