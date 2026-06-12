"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bed, Bath, Maximize2, MapPin, Layers } from "lucide-react";

import { mockProperties } from "@/lib/mock-data";
import { formatNumber, formatMarketPrice, cn } from "@/lib/utils";

const LEAFLET_VERSION = "1.9.4";

// Leaflet is loaded from a CDN at runtime (no npm dependency, no API key).
type Leaflet = any;

declare global {
  interface Window {
    L?: Leaflet;
  }
}

function loadLeaflet(): Promise<Leaflet> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    if (window.L) return resolve(window.L);
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
      document.head.appendChild(link);
    }
    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function compactPrice(price: number, currency = "USD", listingType: "sale" | "rent" = "sale") {
  let s: string;
  try {
    s = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(price);
  } catch {
    s = `$${Math.round(price).toLocaleString()}`;
  }
  return listingType === "rent" ? `${s}/mo` : s;
}

// Custom styling that lifts Leaflet's default chrome to a premium look, plus the
// price-pill markers (toggled active via a class — no DOM swap = smooth).
const MAP_CSS = `
.leaflet-container{font-family:inherit;background:#eef2f7}
.leaflet-bar,.leaflet-control-layers{border:none!important;border-radius:12px!important;box-shadow:0 6px 20px rgba(2,6,23,.16)!important;overflow:hidden}
.leaflet-control-zoom a{width:34px!important;height:34px!important;line-height:34px!important;color:#0f172a;font-size:18px}
.leaflet-control-zoom a:hover{background:#f1f5f9}
.leaflet-control-layers{padding:8px 10px!important;font-size:13px}
.leaflet-control-layers-toggle{width:38px!important;height:38px!important}
.leaflet-popup-content-wrapper{border-radius:16px!important;box-shadow:0 16px 40px rgba(2,6,23,.24)!important;padding:6px!important}
.leaflet-popup-content{margin:8px!important;font-family:inherit}
.leaflet-container a.leaflet-popup-close-button{color:#94a3b8;top:10px;right:8px}
.leaflet-control-attribution{font-size:10px;background:rgba(255,255,255,.7)!important}
.price-pill{display:inline-block;background:#fff;color:#0f172a;border:1px solid rgba(2,6,23,.12);box-shadow:0 2px 8px rgba(2,6,23,.2);border-radius:999px;padding:5px 11px;font-size:12px;font-weight:800;white-space:nowrap;position:relative;transition:transform .15s ease,background .15s ease,color .15s ease,box-shadow .15s ease;cursor:pointer}
.price-pill .pill-tip{position:absolute;left:50%;bottom:-5px;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #fff}
.price-pill:hover{transform:scale(1.07)}
.leaflet-marker-icon.is-active{z-index:1000!important}
.is-active .price-pill{background:#2f6bff;color:#fff;transform:scale(1.1);box-shadow:0 8px 20px rgba(47,107,255,.5)}
.is-active .price-pill .pill-tip{border-top-color:#2f6bff}
`;

export function PropertyMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // --- build the map once ---------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L: Leaflet) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        LRef.current = L;

        const map = L.map(containerRef.current, { scrollWheelZoom: true, zoomControl: false }).setView(
          [20, 10],
          2
        );
        mapRef.current = map;
        L.control.zoom({ position: "bottomright" }).addTo(map);

        const roadmap = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, attribution: "Tiles &copy; Esri" }
        ).addTo(map);
        const satellite = L.layerGroup([
          L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 19, attribution: "Tiles &copy; Esri" }
          ),
          L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 19 }
          ),
        ]);
        L.control.layers({ Map: roadmap, Satellite: satellite }, {}, { position: "topright" }).addTo(map);

        const markers: any[] = [];
        for (const p of mockProperties) {
          const { lat, lng } = p.address;
          if (typeof lat !== "number" || typeof lng !== "number") continue;
          const icon = L.divIcon({
            className: "",
            html: `<div class="price-pill">${compactPrice(p.price, p.currency, p.listingType)}<i class="pill-tip"></i></div>`,
            iconSize: [58, 30],
            iconAnchor: [29, 34],
            popupAnchor: [0, -32],
          });
          const marker = L.marker([lat, lng], { icon }).addTo(map);
          marker.bindPopup(
            '<div style="min-width:200px">' +
              `<img src="${p.images[0]}" alt="" style="width:100%;height:108px;object-fit:cover;border-radius:10px;margin-bottom:6px"/>` +
              `<div style="font-weight:700;font-size:13px;color:#0f172a">${p.title}</div>` +
              `<div style="color:#5f6368;font-size:12px">${p.address.city}, ${p.address.country}</div>` +
              `<div style="font-weight:800;font-size:14px;margin-top:2px">${formatMarketPrice(p.price, p.listingType, p.currency)}</div>` +
              `<a href="/properties/${p.id}" style="color:#2f6bff;font-size:12px;font-weight:700">View details &rarr;</a>` +
              "</div>",
            { closeButton: true }
          );
          marker.on("mouseover", () => {
            setActiveId(p.id);
            cardRefs.current[p.id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          });
          marker.on("click", () => {
            setActiveId(p.id);
            cardRefs.current[p.id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          });
          markersRef.current[p.id] = marker;
          markers.push(marker);
        }

        if (markers.length) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
        setTimeout(() => map.invalidateSize(), 200);
        setLoaded(true);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
    };
  }, []);

  // --- reflect active state on the markers ----------------------------------
  useEffect(() => {
    for (const [id, marker] of Object.entries(markersRef.current)) {
      const el = marker?.getElement?.();
      if (el) el.classList.toggle("is-active", id === activeId);
    }
  }, [activeId]);

  const focusProperty = (id: string) => {
    setActiveId(id);
    const map = mapRef.current;
    const marker = markersRef.current[id];
    const p = mockProperties.find((x) => x.id === id);
    if (map && p) map.flyTo([p.address.lat, p.address.lng], Math.max(map.getZoom() ?? 12, 12), { duration: 0.6 });
    if (marker) setTimeout(() => marker.openPopup(), 380);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MAP_CSS }} />
      <div className="grid overflow-hidden rounded-3xl border bg-card shadow-card-hover lg:h-[76vh] lg:grid-cols-[1fr_390px]">
        {/* Map pane */}
        <div className="relative h-[46vh] lg:h-auto">
          <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />
          <div className="pointer-events-none absolute left-4 top-4 z-[5] flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-card backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-ai" />
            {mockProperties.length} homes
          </div>
          {!loaded && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
              {failed ? "Map couldn't load. Check your connection." : "Loading map…"}
            </div>
          )}
        </div>

        {/* Listings pane */}
        <div className="flex min-h-0 flex-col border-t lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{mockProperties.length} listings</p>
              <p className="text-[11px] text-muted-foreground">Hover or click a card to locate it</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
              <Layers className="h-3 w-3" /> Map · Satellite
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {mockProperties.map((p) => {
              const active = activeId === p.id;
              return (
                <article
                  key={p.id}
                  ref={(el) => {
                    cardRefs.current[p.id] = el;
                  }}
                  onMouseEnter={() => setActiveId(p.id)}
                  onClick={() => focusProperty(p.id)}
                  className={cn(
                    "group cursor-pointer overflow-hidden rounded-2xl border bg-card transition-all duration-200 ease-premium",
                    active
                      ? "-translate-y-0.5 border-ai/60 shadow-card-hover ring-2 ring-ai/40"
                      : "hover:-translate-y-0.5 hover:shadow-card"
                  )}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-background/95 px-2.5 py-1 text-xs font-extrabold shadow-sm">
                      {compactPrice(p.price, p.currency, p.listingType)}
                    </span>
                    <span className="absolute right-2 top-2 rounded-full bg-ai/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ai-foreground">
                      {p.listingType}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {p.address.city}, {p.address.country}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" /> {p.bedrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" /> {p.bathrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize2 className="h-3.5 w-3.5" /> {formatNumber(p.sqft)}
                      </span>
                      <Link
                        href={`/properties/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto font-semibold text-ai hover:underline"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
