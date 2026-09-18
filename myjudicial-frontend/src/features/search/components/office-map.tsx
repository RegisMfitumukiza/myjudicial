"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslations } from "next-intl";

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm" }],
};

type OfficeMapProps = {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
};

export function OfficeMap({ latitude, longitude, label, className }: OfficeMapProps) {
  const t = useTranslations("search");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [longitude, latitude],
      zoom: 15,
      interactive: true,
      attributionControl: false,
      scrollZoom: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false, showZoom: true }),
      "top-right"
    );

    const el = document.createElement("div");
    el.className = "office-marker";
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", label ?? "Office location");
    el.style.cssText = `
      width: 28px; height: 28px; border-radius: 50%;
      background: #24558d; border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    `;
    el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

    new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([longitude, latitude])
      .setPopup(
        new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(
          `<div style="padding:4px 8px;font-size:12px;font-weight:600;color:#24558d;white-space:nowrap">${label ?? t("officeLocation")}</div>`
        )
      )
      .addTo(map);

    map.on("mouseenter", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", () => {
      map.getCanvas().style.cursor = "";
    });

    mapRef.current = map;

    return () => {
      mountedRef.current = false;
      try { map.remove(); } catch {}
      mapRef.current = null;
    };
  }, [latitude, longitude, label]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-xl border border-brand-border/20 dark:border-white/20 ${className ?? "h-40 w-full"}`}
    />
  );
}
