/**
 * Cursor SDK — extend the NestMatch AI UI with an agent.
 *
 * Prerequisites:
 *   1. npm install @cursor/sdk
 *   2. export CURSOR_API_KEY="cursor_..."  (Dashboard → Integrations)
 *
 * Usage:
 *   npm run sdk:extend-ui
 *   npm run sdk:extend-ui -- "Add an admin dashboard page at /admin"
 */

import { Agent, CursorAgentError } from "@cursor/sdk";
import * as path from "path";

const PROMPT =
  process.argv.slice(2).join(" ") ||
  `You are extending the NestMatch AI real estate UI in this repo.

Add or improve:
1. Admin dashboard at src/app/(admin)/admin/page.tsx with user/listing moderation stats
2. Map view placeholder upgrade at src/app/(marketing)/properties/map/page.tsx with a styled map container
3. Mortgage calculator page at src/app/(marketing)/tools/mortgage-calculator/page.tsx

Match existing patterns: Tailwind, shadcn-style components in src/components/ui, mock data from @/lib/mock-data.
Do not break existing pages. Run type-check mentally and keep imports consistent.`;

async function main() {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing CURSOR_API_KEY. Get one at https://cursor.com/dashboard/integrations"
    );
    process.exit(1);
  }

  const cwd = path.resolve(__dirname, "..");

  try {
    const result = await Agent.prompt(PROMPT, {
      apiKey,
      model: { id: "composer-2.5" },
      local: { cwd },
    });

    if (result.status === "error") {
      console.error("Run failed:", result.id);
      process.exit(2);
    }

    console.log("Agent finished:", result.status);
    if (result.result) console.log(result.result);
    process.exit(0);
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(
        `Startup failed: ${err.message} (retryable=${err.isRetryable})`
      );
      process.exit(1);
    }
    throw err;
  }
}

main();
