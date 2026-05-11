

import AppShell from "@/components/AppShell/Appshell ";
import DashboardTopBar from "./Dashboardtopbar";
import DashboardHero from "./Dashboardhero";
import styles from "./Dashboard.module.css";
import SwapRequests from "./Swaprequests";
import ProfileCompletionBanner from "./Profilecompletionbanner";
import MoreMatches from "./Morematches";
import BrowseByCategory from "./Browsebycategory";
import YourListings from "./Yourlistings";
import NearbyItems from "./Nearbyitems";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className={styles.page}>
        {/* Gradient hero background wraps topbar + hero section */}
        <div className={styles.heroBg}>
          <DashboardTopBar />
          <DashboardHero />
          
        </div>

        {/* Rest of page content below hero */}
        <div className={styles.pageBody}>
          <ProfileCompletionBanner></ProfileCompletionBanner>
          <SwapRequests></SwapRequests>
          <MoreMatches></MoreMatches>
          <BrowseByCategory></BrowseByCategory>
          <YourListings></YourListings>
          <NearbyItems></NearbyItems>
        </div>
      </div>
    </AppShell>
  );
}