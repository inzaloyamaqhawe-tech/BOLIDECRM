import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ALLOWED_EMAIL_DOMAINS } from "../types";
import type { User } from "../types";
import { createUser, findUserByEmail, getUsers, updateUser, STORAGE_KEYS } from "./store";

async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // fallback for non-secure contexts — still not plaintext
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export function emailDomainAllowed(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain);
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    if (raw) {
      try {
        const { userId } = JSON.parse(raw);
        const u = findUserByEmailOrId(userId);
        if (u) setUser(u);
      } catch {
        /* ignore corrupt session */
      }
    }
    setLoading(false);
  }, []);

  function findUserByEmailOrId(id: string): User | undefined {
    // session stores id; users list is small so a linear scan is fine
    return getUsers().find((u: User) => u.id === id);
  }

  function persistSession(u: User) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ userId: u.id }));
  }

  async function login(email: string, password: string) {
    if (!emailDomainAllowed(email)) {
      return { ok: false as const, error: "Sign-in is limited to Bolide Group email domains." };
    }
    const existing = findUserByEmail(email);
    if (!existing) {
      return { ok: false as const, error: "No account found for that email. Create one first." };
    }
    if (!existing.passwordHash) {
      return { ok: false as const, error: "You've been invited but haven't set a password yet — use \"Create one\" below to finish setting up your account." };
    }
    const hash = await hashPassword(password);
    if (existing.passwordHash !== hash) {
      return { ok: false as const, error: "Incorrect password." };
    }
    setUser(existing);
    persistSession(existing);
    return { ok: true as const };
  }

  async function signup(name: string, email: string, password: string, confirmPassword: string) {
    if (!name.trim()) return { ok: false as const, error: "Enter your full name." };
    if (!emailDomainAllowed(email)) {
      return { ok: false as const, error: "Sign-up is limited to Bolide Group email domains (@bolide.co.za, @airnergize.co.za, @newgx.co.za)." };
    }
    if (password.length < 8) {
      return { ok: false as const, error: "Password must be at least 8 characters." };
    }
    if (password !== confirmPassword) {
      return { ok: false as const, error: "Passwords do not match — please re-enter both." };
    }
    const existingInvite = findUserByEmail(email);
    const passwordHash = await hashPassword(password);

    if (existingInvite) {
      if (existingInvite.passwordHash) {
        return { ok: false as const, error: "An account with that email already exists." };
      }
      // claiming an "invited" placeholder created from Settings → Access
      updateUser(existingInvite.id, { name: name.trim(), passwordHash });
      const claimed = { ...existingInvite, name: name.trim(), passwordHash };
      setUser(claimed);
      persistSession(claimed);
      return { ok: true as const };
    }

    const created = createUser({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash });
    setUser(created);
    persistSession(created);
    return { ok: true as const };
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.session);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
