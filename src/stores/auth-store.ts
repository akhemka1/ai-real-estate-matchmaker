import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@/types";

// When a backend is configured, auth goes through the real (Supabase-backed)
// API. Otherwise we validate against locally-registered accounts so the demo
// still enforces "you must sign up before you can log in".
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// cyrb53 — a fast non-cryptographic hash so passwords aren't stored in plaintext
// in the local (no-backend) demo store. Real hashing happens server-side (bcrypt).
function hashPassword(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

interface BackendUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url?: string | null;
  phone?: string | null;
  created_at?: string;
}

function mapBackendUser(u: BackendUser): User {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    role: u.role,
    avatarUrl: u.avatar_url ?? undefined,
    phone: u.phone ?? undefined,
    createdAt: u.created_at ?? new Date().toISOString(),
  };
}

interface StoredAccount {
  passwordHash: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  accounts: Record<string, StoredAccount>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      accounts: {},

      login: async (email, password) => {
        const key = email.trim().toLowerCase();

        if (API_BASE) {
          const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: key, password }),
          });
          if (!res.ok) throw new Error("Invalid email or password");
          const data = await res.json();
          set({ user: mapBackendUser(data.user), token: data.access_token, isAuthenticated: true });
          return;
        }

        // Local demo: the account must exist and the password must match.
        const account = get().accounts[key];
        if (!account || account.passwordHash !== hashPassword(password)) {
          throw new Error("Invalid email or password");
        }
        set({ user: account.user, token: `local-${account.user.id}`, isAuthenticated: true });
      },

      register: async (input) => {
        const key = input.email.trim().toLowerCase();

        if (API_BASE) {
          const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: key,
              password: input.password,
              first_name: input.firstName,
              last_name: input.lastName,
              role: input.role,
              phone: input.phone,
            }),
          });
          if (res.status === 409) throw new Error("An account with this email already exists");
          if (!res.ok) throw new Error("Could not create account. Please try again.");
          const data = await res.json();
          set({ user: mapBackendUser(data.user), token: data.access_token, isAuthenticated: true });
          return;
        }

        // Local demo: refuse duplicates and persist the new account.
        if (get().accounts[key]) {
          throw new Error("An account with this email already exists");
        }
        const user: User = {
          id: `u-${hashPassword(key)}`,
          email: key,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
          phone: input.phone,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          accounts: { ...s.accounts, [key]: { passwordHash: hashPassword(input.password), user } },
          user,
          token: `local-${user.id}`,
          isAuthenticated: true,
        }));
      },

      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "nestmatch-auth",
      partialize: (s) => ({
        accounts: s.accounts,
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
