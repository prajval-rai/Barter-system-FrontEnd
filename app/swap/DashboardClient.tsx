"use client";
import AppShell from "@/components/AppShell/Appshell ";
import DashboardTopBar from "./Dashboardtopbar";
import DashboardHero from "./Dashboardhero";
import styles from "./Dashboard.module.css";
import SwapRequests from "./Swaprequests";
import MoreMatches from "./Morematches";
import BrowseByCategory from "./Browsebycategory";
import YourListings from "./Yourlistings";
import NearbyItems from "./Nearbyitems";
import EmptyWelcomeHero from "./empty/Emptywelcomehero";

interface DashboardClientProps {
  hasProducts: boolean;
  completionPercentage: number;
}

export default function DashboardClient({ hasProducts, completionPercentage }: DashboardClientProps) {
  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.heroBg}>
          <DashboardTopBar completionPercentage={completionPercentage} />
          {hasProducts ? <DashboardHero /> : <EmptyWelcomeHero />}
        </div>
        <div className={styles.pageBody}>
          <SwapRequests hasProducts={hasProducts} />
          <MoreMatches />
          <BrowseByCategory />
          <YourListings />
          <NearbyItems completionPercentage={completionPercentage} />
        </div>
      </div>
    </AppShell>
  );
}