"use client";

import { useEffect, useRef, useState } from "react";

import { mockProperties } from "@/lib/mock-data";
import { formatMarketPrice } from "@/lib/utils";

const LEAFLET_VERSION = "1.9.4";

// Leaflet is loaded from a CDN at runtime (no npm dependency, no API key), so we
// type its global loosely.
type Leaflet = any;

declare global {
  interface Window {
    L?: Leaflet;
  }
}

/** Inject Leaflet's CSS + JS from the CDN once, and resolve with the `L` global. */
function loadLeaflet(): Promise<Leaflet> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    if (window.L) {
      resolve(window.L);
      return;
    }
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

function esc(value: string): string {
  return value.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!
  );
}

// Classic Google-style red teardrop marker.
const GOOGLE_PIN =
  '<svg width="26" height="38" viewBox="0 0 26 38" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M13 0C6 0 0.5 5.5 0.5 12.5 0.5 22 13 38 13 38s12.5-16 12.5-25.5C25.5 5.5 20 0 13 0z" ' +
  'fill="#EA4335" stroke="#B31412" stroke-width="0.5"/>' +
  '<circle cx="13" cy="12.5" r="4.5" fill="#7B1B12"/></svg>';

export function PropertyMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L: Leaflet) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          scrollWheelZoom: true,
          zoomControl: false,
        }).setView([20, 10], 2);
        mapRef.current = map;
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Google-Maps-style basemap with English (Latin-script) labels globally
        // (Esri World Street Map — keyless, free).
        const roadmap = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 19,
            attribution: "Tiles &copy; Esri",
          }
        ).addTo(map);

        // Satellite + place-label overlay = a Google "hybrid"-style view.
        const satellite = L.layerGroup([
          L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 20, attribution: "Tiles &copy; Esri" }
          ),
          L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 20 }
          ),
        ]);

        L.control
          .layers({ Map: roadmap, Satellite: satellite }, {}, { position: "topright" })
          .addTo(map);

        const pinIcon = L.divIcon({
          className: "",
          html: GOOGLE_PIN,
          iconSize: [26, 38],
          iconAnchor: [13, 38],
          popupAnchor: [0, -34],
        });

        const markers: any[] = [];
        for (const p of mockProperties) {
          const { lat, lng } = p.address;
          if (typeof lat !== "number" || typeof lng !== "number") continue;
          const price = formatMarketPrice(p.price, p.listingType, p.currency);
          const popup =
            '<div style="min-width:190px">' +
            `<img src="${esc(p.images[0])}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:6px"/>` +
            `<strong style="font-size:13px">${esc(p.title)}</strong><br/>` +
            `<span style="color:#5f6368;font-size:12px">${esc(p.address.street)}, ${esc(p.address.city)}, ${esc(p.address.country)}</span><br/>` +
            `<span style="font-weight:700;font-size:14px;color:#202124">${esc(price)}</span><br/>` +
            `<a href="/properties/${p.id}" style="color:#1a73e8;font-size:12px;font-weight:600">View details &rarr;</a>` +
            "</div>";
          markers.push(L.marker([lat, lng], { icon: pinIcon, title: p.title }).addTo(map).bindPopup(popup));
        }

        if (markers.length) {
          map.fitBounds(L.featureGroup(markers).getBounds().pad(0.25));
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-2xl border shadow-card">
      <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
          {failed ? "Map couldn't load. Check your connection." : "Loading map…"}
        </div>
      )}
    </div>
  );
}
