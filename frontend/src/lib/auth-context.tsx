"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  api,
  getStoredJWT,
  clearStoredTokens,
} from "@/lib/api";
import type { Tenant, SignupResponse } from "@/lib/api";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthState {
  tenant: Tenant | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<SignupResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    // Synchronously check if there's a JWT to avoid an extra render
    return typeof window !== "undefined" && !!localStorage.getItem("cerberus_jwt");
  });

  // On mount, rehydrate from stored JWT
  useEffect(() => {
    const jwt = getStoredJWT();
    if (!jwt) return;

    let cancelled = false;
    api
      .getMe()
      .then((t) => { if (!cancelled) setTenant(t); })
      .catch(() => {
        if (!cancelled) {
          clearStoredTokens();
          setTenant(null);
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setTenant({
      id: res.tenant.id,
      name: res.tenant.name,
      email: res.tenant.email,
      tier: res.tenant.tier as Tenant["tier"],
      is_active: true,
      created_at: new Date().toISOString(),
    });
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await api.signup(name, email, password);
      setTenant({
        id: result.tenant.id,
        name: result.tenant.name,
        email: result.tenant.email,
        tier: result.tenant.tier as Tenant["tier"],
        is_active: true,
        created_at: new Date().toISOString(),
      });
      return result;
    },
    [],
  );

  const logout = useCallback(() => {
    api.logout();
    setTenant(null);
    window.location.href = "/login";
  }, []);

  const value = useMemo<AuthState>(
    () => ({ tenant, isLoading, login, signup, logout }),
    [tenant, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
