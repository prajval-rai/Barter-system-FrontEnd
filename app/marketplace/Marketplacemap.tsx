"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./Marketplacemap.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCTS_API = `/api/marketplace`;
const INDIA_CENTER: [number, number] = [22.5937, 78.9629];
const INDIA_ZOOM = 5;

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarketplaceMap({ categories }: Props) {
  const router = useRouter();
  const mapRef          = useRef<HTMLDivElement>(null);
  const leafletMap      = useRef<any>(null);
  const markersLayer    = useRef<any>(null);
  const spiderLayer     = useRef<any>(null);
  const locationMarker  = useRef<any>(null);
  const boundaryLayer   = useRef<any>(null); // ← NEW: holds the GeoJSON overlay
  const pendingPlot     = useRef<Product[] | null>(null);
  const mapInitialized  = useRef(false);
  const allBounds       = useRef<[number, number][]>([]);

  const [products,          setProducts         ] = useState<Product[]>([]);
  const [selectedCategory,  setSelectedCategory ] = useState<number | null>(null);
  const [loading,           setLoading          ] = useState(true);
  const [activeProduct,     setActiveProduct    ] = useState<Product | null>(null);
  const [locating,          setLocating         ] = useState(false);
  const [locationError,     setLocationError    ] = useState<string | null>(null);

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

    const marker = L.marker([lat, lng], { icon });
    marker.on("click", () => setActiveProduct(product));
    return marker;
  }, []);

  // ── Plot markers ──────────────────────────────────────────────────────────

  const plotMarkers = useCallback(async (productList: Product[]) => {
    if (!mapInitialized.current || !leafletMap.current || !markersLayer.current) {
      pendingPlot.current = productList;
      return;
    }

    const L = await import("leaflet");
    markersLayer.current.clearLayers();

    if (spiderLayer.current) {
      spiderLayer.current.clearLayers();
    } else {
      spiderLayer.current = L.layerGroup().addTo(leafletMap.current);
    }

    const valid = productList.filter(
      (p) => p.owner_latitude != null && p.owner_longitude != null
    );

    if (valid.length === 0) {
      leafletMap.current.setView(INDIA_CENTER, INDIA_ZOOM);
      return;
    }

    const groups = new Map<string, Product[]>();
    valid.forEach((p) => {
      const key = `${p.owner_latitude!.toFixed(4)},${p.owner_longitude!.toFixed(4)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });

    const bounds: [number, number][] = [];

    groups.forEach((groupProducts, key) => {
      const [baseLat, baseLng] = key.split(",").map(Number);

      if (groupProducts.length === 1) {
        const marker = buildPinMarker(L, groupProducts[0], baseLat, baseLng);
        marker.addTo(markersLayer.current);
        bounds.push([baseLat, baseLng]);
      } else {
        const clusterIcon = L.divIcon({
          className: "",
          html: `<div class="${styles.cluster}">
                   <span class="${styles.clusterInner}">
                     <span class="${styles.clusterCount}">${groupProducts.length}</span>
                     <span class="${styles.clusterLabel}">items</span>
                   </span>
                 </div>`,
          iconSize:   [52, 52],
          iconAnchor: [26, 26],
        });

        const clusterMarker = L.marker([baseLat, baseLng], {
          icon: clusterIcon,
          zIndexOffset: 200,
        });

        let spiderfied     = false;
        const spiderMarkers: any[] = [];
        const spiderLines:   any[] = [];

        const collapse = () => {
          spiderMarkers.forEach((m) => spiderLayer.current?.removeLayer(m));
          spiderLines.forEach((l)   => spiderLayer.current?.removeLayer(l));
          spiderMarkers.length = 0;
          spiderLines.length   = 0;
          spiderfied = false;
          if (allBounds.current.length > 0) {
            leafletMap.current.fitBounds(allBounds.current, {
              padding: [80, 80], maxZoom: 13, animate: true,
            });
          }
        };

        const expand = () => {
          const count      = groupProducts.length;
          const radiusDeg  = 0.0005 + 0.00012 * count;
          const startAngle = -Math.PI / 2;

          groupProducts.forEach((product, i) => {
            const angle = startAngle + (2 * Math.PI * i) / count;
            const sLat  = baseLat + radiusDeg * Math.cos(angle);
            const sLng  = baseLng + radiusDeg * Math.sin(angle) * 1.5;

            const line = L.polyline(
              [[baseLat, baseLng], [sLat, sLng]],
              { color: "#3b82f6", weight: 1.5, opacity: 0.6, dashArray: "5 5" }
            ).addTo(spiderLayer.current);
            spiderLines.push(line);

            const m = buildPinMarker(L, product, sLat, sLng);
            m.addTo(spiderLayer.current);
            spiderMarkers.push(m);
          });

          spiderfied = true;
          leafletMap.current.setView([baseLat, baseLng], 16, { animate: true });
        };

        clusterMarker.on("click", () => {
          if (spiderfied) {
            collapse();
          } else {
            spiderLayer.current?.clearLayers();
            spiderfied = false;
            expand();
          }
        });

        leafletMap.current.on("click", collapse);
        clusterMarker.addTo(markersLayer.current);
        bounds.push([baseLat, baseLng]);
      }
    });

    allBounds.current = bounds;
    if (bounds.length > 0) {
      leafletMap.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 13 });
    }
  }, [buildPinMarker]);

  // ── Load India boundary GeoJSON overlay ──────────────────────────────────
  // ✅ NEW — fetches /india-boundary.geojson from public/ and draws it on top
  // of the OSM tile layer. Runs once after map init. Silently skips if the
  // file is missing (e.g. during local dev before you add it).

  const loadIndiaBoundary = useCallback(async (L: any, map: any) => {
    try {
      const res = await fetch("/india-boundary.geojson");
      if (!res.ok) {
        console.warn("[MarketplaceMap] india-boundary.geojson not found in public/ — skipping boundary overlay.");
        return;
      }
      const geojson = await res.json();

      boundaryLayer.current = L.geoJSON(geojson, {
        style: {
          // Solid dark line = India's claimed territory
          color:       "#2563eb",   // near-black
          weight:      2,
          opacity:     0.85,
          fill:        false,       // outline only, no fill
          dashArray:   undefined,   // solid = our border
          lineCap:     "round",
          lineJoin:    "round",
        },
        // Make it non-interactive — clicks should fall through to markers
        interactive: false,
        // Render above tiles but below markers
        pane:        "overlayPane",
      }).addTo(map);

      // Bring markers above the boundary line
      if (markersLayer.current) markersLayer.current.bringToFront();
      if (spiderLayer.current)  spiderLayer.current.bringToFront();

    } catch (err) {
      // Non-fatal — OSM tiles still render fine without the overlay
      console.warn("[MarketplaceMap] Failed to load India boundary:", err);
    }
  }, []);

  // ── Locate user ───────────────────────────────────────────────────────────

  const locateUser = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
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
        marker.bindPopup(
          `<div style="font-family:'DM Sans',sans-serif;padding:6px 4px;text-align:center">
             <strong style="font-size:0.85rem">📍 You are here</strong>
           </div>`,
          { maxWidth: 160 }
        );

        if (leafletMap.current) {
          marker.addTo(leafletMap.current);
          locationMarker.current = marker;
          leafletMap.current.setView([lat, lng], 14, { animate: true });
          marker.openPopup();
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
  }, []);

  // ── Silent locate on mount ────────────────────────────────────────────────

  const silentLocate = useCallback(async () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
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
        marker.bindPopup(
          `<div style="font-family:'DM Sans',sans-serif;padding:6px 4px;text-align:center">
             <strong style="font-size:0.85rem">📍 You are here</strong>
           </div>`,
          { maxWidth: 160 }
        );

        if (leafletMap.current) {
          marker.addTo(leafletMap.current);
          locationMarker.current = marker;
        }
      },
      () => { /* silent */ },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // ── Init Leaflet map ONCE ─────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined" || leafletMap.current) return;

    if (!document.getElementById("leaflet-css")) {
      const link    = document.createElement("link");
      link.id       = "leaflet-css";
      link.rel      = "stylesheet";
      link.href     = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
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

      const map = L.map(mapRef.current, {
        center:      INDIA_CENTER,
        zoom:        INDIA_ZOOM,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OSM tile layer — unchanged, free forever
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayer.current   = L.layerGroup().addTo(map);
      spiderLayer.current    = L.layerGroup().addTo(map);
      leafletMap.current     = map;
      mapInitialized.current = true;

      // ✅ Draw India boundary overlay on top of OSM tiles
      loadIndiaBoundary(L, map);

      if (pendingPlot.current !== null) {
        const queued        = pendingPlot.current;
        pendingPlot.current = null;
        plotMarkers(queued);
      }

      silentLocate();

      const resizeObserver = new ResizeObserver(() => map.invalidateSize());
      if (mapRef.current) resizeObserver.observe(mapRef.current);
      (map as any)._resizeObserver = resizeObserver;
    });

    return () => {
      if (leafletMap.current) {
        (leafletMap.current as any)._resizeObserver?.disconnect();
        leafletMap.current.remove();
        leafletMap.current     = null;
        markersLayer.current   = null;
        spiderLayer.current    = null;
        locationMarker.current = null;
        boundaryLayer.current  = null; // ← clean up boundary ref too
        mapInitialized.current = false;
        pendingPlot.current    = null;
      }
    };
  }, [plotMarkers, silentLocate, loadIndiaBoundary]);

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
      .then((data: ApiResponse) => {
        const list = data.results ?? [];
        setProducts(list);
        plotMarkers(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("MarketplaceMap fetch error:", err);
        setLoading(false);
      });
  }, [selectedCategory, plotMarkers]);

  // ── Global nav handler ────────────────────────────────────────────────────

  useEffect(() => {
    (window as any).__mapGoTo = (id: string) => router.push(`/products/${id}`);
    return () => { delete (window as any).__mapGoTo; };
  }, [router]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h2 className={styles.heading}>Listings Near You</h2>
          <span className={styles.count}>
            {loading ? "Loading…" : `${products.filter((p) => p.owner_latitude).length} on map`}
          </span>
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.chip} ${selectedCategory === null ? styles.chipActive : ""}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.chip} ${selectedCategory === cat.id ? styles.chipActive : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className={styles.mapWrap}>
        <div ref={mapRef} className={styles.map} />

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
          <span>{locating ? "Locating…" : "My Location"}</span>
        </button>

        {/* Location error toast */}
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

        {/* Side card */}
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