"use client";

import { useState } from "react";
import {
  Shield, Package, Tag, LayoutGrid, ChevronRight,
  Store, Settings, Users, BarChart3,
} from "lucide-react";
import styles from "../styles/Adminhub.module.css";
import ManageMarketplace from "./Managemarketplace";
import ManageCategories from "./Managecategories";

/* ─── Nav items ─────────────────────────────────── */
type PanelId = "marketplace" | "categories" | "requests" | "users" | "analytics";

interface NavItem {
  id: PanelId;
  label: string;
  sub: string;
  Icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "marketplace", label: "Marketplace",       sub: "Review & moderate listings",  Icon: Store       },
  { id: "categories",  label: "Product Categories",sub: "Manage item categories",       Icon: Tag         },
  { id: "requests",    label: "Product Requests",  sub: "Pending seller submissions",   Icon: Package, badge: "soon" },
  { id: "users",       label: "User Management",   sub: "Accounts & permissions",       Icon: Users,   badge: "soon" },
  { id: "analytics",   label: "Analytics",         sub: "Traffic & listing insights",   Icon: BarChart3, badge: "soon" },
];

/* ─── Placeholder panel ─────────────────────────── */
function ComingSoon({ item }: { item: NavItem }) {
  return (
    <div className={styles.comingSoon}>
      <div className={styles.csIconWrap}><item.Icon size={32} /></div>
      <h2 className={styles.csTitle}>{item.label}</h2>
      <p className={styles.csSub}>{item.sub}</p>
      <span className={styles.csBadge}>Coming soon</span>
    </div>
  );
}

/* ================================================================
   ADMIN HUB
================================================================ */
export default function AdminHub() {
  const [active, setActive] = useState<PanelId>("marketplace");
  const [collapsed, setCollapsed] = useState(false);

  const activeItem = NAV_ITEMS.find(n => n.id === active)!;

  const renderPanel = () => {
    switch (active) {
      case "marketplace": return <ManageMarketplace />;
      case "categories":  return <ManageCategories />;
      default:            return <ComingSoon item={activeItem} />;
    }
  };

  return (
    <div className={styles.hub}>
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}><Shield size={20} /></div>
          {!collapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>Admin Panel</span>
              <span className={styles.brandSub}>Barter System</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          <div className={styles.navLabel}>{!collapsed && "Management"}</div>
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id;
            const isSoon   = item.badge === "soon";
            return (
              <button
                key={item.id}
                className={`${styles.navItem} ${isActive ? styles.navActive : ""} ${isSoon ? styles.navSoon : ""}`}
                onClick={() => !isSoon && setActive(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navIconWrap}>
                  <item.Icon size={16} />
                  {isActive && <span className={styles.navActiveDot} />}
                </span>
                {!collapsed && (
                  <span className={styles.navText}>
                    <span className={styles.navLabel2}>{item.label}</span>
                    <span className={styles.navSub}>{item.sub}</span>
                  </span>
                )}
                {!collapsed && item.badge && (
                  <span className={styles.soonBadge}>{item.badge}</span>
                )}
                {!collapsed && isActive && <ChevronRight size={13} className={styles.navChevron} />}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <LayoutGrid size={14} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Shield size={12} />
          <span>Admin</span>
          <ChevronRight size={11} />
          <span className={styles.breadCrumbActive}>{activeItem.label}</span>
        </div>

        {/* Panel */}
        <div className={styles.panelWrap}>
          {renderPanel()}
        </div>
      </main>
    </div>
  );
}