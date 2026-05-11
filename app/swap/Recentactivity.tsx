// components/home/RecentActivity.tsx
import React from "react";
import Link from "next/link";
import styles from "./RecentActivity.module.css";

export type ActivityType =
  | "offer_accepted"
  | "new_views"
  | "message"
  | "review";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timeAgo: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  onViewAll?: () => void;
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "offer_accepted",
    title: "Riya K. accepted your offer on Design books",
    subtitle: "Exchange confirmed — arrange a meetup",
    timeAgo: "2 min ago",
  },
  {
    id: "2",
    type: "new_views",
    title: "Your Canon EOS 200D got 8 new views",
    subtitle: "3 people bookmarked it this week",
    timeAgo: "1 hr ago",
  },
  {
    id: "3",
    type: "message",
    title: "Aman T. sent you a message",
    subtitle: '"Is the camera still available?"',
    timeAgo: "3 hrs ago",
  },
  {
    id: "4",
    type: "review",
    title: "Vikram S. left you a review — 5 stars",
    subtitle: '"Smooth exchange, very reliable!"',
    timeAgo: "Yesterday",
  },
];

const ACTIVITY_ICONS: Record<ActivityType, { icon: string; bg: string; color: string }> = {
  offer_accepted: { icon: "✅", bg: "#DCFCE7", color: "#15803D" },
  new_views:      { icon: "👁",  bg: "#EFF6FF", color: "#1D4ED8" },
  message:        { icon: "💬", bg: "#F5F3FF", color: "#7C3AED" },
  review:         { icon: "⭐", bg: "#FEF9C3", color: "#92400E" },
};

export default function RecentActivity({
  activities = DEFAULT_ACTIVITIES,
  onViewAll,
}: RecentActivityProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Recent activity</h2>
        <Link href="/activity" onClick={onViewAll} className={styles.viewAll}>
          View all →
        </Link>
      </div>

      <div className={styles.list}>
        {activities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const cfg = ACTIVITY_ICONS[activity.type];

  return (
    <div className={styles.row}>
      <div
        className={styles.rowIcon}
        style={{ background: cfg.bg }}
      >
        {cfg.icon}
      </div>

      <div className={styles.rowText}>
        <p className={styles.rowTitle}>{activity.title}</p>
        <p className={styles.rowSubtitle}>{activity.subtitle}</p>
      </div>

      <span className={styles.rowTime}>{activity.timeAgo}</span>
    </div>
  );
}