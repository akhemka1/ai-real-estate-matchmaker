"""Diagnose whether the Claude LLM integration is actually working.

Run from the backend directory:
    python scripts/verify_ai.py

It checks, in order:
  1. ANTHROPIC_API_KEY is set
  2. the `anthropic` SDK is installed
  3. a real round-trip call to the configured model succeeds
  4. the app's own LLMService returns Claude output (the integration path)

Exit code is 0 when the LLM is live, 1 otherwise.
"""

import sys

from app.core.config import get_settings

OK = "[OK]"
NO = "[--]"
FAIL = "[XX]"


def main() -> int:
    settings = get_settings()
    print("=" * 60)
    print(" Claude LLM verification")
    print("=" * 60)

    # 1) API key
    key = settings.anthropic_api_key
    if key:
        masked = f"{key[:7]}...{key[-4:]}" if len(key) > 12 else "set"
        print(f"{OK} ANTHROPIC_API_KEY is set ({masked})")
    else:
        print(f"{NO} ANTHROPIC_API_KEY is NOT set")
        print("     -> add ANTHROPIC_API_KEY=sk-ant-... to backend/.env")
        print(f"{NO} LLM is OFF -> AI endpoints use heuristic fallback (ai_generated=false)")
        return 1

    print(f"     model = {settings.anthropic_model}")

    # 2) SDK installed
    try:
        import anthropic  # noqa: F401
    except ImportError:
        print(f"{FAIL} anthropic SDK is NOT installed")
        print("     -> run:  pip install -e \".[dev]\"   (or: pip install anthropic)")
        return 1
    print(f"{OK} anthropic SDK is installed ({anthropic.__version__})")

    # 3) Direct round-trip
    try:
        client = anthropic.Anthropic(api_key=key, timeout=settings.anthropic_timeout_seconds)
        msg = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=32,
            messages=[{"role": "user", "content": "Reply with exactly: AI OK"}],
        )
        reply = "".join(b.text for b in msg.content if b.type == "text").strip()
        print(f"{OK} Claude responded: {reply!r}")
        print(
            f"     tokens in/out = {msg.usage.input_tokens}/{msg.usage.output_tokens}"
        )
    except anthropic.AuthenticationError:
        print(f"{FAIL} Authentication failed -> your API key is invalid or revoked")
        return 1
    except anthropic.NotFoundError:
        print(f"{FAIL} Model '{settings.anthropic_model}' not found for this key")
        print("     -> set ANTHROPIC_MODEL to a model your key can access")
        return 1
    except anthropic.RateLimitError:
        print(f"{FAIL} Rate limited -> key works, but you're over quota; retry later")
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"{FAIL} Call failed: {type(exc).__name__}: {exc}")
        print("     -> check network egress / firewall to api.anthropic.com")
        return 1

    # 4) The app's integration path
    try:
        from app.services.llm import llm_service

        out = llm_service.complete(
            system="You are a test probe.",
            prompt="Reply with exactly: SERVICE OK",
            max_tokens=16,
        )
        print(f"{OK} App LLMService works -> {out!r}")
    except Exception as exc:  # noqa: BLE001
        print(f"{FAIL} App LLMService failed: {type(exc).__name__}: {exc}")
        return 1

    print("-" * 60)
    print(f"{OK} LLM is LIVE. AI endpoints will return ai_generated=true.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
