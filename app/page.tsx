"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import Marketplace from "@/components/Marketplace";
import ExchangeRequests from "@/components/ExchangeRequests";
import MyProducts from "@/components/MyProducts";
import AddProduct from "@/components/AddProduct";
import Chats from "@/components/Chats";
import ManageMarketplace from "@/components/Managemarketplace";
import AdminHub from "@/components/Adminhub";
import {
  Notifications,
  TradeHistory,
  Wishlist,
  Settings,
} from "@/components/OtherPages";

import { Profile } from "@/components/Profile";

import styles from "@/styles/Pages.module.css";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeId, setActiveId] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // ← track collapsed

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--black)", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
      }}>
        <div style={{ fontSize: 52 }}>⚖️</div>
        <div style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: 3 }}>
          LOADING ExchangeIT...
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%", background: "var(--gold)",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderPage = () => {
    switch (activeId) {
      case "dashboard":            return <Dashboard onNavigate={setActiveId} />;
      case "marketplace":          return <Marketplace onNavigate={setActiveId} />;
      case "requests":             return <ExchangeRequests onNavigate={setActiveId} />;
      case "my-products":          return <MyProducts onNavigate={setActiveId} />;
      case "add-product":          return <AddProduct onNavigate={setActiveId} />;
      case "chats":                return <Chats />;
      case "history":              return <TradeHistory />;
      case "notifications":        return <Notifications onNavigate={setActiveId} />;
      case "profile":              return <Profile />;
      case "wishlist":             return <Wishlist onNavigate={setActiveId} />;
      case "settings":             return <Settings />;
      case "manage-marketplace":   return <AdminHub />;
      default:                     return <Dashboard onNavigate={setActiveId} />;
    }
  };

  return (
    // No flex needed on layout — main uses margin-left to clear the fixed sidebar
    <div style={{ minHeight: "100vh", background: "var(--black)" }}>
      <Sidebar
        activeId={activeId}
        onSelect={setActiveId}
        user={user}
        onCollapsedChange={setSidebarCollapsed} // ← new prop
        onSignOut={async () => {
          await logout();
          router.replace("/login");
        }}
      />
      <main
        className={`${styles.main} ${sidebarCollapsed ? styles.mainCollapsed : ""}`}
      >
        {renderPage()}
      </main>
    </div>
  );
}