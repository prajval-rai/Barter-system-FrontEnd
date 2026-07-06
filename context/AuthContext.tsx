"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  image: string | null;
  address: string;
  lat: number;
  long: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (googleIdToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const defaultValue: AuthContextValue = {
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
  updateUser: () => {},
};

const AuthContext = createContext<AuthContextValue>(defaultValue);

// ✅ Now calls Next.js proxy instead of Django directly
async function callDjangoGoogleLogin(token: string): Promise<AuthUser> {
  const res = await fetch(`/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }

  const data = await res.json();
  const { id, firstName, lastName, email, role, address, lat, long } = data.user;

  return {
    id, email,
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    name: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
    image: null,
    role, address, lat, long,
  };
}

async function callDjangoLogout() {
  try {
    await fetch(`/api/auth/logout/`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("LenDen_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("LenDen_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (googleIdToken: string) => {
    let picture: string | null = null;
    try {
      const base64 = googleIdToken
        .split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      picture = payload.picture ?? null;
    } catch { /* ignore */ }

    const authUser = await callDjangoGoogleLogin(googleIdToken);
    authUser.image = picture;

    setUser(authUser);
    sessionStorage.setItem("LenDen_user", JSON.stringify(authUser));
  };

  const logout = async () => {
    await callDjangoLogout();
    setUser(null);
    sessionStorage.removeItem("LenDen_user");
  };

  // Merge partial updates (e.g. after a profile save) into both state and
  // sessionStorage, so the rest of the app sees fresh data without a reload.
  const updateUser = (patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      sessionStorage.setItem("LenDen_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}