"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import { Layers, Navigation, LocateFixed, ZoomIn, MapPin } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { Lawyer } from "../types";

const STREET_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm" }],
};

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Tiles &copy; Esri",
      maxzoom: 19,
    },
  },
  layers: [{ id: "esri-imagery", type: "raster", source: "esri" }],
};

type MapViewProps = {
  lawyers: Lawyer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  center?: { lat: number; lng: number };
  onCenterChange?: (lat: number, lng: number) => void;
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  searchRadiusKm?: number;
  userLocation?: { lat: number; lng: number } | null;
  onUserLocationChange?: (loc: { lat: number; lng: number }) => void;
  className?: string;
};

interface LawyerFeatureProperties {
  cluster: false;
  lawyerId: string;
  name: string;
  specialty: string;
  specialties: string;
  rate: number;
  rating: number | null;
  reviewCount: number;
  verified: boolean;
  avatarUrl: string | null;
  online: boolean;
  distanceKm: number | null;
  yearsExperience: number;
  languages: string;
  officeAddress: string;
  city: string;
}

function toFeatures(lawyers: Lawyer[]): Supercluster.PointFeature<LawyerFeatureProperties>[] {
  return lawyers
    .filter((l) => l.lat !== 0 && l.lng !== 0)
    .map((l) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [l.lng, l.lat] },
      properties: {
        cluster: false,
        lawyerId: l.id,
        name: l.name,
        specialty: l.specialtyLabel,
        specialties: l.specialties.join(", "),
        rate: l.startingRateRwf,
        rating: l.rating,
        reviewCount: l.reviewCount,
        verified: l.verified,
        avatarUrl: l.avatarUrl,
        online: l.online,
        distanceKm: l.distanceKm,
        yearsExperience: l.yearsExperience ?? 0,
        languages: (l.languages || []).join(", "),
        officeAddress: l.officeAddress ?? "",
        city: l.city ?? "",
      },
    }));
}

function formatRate(rate: number): string {
  if (rate >= 1000) return `${(rate / 1000).toFixed(0)}k`;
  return String(rate);
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

interface MarkerData {
  marker: maplibregl.Marker;
  element: HTMLDivElement;
  pin: HTMLDivElement;
  popup: maplibregl.Popup;
  hoverTimeout: ReturnType<typeof setTimeout> | null;
}

function createMarkerElements(props: {
  name: string;
  rate: number;
  verified: boolean;
  selected: boolean;
  rating: number;
  reviewCount: number;
  avatarUrl: string;
  specialty: string;
  distanceKm: number;
  officeAddress: string;
  city: string;
  lawyerId: string;
  online: boolean;
  yearsExperience: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}): { container: HTMLDivElement; pin: HTMLDivElement } {
  const el = document.createElement("div");
  el.style.cssText =
    "cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;";

  const size = props.selected ? 44 : 36;
  const pin = document.createElement("div");
  const NAVY = "rgb(11,37,69)";
  const bg = props.selected ? NAVY : "white";
  const border = props.selected
    ? "3px solid white"
    : `2.5px solid ${NAVY}`;
  const shadow = props.selected
    ? "0 4px 16px rgba(0,0,0,0.35)"
    : "0 2px 10px rgba(0,0,0,0.2)";
  const textColor = props.selected ? "white" : NAVY;

  pin.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    background:${bg};border:${border};
    box-shadow:${shadow};
    transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    ${props.selected ? "transform:scale(1.18);" : ""}
  `;

  const rateLabel =
    props.rate > 0 ? formatRate(props.rate) : props.name.charAt(0);
  pin.innerHTML = `<span style="font-size:${size < 40 ? 11 : 12}px;font-weight:700;line-height:1;color:${textColor};pointer-events:none">${rateLabel}</span>`;
  el.appendChild(pin);

  el.addEventListener("mouseenter", () => {
    if (!props.selected) pin.style.transform = "scale(1.12)";
  });
  el.addEventListener("mouseleave", () => {
    if (!props.selected) pin.style.transform = "";
  });

  return { container: el, pin };
}

function createRichPopupHtml(props: {
  name: string;
  rate: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  avatarUrl: string;
  lawyerId: string;
  online: boolean;
  specialty: string;
  specialties: string;
  distanceKm: number;
  officeAddress: string;
  city: string;
  yearsExperience: number;
  languages: string;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}): string {
  const rateStr =
    props.rate > 0
      ? `${props.rate.toLocaleString()} RWF`
      : props.t("contactForPricing");
  const distStr = formatDistance(props.distanceKm);

  const NAVY = "rgb(11,37,69)";
  const MUTED = "#64748b";
  const BORDER = "#e2e8f0";
  const prefix = `/${props.locale}`;

  const starsHtml =
    props.rating > 0
      ? `<span style="display:inline-flex;align-items:center;gap:2px;font-size:12px;font-weight:600;color:${NAVY}">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="${NAVY}" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
           ${props.rating.toFixed(1)}
         </span>
         <span style="font-size:11px;color:${MUTED}">(${props.reviewCount} ${props.t("reviews")})</span>`
      : `<span style="font-size:11px;font-weight:500;color:${MUTED}">${props.t("new")}</span>`;

  const onlineBadge = props.online
    ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#16a34a">
         <span style="width:6px;height:6px;border-radius:50%;background:#16a34a;display:inline-block"></span>
         ${props.t("availableNow")}
       </span>`
    : "";

  const verifiedBadge = props.verified
    ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;color:${NAVY}">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${NAVY}" stroke-width="2.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
         ${props.t("verified")}
       </span>`
    : "";

  const locationLine = [props.officeAddress, props.city]
    .filter(Boolean)
    .join(", ");

  const specialtiesList = props.specialties
    ? props.specialties.split(", ").slice(0, 3).map(s =>
        `<span style="display:inline-block;font-size:10px;font-weight:500;color:${NAVY};background:rgba(11,37,69,0.06);border:1px solid ${BORDER};border-radius:4px;padding:1px 6px">${s}</span>`
      ).join(" ")
    : `<span style="font-size:10px;font-weight:500;color:${MUTED}">${props.specialty}</span>`;

  const expLine = props.yearsExperience > 0
    ? `<span style="font-size:11px;color:${MUTED}">${props.yearsExperience} ${props.t("yrShort")}</span>`
    : "";

  return `
    <div style="padding:0;min-width:280px;max-width:320px;font-family:system-ui,-apple-system,sans-serif;overflow:hidden">

      <div style="padding:14px 14px 10px;display:flex;gap:12px;align-items:flex-start">
        <div style="position:relative;flex-shrink:0">
          <img src="${props.avatarUrl}" alt="${props.name}"
            style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid ${NAVY}"
            onerror="this.style.display='none'" />
        </div>
        <div style="min-width:0;flex:1">
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
            <p style="margin:0;font-size:14px;font-weight:700;color:${NAVY};line-height:1.2">${props.name}</p>
            ${verifiedBadge}
          </div>
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-top:3px">
            ${onlineBadge}
            ${expLine}
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap">
            ${starsHtml}
          </div>
        </div>
      </div>

      <div style="border-top:1px solid ${BORDER};padding:8px 14px;display:flex;flex-wrap:wrap;gap:3px">
        ${specialtiesList}
      </div>

      <div style="border-top:1px solid ${BORDER};padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <p style="margin:0;font-size:15px;font-weight:800;color:${NAVY}">${rateStr}</p>
          <p style="margin:1px 0 0;font-size:10px;color:${MUTED}">${props.t("rwfPerConsult")}</p>
        </div>
        <div style="text-align:right">
          <p style="margin:0;font-size:12px;font-weight:600;color:${NAVY}">${distStr}</p>
          <p style="margin:1px 0 0;font-size:10px;color:${MUTED}">${props.t("km")} ${props.t("away")}</p>
        </div>
      </div>

      ${locationLine ? `
      <div style="border-top:1px solid ${BORDER};padding:8px 14px;display:flex;align-items:center;gap:6px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${MUTED}" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span style="font-size:11px;color:${MUTED}">${locationLine}</span>
      </div>` : ""}

      <div style="border-top:1px solid ${BORDER};padding:10px 14px;display:flex;gap:6px">
        <a href="${prefix}/lawyers/${props.lawyerId}"
          style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:8px 0;font-size:12px;font-weight:600;color:white;background:${NAVY};border-radius:8px;text-decoration:none;transition:opacity 0.15s"
          onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
          ${props.t("viewProfile")}
        </a>
        <a href="${prefix}/lawyers/${props.lawyerId}/book"
          style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:8px 0;font-size:12px;font-weight:600;color:${NAVY};background:transparent;border:1.5px solid ${NAVY};border-radius:8px;text-decoration:none;transition:background 0.15s"
          onmouseover="this.style.background='rgb(248,250,252)'" onmouseout="this.style.background='transparent'">
          ${props.t("bookConsultation")}
        </a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationLine || props.city || "Kigali")}"
          target="_blank" rel="noopener noreferrer"
          style="display:flex;align-items:center;justify-content:center;gap:4px;padding:8px 10px;font-size:12px;font-weight:600;color:${NAVY};background:transparent;border:1.5px solid ${NAVY};border-radius:8px;text-decoration:none;transition:background 0.15s"
          onmouseover="this.style.background='rgb(248,250,252)'" onmouseout="this.style.background='transparent'">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
        </a>
      </div>
    </div>
  `;
}

function createHoverTooltipHtml(props: {
  name: string;
  rate: number;
  rating: number;
  specialty: string;
  verified: boolean;
  online: boolean;
}): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);
    background:rgb(11,37,69);color:white;
    border-radius:10px;padding:8px 12px;white-space:nowrap;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);
    pointer-events:none;opacity:0;transition:opacity 0.15s ease;
    font-family:system-ui,-apple-system,sans-serif;z-index:10;
    display:flex;flex-direction:column;gap:2px;
  `;

  const rateStr = props.rate > 0 ? `${props.rate.toLocaleString()} RWF` : "";
  const starsStr = props.rating > 0 ? `${props.rating.toFixed(1)}` : "";
  const onlineDot = props.online
    ? '<span style="width:5px;height:5px;border-radius:50%;background:#4ade80;display:inline-block"></span>'
    : "";

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:4px">
      <span style="font-size:12px;font-weight:700">${props.name}</span>
      ${props.verified ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>' : ""}
      ${onlineDot}
    </div>
    <div style="display:flex;align-items:center;gap:8px;font-size:11px;opacity:0.85">
      <span>${props.specialty}</span>
      ${rateStr ? `<span style="font-weight:600">${rateStr}</span>` : ""}
      ${starsStr ? `<span>${starsStr}</span>` : ""}
    </div>
  `;

  return el;
}

export function MapView({
  lawyers,
  selectedId,
  onSelect,
  center,
  onCenterChange,
  onBoundsChange,
  searchRadiusKm,
  userLocation,
  onUserLocationChange,
  className,
}: MapViewProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const indexRef = useRef<Supercluster | null>(null);
  const markersMapRef = useRef<Map<string, MarkerData>>(new Map());
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const radiusCircleRef = useRef<maplibregl.Marker | null>(null);
  const [baseLayer, setBaseLayer] = useState<"street" | "satellite">("street");
  const [ready, setReady] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const isDraggingRef = useRef(false);
  const flyToTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  const mountedRef = useRef(true);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const updateSource = useCallback(() => {
    const map = mapRef.current;
    const index = indexRef.current;
    if (!map || !index) return;
    try {
      const zoom = Math.round(map.getZoom());
      const bbox = map.getBounds().toArray() as [[number, number], [number, number]];
      const clusters = index.getClusters(
        [bbox[0][0], bbox[0][1], bbox[1][0], bbox[1][1]],
        zoom
      );
      const source = map.getSource("experts") as maplibregl.GeoJSONSource;
      source?.setData({
        type: "FeatureCollection",
        features: clusters as GeoJSON.Feature[],
      });
    } catch {
      /* map not loaded */
    }
  }, []);

  const fitBoundsToLawyers = useCallback(
    (animate = true) => {
      const map = mapRef.current;
      if (!map || lawyers.length === 0) return;
      const coords = lawyers
        .filter((l) => l.lat !== 0 && l.lng !== 0)
        .map((l) => [l.lng, l.lat] as [number, number]);
      if (coords.length === 0) return;
      if (coords.length === 1) {
        map.flyTo({ center: coords[0], zoom: 14, duration: animate ? 600 : 0 });
        return;
      }
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 15,
        duration: animate ? 600 : 0,
      });
    },
    [lawyers]
  );

  useEffect(() => {
    if (mapRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    mountedRef.current = true;

    const tryInit = () => {
      if (mapRef.current || !mountedRef.current) return;
      const rect = container.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;

      const map = new maplibregl.Map({
        container,
        style: STREET_STYLE,
        center: [center?.lng ?? 30.0619, center?.lat ?? -1.9441],
        zoom: 12,
        attributionControl: { compact: true },
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right"
      );
      map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

      map.on("load", () => {
        map.addSource("experts", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "experts",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "rgb(11,37,69)",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              10,
              28,
              30,
              36,
            ],
            "circle-stroke-color": "white",
            "circle-stroke-width": 3,
            "circle-opacity": 0.9,
          },
        });

        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "experts",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-size": 13,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          },
          paint: { "text-color": "white" },
        });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "experts",
          filter: ["!", ["has", "point_count"]],
          paint: { "circle-radius": 0 },
        });

        map.on("click", "clusters", async (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
          });
          if (!features.length) return;
          const clusterId = features[0].properties?.cluster_id;
          if (clusterId == null) return;
          const source = map.getSource("experts") as maplibregl.GeoJSONSource;
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const coords = (features[0].geometry as GeoJSON.Point)
              .coordinates as [number, number];
            map.flyTo({ center: coords, zoom: zoom + 0.5, duration: 600 });
          } catch {
            /* cluster removed */
          }
        });

        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });

        setReady(true);
      });

      map.on("movestart", () => {
        isDraggingRef.current = true;
      });

      map.on("moveend", () => {
        isDraggingRef.current = false;
        updateSource();
        setShowSearchThisArea(true);
        if (onBoundsChange) {
          const b = map.getBounds();
          onBoundsChange({
            north: b.getNorth(),
            south: b.getSouth(),
            east: b.getEast(),
            west: b.getWest(),
          });
        }
      });

      map.on("dragend", () => {
        if (onCenterChange) {
          const c = map.getCenter();
          onCenterChange(c.lat, c.lng);
        }
      });

      mapRef.current = map;
    };

    tryInit();
    if (mapRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!mapRef.current) tryInit();
    });
    observer.observe(container);

    return () => {
      mountedRef.current = false;
      observer.disconnect();
      if (flyToTimerRef.current) clearTimeout(flyToTimerRef.current);
      markersMapRef.current.forEach((m) => {
        if (m.hoverTimeout) clearTimeout(m.hoverTimeout);
        try { m.popup.remove(); } catch {}
        try { m.marker.remove(); } catch {}
      });
      markersMapRef.current.clear();
      try { userLocationMarkerRef.current?.remove(); } catch {}
      try { radiusCircleRef.current?.remove(); } catch {}
      try { mapRef.current?.remove(); } catch {}
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const index = new Supercluster({ radius: 50, maxZoom: 14 });
    index.load(toFeatures(lawyers));
    indexRef.current = index;
    updateSource();
  }, [ready, lawyers, updateSource]);

  useEffect(() => {
    if (!ready || lawyers.length === 0) return;
    const hasCoords = lawyers.some((l) => l.lat !== 0 && l.lng !== 0);
    if (hasCoords) fitBoundsToLawyers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lawyers.length > 0]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const validIds = new Set(
      lawyers.filter((l) => l.lat !== 0 && l.lng !== 0).map((l) => l.id)
    );

    for (const [id, data] of markersMapRef.current) {
      if (!validIds.has(id)) {
        data.popup.remove();
        data.marker.remove();
        if (data.hoverTimeout) clearTimeout(data.hoverTimeout);
        markersMapRef.current.delete(id);
      }
    }

    for (const lawyer of lawyers) {
      if (lawyer.lat === 0 || lawyer.lng === 0) continue;
      const isSelected = lawyer.id === selectedId;
      const existing = markersMapRef.current.get(lawyer.id);

      if (existing) {
        const pin = existing.pin;
        const size = isSelected ? 44 : 36;
        const NAVY = "rgb(11,37,69)";
        const bg = isSelected ? NAVY : "white";
        const border = isSelected
          ? "3px solid white"
          : `2.5px solid ${NAVY}`;
        const shadow = isSelected
          ? "0 4px 16px rgba(0,0,0,0.35)"
          : "0 2px 10px rgba(0,0,0,0.2)";
        const textColor = isSelected ? "white" : NAVY;

        pin.style.width = `${size}px`;
        pin.style.height = `${size}px`;
        pin.style.background = bg;
        pin.style.border = border;
        pin.style.boxShadow = shadow;
        pin.style.transform = isSelected ? "scale(1.18)" : "";
        const rateLabel =
          lawyer.startingRateRwf > 0
            ? formatRate(lawyer.startingRateRwf)
            : lawyer.name.charAt(0);
        pin.innerHTML = `<span style="font-size:${size < 40 ? 11 : 12}px;font-weight:700;line-height:1;color:${textColor};pointer-events:none">${rateLabel}</span>`;

        if (isSelected) {
          if (!existing.popup.isOpen()) existing.marker.togglePopup();
        } else {
          if (existing.popup.isOpen()) existing.popup.remove();
        }
        continue;
      }

      const { container, pin: newPin } = createMarkerElements({
        name: lawyer.name,
        rate: lawyer.startingRateRwf,
        verified: lawyer.verified,
        selected: isSelected,
        rating: lawyer.rating,
        reviewCount: lawyer.reviewCount,
        avatarUrl: lawyer.avatarUrl,
        specialty: lawyer.specialtyLabel,
        distanceKm: lawyer.distanceKm,
        officeAddress: lawyer.officeAddress ?? "",
        city: lawyer.city ?? "",
        lawyerId: lawyer.id,
        online: lawyer.online,
        yearsExperience: lawyer.yearsExperience ?? 0,
        t,
      });

      container.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(lawyer.id);
      });

      const popup = new maplibregl.Popup({
        offset: [0, -8],
        closeButton: true,
        maxWidth: "320px",
        className: "lawyer-popup",
      }      ).setHTML(
        createRichPopupHtml({
          name: lawyer.name,
          rate: lawyer.startingRateRwf,
          rating: lawyer.rating,
          reviewCount: lawyer.reviewCount,
          verified: lawyer.verified,
          avatarUrl: lawyer.avatarUrl,
          lawyerId: lawyer.id,
          online: lawyer.online,
          specialty: lawyer.specialtyLabel,
          specialties: lawyer.specialties.join(", "),
          distanceKm: lawyer.distanceKm,
          officeAddress: lawyer.officeAddress ?? "",
          city: lawyer.city ?? "",
          yearsExperience: lawyer.yearsExperience ?? 0,
          languages: (lawyer.languages || []).join(", "),
          locale,
          t,
        })
      );

      const marker = new maplibregl.Marker({ element: container, anchor: "bottom" })
        .setLngLat([lawyer.lng, lawyer.lat])
        .setPopup(popup)
        .addTo(map);

      if (isSelected) {
        marker.togglePopup();
      }

      let hoverEl: HTMLDivElement | null = null;

      container.addEventListener("mouseenter", () => {
        if (selectedIdRef.current === lawyer.id) return;
        const timeout = setTimeout(() => {
          if (!mountedRef.current) return;
          if (selectedIdRef.current === lawyer.id) return;
          if (!hoverEl) {
            hoverEl = createHoverTooltipHtml({
              name: lawyer.name,
              rate: lawyer.startingRateRwf,
              rating: lawyer.rating,
              specialty: lawyer.specialtyLabel,
              verified: lawyer.verified,
              online: lawyer.online,
            });
            container.appendChild(hoverEl);
          }
          requestAnimationFrame(() => {
            if (!mountedRef.current || !hoverEl) return;
            if (hoverEl) hoverEl.style.opacity = "1";
          });
        }, 300);
        const existing = markersMapRef.current.get(lawyer.id);
        if (existing) existing.hoverTimeout = timeout;
      });

      container.addEventListener("mouseleave", () => {
        const existing = markersMapRef.current.get(lawyer.id);
        if (existing?.hoverTimeout) clearTimeout(existing.hoverTimeout);
        if (hoverEl) {
          hoverEl.style.opacity = "0";
          setTimeout(() => {
            if (!mountedRef.current) return;
            if (hoverEl?.parentNode) hoverEl.parentNode.removeChild(hoverEl);
            hoverEl = null;
          }, 150);
        }
      });

      markersMapRef.current.set(lawyer.id, {
        marker,
        element: container,
        pin: newPin,
        popup,
        hoverTimeout: null,
      });
    }

    return () => {
      if (!mountedRef.current) {
        markersMapRef.current.forEach((m) => {
          if (m.hoverTimeout) clearTimeout(m.hoverTimeout);
        });
      }
    };
  }, [lawyers, selectedId, ready, onSelect, t]);

  useEffect(() => {
    if (!ready) return;
    const lawyer = lawyers.find((l) => l.id === selectedId);
    if (lawyer && lawyer.lat !== 0 && lawyer.lng !== 0) {
      if (flyToTimerRef.current) clearTimeout(flyToTimerRef.current);
      flyToTimerRef.current = setTimeout(() => {
        mapRef.current?.flyTo({
          center: [lawyer.lng, lawyer.lat],
          zoom: Math.max(mapRef.current?.getZoom() ?? 12, 14),
          duration: 600,
        });
      }, 50);
    }
  }, [selectedId, lawyers, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    if (userLocationMarkerRef.current) userLocationMarkerRef.current.remove();

    const el = document.createElement("div");
    el.style.cssText = `
      width:18px;height:18px;border-radius:50%;
      background:rgb(59,130,246);border:3px solid white;
      box-shadow:0 0 0 3px rgba(59,130,246,0.25), 0 2px 6px rgba(0,0,0,0.2);
    `;

    userLocationMarkerRef.current = new maplibregl.Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !searchRadiusKm || !center) return;

    if (radiusCircleRef.current) radiusCircleRef.current.remove();

    const el = document.createElement("div");
    const size = 200;
    el.style.cssText = `
      width:${size}px;height:${size}px;border-radius:50%;
      border:2px solid rgb(11,37,69);
      background:rgba(11,37,69,0.06);
      pointer-events:none;
    `;

    radiusCircleRef.current = new maplibregl.Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat([center.lng, center.lat])
      .addTo(map);
  }, [searchRadiusKm, center, ready]);

  const prevBaseLayerRef = useRef(baseLayer);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (prevBaseLayerRef.current === baseLayer) return;
    prevBaseLayerRef.current = baseLayer;
    map.setStyle(baseLayer === "street" ? STREET_STYLE : SATELLITE_STYLE);
  }, [baseLayer, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const readd = () => {
      if (map.getSource("experts")) return;
      map.addSource("experts", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "experts",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "rgb(11,37,69)",
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 28, 30, 36],
          "circle-stroke-color": "white",
          "circle-stroke-width": 3,
          "circle-opacity": 0.9,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "experts",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 13,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        },
        paint: { "text-color": "white" },
      });
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "experts",
        filter: ["!", ["has", "point_count"]],
        paint: { "circle-radius": 0 },
      });
      map.on("click", "clusters", async (e) => {
        const feats = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        if (!feats.length) return;
        const clusterId = feats[0].properties?.cluster_id;
        if (clusterId == null) return;
        const src = map.getSource("experts") as maplibregl.GeoJSONSource;
        try {
          const zoom = await src.getClusterExpansionZoom(clusterId);
          const coords = (feats[0].geometry as GeoJSON.Point)
            .coordinates as [number, number];
          map.flyTo({ center: coords, zoom: zoom + 0.5, duration: 600 });
        } catch {
          /* cluster gone */
        }
      });
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });
      updateSource();
    };

    map.on("style.load", readd);
    readd();
    return () => {
      map.off("style.load", readd);
    };
  }, [baseLayer, ready, updateSource]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    try {
      map.setLayoutProperty(
        "clusters",
        "visibility",
        baseLayer === "satellite" ? "none" : "visible"
      );
      map.setLayoutProperty(
        "cluster-count",
        "visibility",
        baseLayer === "satellite" ? "none" : "visible"
      );
    } catch {
      /* layer may not exist */
    }
  }, [baseLayer, ready]);

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onUserLocationChange?.(loc);
        mapRef.current?.flyTo({
          center: [loc.lng, loc.lat],
          zoom: 14,
          duration: 800,
        });
      },
      () => {
        /* denied */
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [onUserLocationChange]);

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute right-3 top-3 z-10 overflow-hidden rounded-xl bg-card text-xs shadow-lg ring-1 ring-black/5">
        <button
          type="button"
          onClick={() => setBaseLayer("street")}
          className={`flex w-full items-center gap-2 px-3 py-2 font-medium transition-colors ${
            baseLayer === "street"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          {t("streetLayer")}
        </button>
        <button
          type="button"
          onClick={() => setBaseLayer("satellite")}
          className={`flex w-full items-center gap-2 border-t border-border px-3 py-2 font-medium transition-colors ${
            baseLayer === "satellite"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Navigation className="h-3.5 w-3.5 rotate-45" />
          {t("satelliteLayer")}
        </button>
      </div>

      <div className="absolute right-3 top-[7.5rem] z-10">
        <button
          type="button"
          onClick={requestUserLocation}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-lg ring-1 ring-black/5 transition hover:shadow-xl"
          title={t("locateMe")}
        >
          <LocateFixed className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {showSearchThisArea && (
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
          <button
            type="button"
            onClick={() => setShowSearchThisArea(false)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-lg transition hover:shadow-xl"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            {t("searchThisArea")}
          </button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-lg ring-1 ring-black/5">
        <span className="h-2 w-2 rounded-full bg-brand-dark" />
        {t("expertsInView", { count: lawyers.length })}
      </div>
    </div>
  );
}
