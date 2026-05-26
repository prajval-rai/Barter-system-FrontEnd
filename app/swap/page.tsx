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
import EmptyWelcomeHero from "./empty/Emptywelcomehero";
import EmptyHowItWorks from "./empty/Emptyhowitworks";
import EmptyNoItems from "./empty/Emptynoitems";
import EmptyWhyUs from "./empty/Emptywhyus";

export default function DashboardPage() {
  const [hasProducts, setHasProducts]               = useState<boolean | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [incompleteFields, setIncompleteFields]     = useState<string[]>([]);
  const base_url    = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchCompletion = async () => {
    try {
      const res  = await fetch(`${base_url}accounts/completion/`, {
        credentials: "include",
      });
      const data = await res.json();
      setCompletionPercentage(data.completion_percentage ?? 0);
      setIncompleteFields(data.incomplete_fields ?? []);
    } catch {
      setCompletionPercentage(0);
      setIncompleteFields([]);
    }
  };

  useEffect(() => {
    const checkProducts = async () => {
      try {
        const res  = await fetch(`${base_url}products/my_product/`, {
          credentials: "include",
        });
        const data = await res.json();
        setHasProducts(Array.isArray(data) && data.length > 0);
      } catch {
        setHasProducts(false);
      }
    };

    checkProducts();
    fetchCompletion();
  }, []);

  if (hasProducts === null) {
    return (
      <AppShell>
        <div className={styles.loadingScreen}>
          <div className={styles.loadingSpinner} />
        </div>
      </AppShell>
    );
  }

  if (!hasProducts) {
    return (
      <AppShell>
        <div className={styles.emptyPage}>
          <DashboardTopBar />
          <EmptyWelcomeHero />
          <ProfileCompletionBanner
            progress={completionPercentage}
            incompleteFields={incompleteFields}
            onProfileSaved={fetchCompletion}
          />
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
          <DashboardTopBar />
          <DashboardHero />
        </div>
        <div className={styles.pageBody}>
          <ProfileCompletionBanner
            progress={completionPercentage}
            incompleteFields={incompleteFields}
            onProfileSaved={fetchCompletion}
          />
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
