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

        const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([20, 10], 2);
        mapRef.current = map;

        const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);
        const satellite = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { attribution: "Tiles &copy; Esri", maxZoom: 19 }
        );
        L.control.layers({ Street: street, Satellite: satellite }, {}, { position: "topright" }).addTo(map);

        const pinIcon = L.divIcon({
          className: "",
          html:
            '<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;' +
            "background:#2f6bff;transform:rotate(-45deg);border:2px solid #fff;" +
            'box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 18],
          popupAnchor: [0, -16],
        });

        const markers: any[] = [];
        for (const p of mockProperties) {
          const { lat, lng } = p.address;
          if (typeof lat !== "number" || typeof lng !== "number") continue;
          const price = formatMarketPrice(p.price, p.listingType, p.currency);
          const popup =
            '<div style="min-width:180px">' +
            `<img src="${esc(p.images[0])}" alt="" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:6px"/>` +
            `<strong style="font-size:13px">${esc(p.title)}</strong><br/>` +
            `<span style="color:#64748b;font-size:12px">${esc(p.address.city)}, ${esc(p.address.country)}</span><br/>` +
            `<span style="font-weight:700;font-size:13px">${esc(price)}</span><br/>` +
            `<a href="/properties/${p.id}" style="color:#2f6bff;font-size:12px;font-weight:600">View details &rarr;</a>` +
            "</div>";
          markers.push(L.marker([lat, lng], { icon: pinIcon }).addTo(map).bindPopup(popup));
        }

        if (markers.length) {
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.25));
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
    <div className="relative h-[560px] w-full overflow-hidden rounded-2xl border shadow-card">
      <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
          {failed ? "Map couldn't load. Check your connection." : "Loading map…"}
        </div>
      )}
    </div>
  );
}
