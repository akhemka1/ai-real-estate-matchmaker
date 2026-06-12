"use client";

import type { UserRole } from "@/types";

/**
 * Google / Firebase sign-in helper.
 *
 * The Firebase Web SDK is loaded from the CDN at runtime (only when configured)
 * via a bundler-opaque dynamic import, so the app builds and runs without adding
 * the `firebase` npm package. When `NEXT_PUBLIC_FIREBASE_*` env vars are not set,
 * `signInWithGoogle` returns a mock Google identity so the demo still works.
 *
 * To enable real Google sign-in, set in `.env.local`:
 *   NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID
 *   (optional) NEXT_PUBLIC_API_BASE_URL to exchange the token with the backend.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

export interface GoogleProfile {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  idToken: string | null;
}

// Hidden from webpack so the URL import stays a native runtime ESM import.
const nativeImport: (url: string) => Promise<Record<string, (...args: unknown[]) => unknown>> =
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function("url", "return import(url)") as never;

const FIREBASE_VERSION = "10.12.5";

export async function signInWithGoogle(): Promise<GoogleProfile> {
  if (!isFirebaseConfigured()) {
    // Demo mode — no Firebase project configured.
    return {
      email: "demo.user@gmail.com",
      firstName: "Google",
      lastName: "User",
      idToken: null,
    };
  }

  const appMod = await nativeImport(
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`
  );
  const authMod = await nativeImport(
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`
  );

  const { initializeApp, getApps, getApp } = appMod as unknown as {
    initializeApp: (c: typeof firebaseConfig) => unknown;
    getApps: () => unknown[];
    getApp: () => unknown;
  };
  const { getAuth, GoogleAuthProvider, signInWithPopup } = authMod as unknown as {
    getAuth: (app: unknown) => unknown;
    GoogleAuthProvider: new () => unknown;
    signInWithPopup: (auth: unknown, provider: unknown) => Promise<GoogleSignInResult>;
  };

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());

  const name = result.user.displayName ?? "";
  const [firstName, ...rest] = name.split(" ");
  return {
    email: result.user.email ?? "",
    firstName: firstName || "Google",
    lastName: rest.join(" ") || "User",
    avatarUrl: result.user.photoURL ?? undefined,
    idToken: await result.user.getIdToken(),
  };
}

interface GoogleSignInResult {
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    getIdToken: () => Promise<string>;
  };
}

/** Exchange a Firebase ID token for a backend session (when a backend is wired). */
export async function exchangeFirebaseToken(idToken: string, role: UserRole): Promise<unknown> {
  if (!apiBaseUrl) return null;
  const res = await fetch(`${apiBaseUrl}/api/v1/auth/firebase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken, role }),
  });
  if (!res.ok) throw new Error("Backend rejected the Firebase token");
  return res.json();
}
