import styles from "@/styles/Pages.module.css";
import { currentUser, products, exchangeRequests, notifications } from "@/data/mockData";

interface DashboardProps {
  onNavigate: (id: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const pendingRequests = exchangeRequests.filter((r) => r.status === "pending");
  const unread = notifications.filter((n) => !n.read);

  const stats = [
    { icon: "📦", value: "2", label: "My Listings" },
    { icon: "🔄", value: String(pendingRequests.length), label: "Pending Requests" },
    { icon: "✅", value: "23", label: "Completed Trades" },
    { icon: "⭐", value: "4.8", label: "My Rating" },
  ];

  return (
    <div className={styles.pageWrap}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <div>
            <h1 className={styles.pageTitle}>Good Morning, {currentUser.name.split(" ")[0]} 👋</h1>
            <p className={styles.pageSubtitle}>Here's what's happening with your trades today</p>
          </div>
          <button className={`${styles.btn} ${styles.btnGold}`} onClick={() => onNavigate("add-product")}>
            ➕ Add Product
          </button>
        </div>
        <div className={styles.goldLine} />
      </div>

      {/* Stats */}
      <div className={`${styles.grid4} fadeIn`} style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statIcon}>{s.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        {/* Pending Requests */}
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif", fontSize: 15 }}>🔄 Pending Requests</h3>
            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => onNavigate("requests")}>
              View All
            </button>
          </div>
          {pendingRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <div className={styles.emptyText}>No pending requests</div>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div className={styles.avatarMd}>{req.fromUser.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{req.fromUser.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0" }}>
                    Wants: <span style={{ color: "var(--gold)" }}>{req.requestedProduct.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Offers: {req.offeredProduct.title}</div>
                </div>
                <span className="badge badge-warning">Pending</span>
              </div>
            ))
          )}
        </div>

        {/* Notifications */}
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif", fontSize: 15 }}>🔔 Notifications</h3>
            <span className="badge badge-gold">{unread.length} new</span>
          </div>
          {notifications.slice(0, 4).map((n) => (
            <div key={n.id} className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ""}`}>
              <div style={{ fontSize: 18 }}>
                {n.type === "request" ? "🔄" : n.type === "accepted" ? "✅" : n.type === "message" ? "💬" : "🏆"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{n.timestamp}</div>
              </div>
              {!n.read && <div className={styles.notifDot} />}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Marketplace */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif", fontSize: 16 }}>🛍️ Recent Marketplace</h3>
          <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => onNavigate("marketplace")}>
            Browse All
          </button>
        </div>
        <div className={styles.grid4}>
          {products.slice(0, 4).map((p) => (
            <div key={p.id} className={styles.productCard}>
              <div className={styles.productEmoji}>{p.images[0]}</div>
              <div className={styles.productBody}>
                <div className={styles.productTitle}>{p.title}</div>
                <div className={styles.productMeta}>
                  <span className="badge badge-gold">{p.condition}</span>
                  <span className={styles.productValue}>₹{p.estimatedValue.toLocaleString()}</span>
                </div>
              </div>
              <div className={styles.productFooter}>
                <button className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`} style={{ flex: 1 }} onClick={() => onNavigate("marketplace")}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}