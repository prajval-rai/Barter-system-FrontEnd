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
  setUser: (user: AuthUser | null) => void;   // ← ADD THIS
}

const AuthContext = createContext<AuthContextValue | null>(null);
const base_url = process.env.NEXT_PUBLIC_BACKEND_URL

async function callDjangoGoogleLogin(token: string): Promise<AuthUser> {
  const res = await fetch(`${base_url}accounts/login/`, {
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
    id,
    email,
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    name: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
    image: null,
    role,
    address,
    lat,
    long,
  };
}



async function callDjangoLogout() {
  try {
    await fetch(`${base_url}/auth/logout/`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore — clear local state regardless
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("ExchangeIt_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("ExchangeIt_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (googleIdToken: string) => {
    let picture: string | null = null;
    try {
      const payload = JSON.parse(atob(googleIdToken.split(".")[1]));
      picture = payload.picture ?? null;
    } catch {/* ignore */}

    const authUser = await callDjangoGoogleLogin(googleIdToken);
    authUser.image = picture;

    setUser(authUser);
    sessionStorage.setItem("ExchangeIt_user", JSON.stringify(authUser));
  };

  const logout = async () => {
    await callDjangoLogout();
    setUser(null);
    sessionStorage.removeItem("ExchangeIt_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>  {/* ← ADD setUser */}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}