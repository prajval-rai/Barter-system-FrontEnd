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
import EmptyHowItWorks from "./empty/Emptyhowitworks";
import EmptyNoItems from "./empty/Emptynoitems";
import EmptyWhyUs from "./empty/Emptywhyus";

interface DashboardClientProps {
  hasProducts: boolean;
  completionPercentage: number;
}

export default function DashboardClient({ hasProducts, completionPercentage }: DashboardClientProps) {
  if (!hasProducts) {
    return (
      <AppShell>
        <div className={styles.emptyPage}>
          <DashboardTopBar completionPercentage={completionPercentage} />
          <EmptyWelcomeHero />
          <EmptyHowItWorks />
          <div className={styles.emptyBottomGrid}>
            <EmptyNoItems />
            <EmptyWhyUs />
          </div>
          <div className={styles.pageBody}>
            <NearbyItems />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.heroBg}>
          <DashboardTopBar completionPercentage={completionPercentage} />
          <DashboardHero />
        </div>
        <div className={styles.pageBody}>
          <SwapRequests />
          <MoreMatches />
          <BrowseByCategory />
          <YourListings />
          <NearbyItems />
        </div>
      </div>
    </AppShell>
  );
}
