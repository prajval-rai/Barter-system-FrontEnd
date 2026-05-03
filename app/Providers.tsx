// app/Providers.tsx
"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "../components/Sidebar";

function NavbarWrapper() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return <Navbar user={user} onSignOut={logout} />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* <NavbarWrapper /> */}
      {children}
    </AuthProvider>
  );
}