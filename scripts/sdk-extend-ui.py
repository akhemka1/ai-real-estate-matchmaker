#!/usr/bin/env python3
"""
Cursor SDK (Python) — extend the NestMatch AI UI with an agent.

Prerequisites:
  pip install cursor-sdk
  set CURSOR_API_KEY=cursor_...   (Dashboard → Integrations)

Usage:
  python scripts/sdk-extend-ui.py
  python scripts/sdk-extend-ui.py "Add a neighborhood insights page"
"""

import os
import sys
from pathlib import Path

from cursor_sdk import Agent, AgentOptions, CursorAgentError, LocalAgentOptions

DEFAULT_PROMPT = """You are extending the NestMatch AI real estate UI in this repo.

Add or improve:
1. Admin dashboard at src/app/(admin)/admin/page.tsx
2. Map view at src/app/(marketing)/properties/map/page.tsx
3. Mortgage calculator at src/app/(marketing)/tools/mortgage-calculator/page.tsx

Match existing Tailwind + shadcn patterns. Use @/lib/mock-data. Do not break existing pages."""

def main() -> None:
    api_key = os.environ.get("CURSOR_API_KEY")
    if not api_key:
        print("Missing CURSOR_API_KEY", file=sys.stderr)
        sys.exit(1)

    prompt = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else DEFAULT_PROMPT
    cwd = str(Path(__file__).resolve().parent.parent)

    try:
        result = Agent.prompt(
            prompt,
            AgentOptions(
                api_key=api_key,
                model="composer-2.5",
                local=LocalAgentOptions(cwd=cwd),
            ),
        )
        if result.status == "error":
            print(f"Run failed: {result.id}", file=sys.stderr)
            sys.exit(2)
        print("Agent finished:", result.status)
        if result.result:
            print(result.result)
    except CursorAgentError as err:
        print(
            f"Startup failed: {err.message} (retryable={err.is_retryable})",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
