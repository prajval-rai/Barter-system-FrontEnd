"use client";

import { useEffect, useState } from "react";
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

// Empty state components
import EmptyWelcomeHero from "./empty/Emptywelcomehero";
import EmptyHowItWorks from "./empty/Emptyhowitworks";
import EmptyNoItems from "./empty/Emptynoitems";
import EmptyWhyUs from "./empty/Emptywhyus";

export default function DashboardPage() {
  const [hasProducts, setHasProducts] = useState<boolean | null>(null);

  useEffect(() => {
    const checkProducts = async () => {
      try {
        const res = await fetch("http://localhost:8000/products/my_product/", {
          credentials: "include",
        });
        const data = await res.json();
        setHasProducts(Array.isArray(data) && data.length > 0);
      } catch {
        setHasProducts(false);
      }
    };
    checkProducts();
  }, []);

  // Loading state
  if (hasProducts === null) {
    return (
      <AppShell>
        <div className={styles.loadingScreen}>
          <div className={styles.loadingSpinner} />
        </div>
      </AppShell>
    );
  }

  // Empty state — no products uploaded yet
  if (!hasProducts) {
    return (
      <AppShell>
        <div className={styles.emptyPage}>
          <DashboardTopBar />
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

  // Normal dashboard — has products
  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.heroBg}>
          <DashboardTopBar />
          <DashboardHero />
        </div>
        <div className={styles.pageBody}>
          <ProfileCompletionBanner />
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