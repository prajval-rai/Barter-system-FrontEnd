"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./Marketplacemap.module.css";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  category: number;
  category_name: string;
  status: string;
  created_at: string;
  purchase_year: number | null;
  owner_name: string;
  thumbnail: string | null;
  owner_latitude: number | null;
  owner_longitude: number | null;
  owner_address: string | null;
  replace_options: { id: number; title: string; icon?: string }[];
}

interface ApiResponse {
  results: Product[];
  count: number;
}

interface Props {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
}

interface ClusterGroup {
  lat: number;
  lng: number;
  products: Product[];
}

const PRODUCTS_API = `/api/marketplace`;
const INDIA_CENTER: [number, number] = [22.5937, 78.9629];
const INDIA_ZOOM = 5;

export default function MarketplaceMap({ categories, selectedCategory, onSelectCategory }: Props) {
  const router = useRouter();
  const mapRef         = useRef<HTMLDivElement>(null);
  const leafletMap     = useRef<any>(null);
  const clusterLayer   = useRef<any>(null);
  const locationMarker = useRef<any>(null);
  const boundaryLayer  = useRef<any>(null);
  const mapInitialized = useRef(false);
  const productsRef    = useRef<Product[]>([]);
  const zoomTimeout    = useRef<any>(null);
  const fitToAllOnce   = useRef(false);

  const [products,          setProducts         ] = useState<Product[]>([]);
  const [loading,           setLoading          ] = useState(true);
  const [activeProduct,     setActiveProduct    ] = useState<Product | null>(null);
  const [locating,          setLocating         ] = useState(false);
  const [locationError,     setLocationError    ] = useState<string | null>(null);
  const [isFilterOpen,      setIsFilterOpen     ] = useState(false);

  const activeCategoryName =
    categories.find((c) => c.id === selectedCategory)?.name ?? "All Categories";

  const handleSelectCategory = (id: number | null) => {
    onSelectCategory(id);
    setIsFilterOpen(false);
  };

  // ── Build a single pin marker ─────────────────────────────────────────────

  const buildPinMarker = useCallback((L: any, product: Product, lat: number, lng: number) => {
    const shortTitle = product.title.length > 14
      ? product.title.slice(0, 14) + "…"
      : product.title;

    const icon = L.divIcon({
      className: "",
      html: product.thumbnail
        ? `<div class="${styles.pin}">
             <img src="${product.thumbnail}" class="${styles.pinThumb}" alt="${product.title}" />
             <div class="${styles.pinLabel}">${shortTitle}</div>
             <div class="${styles.pinTip}"></div>
           </div>`
        : `<div class="${styles.pinNoImg}">
             <span class="${styles.pinEmoji}">📦</span>
             <div class="${styles.pinLabel}">${shortTitle}</div>
             <div class="${styles.pinTipNoImg}"></div>
           </div>`,
      iconSize:    [90, 80],
      iconAnchor:  [45, 80],
      popupAnchor: [0, -84],
    });

    const marker = L.marker([lat, lng], { icon, zIndexOffset: 100 });
    marker.on("click", (e: any) => {
      e.originalEvent?.stopPropagation();
      setActiveProduct(product);
    });
    return marker;
  }, []);

  // ── Group products into pixel-grid clusters at the CURRENT zoom level ─────

  const buildClusters = useCallback((L: any, map: any, list: Product[]): ClusterGroup[] => {
    const valid = list.filter((p) => p.owner_latitude != null && p.owner_longitude != null);
    if (valid.length === 0) return [];

    const isMobile = window.innerWidth <= 640;
    const gridSize = isMobile ? 46 : 62;
    const zoom = map.getZoom();

    const cellMap = new Map<string, ClusterGroup>();
    const clusters: ClusterGroup[] = [];

    valid.forEach((p) => {
      const point = map.project([p.owner_latitude!, p.owner_longitude!], zoom);
      const cellX = Math.floor(point.x / gridSize);
      const cellY = Math.floor(point.y / gridSize);
      const key = `${cellX}_${cellY}`;

      let cell = cellMap.get(key);
      if (!cell) {
        cell = { lat: p.owner_latitude!, lng: p.owner_longitude!, products: [] };
        cellMap.set(key, cell);
        clusters.push(cell);
      }
      cell.products.push(p);
    });

    clusters.forEach((c) => {
      const latSum = c.products.reduce((s, p) => s + p.owner_latitude!, 0);
      const lngSum = c.products.reduce((s, p) => s + p.owner_longitude!, 0);
      c.lat = latSum / c.products.length;
      c.lng = lngSum / c.products.length;
    });

    return clusters;
  }, []);

  // ── Plot clusters/pins on the map ──────────────────────────────────────────

  const plotClusters = useCallback(async (list: Product[]) => {
    if (!mapInitialized.current || !leafletMap.current || !clusterLayer.current) return;

    const L = await import("leaflet");
    const map = leafletMap.current;
    clusterLayer.current.clearLayers();

    const clusters = buildClusters(L, map, list);

    clusters.forEach((cluster) => {
      if (cluster.products.length === 1) {
        const marker = buildPinMarker(L, cluster.products[0], cluster.lat, cluster.lng);
        marker.addTo(clusterLayer.current);
        return;
      }

      const count = cluster.products.length;
      const size = count > 20 ? 60 : count > 8 ? 54 : 46;

      const clusterIcon = L.divIcon({
        className: "",
        html: `<div class="${styles.cluster}" style="width:${size}px;height:${size}px">
                 <span class="${styles.clusterInner}">
                   <span class="${styles.clusterCount}">${count}</span>
                   <span class="${styles.clusterLabel}">items</span>
                 </span>
               </div>`,
        iconSize:   [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const clusterMarker = L.marker([cluster.lat, cluster.lng], {
        icon: clusterIcon,
        zIndexOffset: 200,
      });

      clusterMarker.on("click", (e: any) => {
        e.originalEvent?.stopPropagation();
        const lats = cluster.products.map((p) => p.owner_latitude!);
        const lngs = cluster.products.map((p) => p.owner_longitude!);
        const latSpread = Math.max(...lats) - Math.min(...lats);
        const lngSpread = Math.max(...lngs) - Math.min(...lngs);

        if (latSpread < 0.001 && lngSpread < 0.001) {
          map.setView([cluster.lat, cluster.lng], Math.min(map.getZoom() + 4, 18), {
            animate: true,
          });
        } else {
          const bounds = L.latLngBounds(
            cluster.products.map((p) => [p.owner_latitude!, p.owner_longitude!])
          );
          map.fitBounds(bounds, { padding: [70, 70], maxZoom: 18, animate: true });
        }
      });

      clusterMarker.addTo(clusterLayer.current);
    });

    if (clusters.length === 0) {
      map.setView(INDIA_CENTER, INDIA_ZOOM);
    }
  }, [buildClusters, buildPinMarker]);

  const fitBoundsToAll = useCallback((L: any, map: any, list: Product[]) => {
    const valid = list.filter((p) => p.owner_latitude != null && p.owner_longitude != null);
    if (valid.length === 0) return;
    const bounds = L.latLngBounds(valid.map((p) => [p.owner_latitude!, p.owner_longitude!]));
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 13, animate: false });
  }, []);

  // ── India boundary overlay ──────────────────────────────────────────────

  const loadIndiaBoundary = useCallback(async (L: any, map: any) => {
    try {
      const res = await fetch("/india-boundary.geojson");
      if (!res.ok) return;
      const geojson = await res.json();

      boundaryLayer.current = L.geoJSON(geojson, {
        style: {
          color: "#2563eb",
          weight: 2,
          opacity: 0.85,
          fill: false,
          lineCap: "round",
          lineJoin: "round",
        },
        interactive: false,
        pane: "overlayPane",
      }).addTo(map);

      if (clusterLayer.current) clusterLayer.current.bringToFront();
    } catch (err) {
      console.warn("[MarketplaceMap] Failed to load India boundary:", err);
    }
  }, []);

  // ── Locate user ────────────────────────────────────────────────────────

  const placeYouMarker = useCallback(async (lat: number, lng: number, openPopup: boolean) => {
    const L = await import("leaflet");
    if (locationMarker.current && leafletMap.current) {
      leafletMap.current.removeLayer(locationMarker.current);
    }
    const youIcon = L.divIcon({
      className: "",
      html: `<div class="${styles.youDot}">
               <div class="${styles.youPulse}"></div>
               <div class="${styles.youCore}"></div>
             </div>`,
      iconSize:   [36, 36],
      iconAnchor: [18, 18],
    });
    const marker = L.marker([lat, lng], { icon: youIcon, zIndexOffset: 500 });
    if (openPopup) {
      marker.bindPopup(
        `<div style="font-family:'DM Sans',sans-serif;padding:6px 4px;text-align:center">
           <strong style="font-size:0.85rem">📍 You are here</strong>
         </div>`,
        { maxWidth: 160 }
      );
    }
    if (leafletMap.current) {
      marker.addTo(leafletMap.current);
      locationMarker.current = marker;
      if (openPopup) marker.openPopup();
    }
  }, []);

  const locateUser = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        await placeYouMarker(lat, lng, true);
        if (leafletMap.current) {
          leafletMap.current.setView([lat, lng], 14, { animate: true });
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError("Location access denied. Please allow it in browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable. Try again.");
            break;
          default:
            setLocationError("Could not get your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [placeYouMarker]);

  const silentLocate = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => placeYouMarker(pos.coords.latitude, pos.coords.longitude, false),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [placeYouMarker]);

  // ── Init Leaflet map ONCE ─────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined" || leafletMap.current) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!mapRef.current || leafletMap.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const isMobile = window.innerWidth <= 640;

      // `tap` isn't in the current @types/leaflet MapOptions typing,
      // so build the options object as `any` and cast on use.
      const mapOptions: any = {
        center:      INDIA_CENTER,
        zoom:        isMobile ? INDIA_ZOOM - 1 : INDIA_ZOOM,
        zoomControl: false,
        tap:         true,
      };

      const map = L.map(mapRef.current, mapOptions as L.MapOptions);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      clusterLayer.current   = L.layerGroup().addTo(map);
      leafletMap.current     = map;
      mapInitialized.current = true;

      loadIndiaBoundary(L, map);

      map.on("zoomend", () => {
        if (zoomTimeout.current) clearTimeout(zoomTimeout.current);
        zoomTimeout.current = setTimeout(() => {
          plotClusters(productsRef.current);
        }, 80);
      });

      if (productsRef.current.length > 0) {
        plotClusters(productsRef.current);
      }

      silentLocate();

      const resizeObserver = new ResizeObserver(() => map.invalidateSize());
      if (mapRef.current) resizeObserver.observe(mapRef.current);
      (map as any)._resizeObserver = resizeObserver;
    });

    return () => {
      if (leafletMap.current) {
        (leafletMap.current as any)._resizeObserver?.disconnect();
        leafletMap.current.off("zoomend");
        leafletMap.current.remove();
        leafletMap.current     = null;
        clusterLayer.current   = null;
        locationMarker.current = null;
        boundaryLayer.current  = null;
        mapInitialized.current = false;
      }
      if (zoomTimeout.current) clearTimeout(zoomTimeout.current);
    };
  }, [plotClusters, silentLocate, loadIndiaBoundary]);

  // ── Fetch products ────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: "1", page_size: "100", sort: "newest" });
    if (selectedCategory) params.set("category", String(selectedCategory));

    fetch(`${PRODUCTS_API}?${params.toString()}`)
      .then((r) => {
        if (r.status === 401) { window.location.href = "/login"; return; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(async (data: ApiResponse) => {
        const list = data.results ?? [];
        productsRef.current = list;
        setProducts(list);
        await plotClusters(list);

        if (!fitToAllOnce.current && mapInitialized.current) {
          const L = await import("leaflet");
          fitBoundsToAll(L, leafletMap.current, list);
          fitToAllOnce.current = true;
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("MarketplaceMap fetch error:", err);
        setLoading(false);
      });
  }, [selectedCategory, plotClusters, fitBoundsToAll]);

  // ── Global nav handler ────────────────────────────────────────────────────

  useEffect(() => {
    (window as any).__mapGoTo = (id: string) => router.push(`/products/${id}`);
    return () => { delete (window as any).__mapGoTo; };
  }, [router]);

  const validOnMapCount = products.filter(
    (p) => p.owner_latitude != null && p.owner_longitude != null
  ).length;

  return (
    <div className={styles.wrapper}>
      {/* Full-bleed map fills the entire area behind everything */}
      <div className={styles.mapWrap}>
        <div ref={mapRef} className={styles.map} />

        {/* Floating top-left info pill */}
        <div className={styles.infoPill}>
          <span className={styles.infoHeading}>Listings Near You</span>
          <span className={styles.infoCount}>
            {loading ? "Loading…" : `${validOnMapCount} on map`}
          </span>
        </div>

        {/* Floating filter button — native to the map, single source of truth */}
        <button
          className={styles.filterBtn}
          onClick={() => setIsFilterOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isFilterOpen}
        >
          {selectedCategory !== null && <span className={styles.filterDot} />}
          <span className={styles.filterBtnText}>{activeCategoryName}</span>
        </button>

        {/* Category drawer */}
        {isFilterOpen && (
          <>
            <div className={styles.drawerBackdrop} onClick={() => setIsFilterOpen(false)} />
            <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Filter by category">
              <div className={styles.drawerHandle} />
              <div className={styles.drawerHeader}>
                <h3 className={styles.drawerTitle}>Filter by category</h3>
                <button
                  className={styles.drawerClose}
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className={styles.drawerList}>
                <button
                  className={`${styles.drawerItem} ${selectedCategory === null ? styles.drawerItemActive : ""}`}
                  onClick={() => handleSelectCategory(null)}
                >
                  <span>All Categories</span>
                  {selectedCategory === null && <span className={styles.drawerCheck}>✓</span>}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`${styles.drawerItem} ${selectedCategory === cat.id ? styles.drawerItemActive : ""}`}
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    <span>{cat.name}</span>
                    {selectedCategory === cat.id && <span className={styles.drawerCheck}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Locate Me button */}
        <button
          className={`${styles.locateBtn} ${locating ? styles.locateBtnLoading : ""}`}
          onClick={locateUser}
          aria-label="Show my location"
          title="Show my location"
        >
          {locating
            ? <span className={styles.locateSpinner} />
            : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                   strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            )
          }
        </button>

        {locationError && (
          <div className={styles.locationToast}>
            <span>⚠️ {locationError}</span>
            <button onClick={() => setLocationError(null)} aria-label="Dismiss">✕</button>
          </div>
        )}

        {loading && (
          <div className={styles.loadingOverlay}>
            <span className={styles.spinner} />
            <span className={styles.loadingText}>Finding listings…</span>
          </div>
        )}

        {!loading && validOnMapCount === 0 && (
          <div className={styles.emptyMapOverlay}>
            <span className={styles.emptyMapIcon}>📍</span>
            <p className={styles.emptyMapText}>No listings with a saved location yet.</p>
            <p className={styles.emptyMapSubtext}>Sellers need to add their address for items to appear here.</p>
          </div>
        )}

        {/* Side card / bottom sheet on pin click */}
        {activeProduct && (
          <div className={styles.sideCard}>
            <button className={styles.closeBtn} onClick={() => setActiveProduct(null)} aria-label="Close">
              ✕
            </button>
            {activeProduct.thumbnail && (
              <img src={activeProduct.thumbnail} className={styles.sideImg} alt={activeProduct.title} />
            )}
            <div className={styles.sideBody}>
              <span className={styles.sideCat}>{activeProduct.category_name}</span>
              <h3 className={styles.sideTitle}>{activeProduct.title}</h3>
              <p className={styles.sideDesc}>{activeProduct.description?.slice(0, 120)}…</p>
              {activeProduct.owner_address && (
                <p className={styles.sideAddress}>📍 {activeProduct.owner_address}</p>
              )}
              <p className={styles.sideOwner}>Listed by {activeProduct.owner_name}</p>
              <button
                className={styles.sideBtn}
                onClick={() => router.push(`/products/${activeProduct.id}`)}
              >
                View Listing →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
