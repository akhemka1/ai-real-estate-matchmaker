// Typed client for the FastAPI backend. Reads NEXT_PUBLIC_API_BASE_URL and
// attaches the logged-in JWT from the auth store (local demo tokens are ignored).
import { useAuthStore } from "@/stores/auth-store";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function isBackendConfigured(): boolean {
  return Boolean(API_BASE);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new ApiError(0, "Backend not configured (set NEXT_PUBLIC_API_BASE_URL).");
  }
  const token = useAuthStore.getState().token;
  const isRealToken = Boolean(token && !token.startsWith("local-"));
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (isRealToken) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, `Could not reach the backend at ${API_BASE}.`);
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : detail;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

// --- AI ----------------------------------------------------------------
export interface AiStatus {
  llm_enabled: boolean;
  provider: string;
  model: string | null;
}

export interface GenerateDescriptionPayload {
  city: string;
  property_type: string;
  listing_type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  amenities: string[];
  tone: string;
}

export interface GenerateDescriptionResult {
  headline: string;
  description: string;
  model_version: string;
  ai_generated: boolean;
}

export interface AssistantResult {
  answer: string;
  model_version: string;
  ai_generated: boolean;
}

export const api = {
  aiStatus: () => request<AiStatus>("/api/v1/ai/status"),
  generateDescription: (payload: GenerateDescriptionPayload) =>
    request<GenerateDescriptionResult>("/api/v1/ai/generate-description", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  assistant: (question: string, context?: string) =>
    request<AssistantResult>("/api/v1/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ question, context }),
    }),
};
