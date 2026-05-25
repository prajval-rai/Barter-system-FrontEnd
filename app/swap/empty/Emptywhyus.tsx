import styles from "./Emptywhyus.module.css";

const features = [
  {
    icon: <ShieldIcon />,
    title: "Verified Users",
    desc: "All users are verified for a safer experience.",
  },
  {
    icon: <LocationIcon />,
    title: "Local & Easy",
    desc: "Find people near you for easy exchange.",
  },
  {
    icon: <ChatIcon />,
    title: "Chat Securely",
    desc: "In-app chat keeps your conversations private.",
  },
  {
    icon: <StarIcon />,
    title: "Fair & Transparent",
    desc: "Ratings and reviews build trust in the community.",
  },
];

export default function EmptyWhyUs() {
  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>Why people love ExchangeIt?</h3>

      <div className={styles.grid}>
        {features.map((f) => (
          <div key={f.title} className={styles.feature}>
            <div className={styles.iconWrap}>{f.icon}</div>
            <div className={styles.text}>
              <p className={styles.featureTitle}>{f.title}</p>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}
function LocationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}