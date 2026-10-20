"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import { Layers, Navigation, LocateFixed, ZoomIn, MapPin } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { Lawyer } from "../types";
import { formatSpecialtyName } from "./mobile-map-expert-card";
import { getLocalizedLanguage } from "@/shared/constants/languages";
import { formatDistance } from "../utils/geo";

const STREET_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
  hoveredId?: string | null;
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
  distanceAnchorLabel?: string;
  className?: string;
  isMobile?: boolean;
};

function formatRate(rate: number): string {
  if (rate >= 1000) return `${(rate / 1000).toFixed(0)}k`;
  return String(rate);
}

/**
 * Intelligent micro-dispersion algorithm (Airbnb / Google Maps pattern).
 * Detects pins sharing identical or near-identical coordinates (<180m, e.g. same building or district)
 * and arranges them in a clean radial constellation so every pin remains distinct, readable, and clickable.
 */
function computeNonOverlappingCoords(lawyers: Lawyer[]): Map<string, [number, number]> {
  const result = new Map<string, [number, number]>();
  const clusters: { center: [number, number]; members: Lawyer[] }[] = [];
  const PROXIMITY_THRESHOLD = 0.0018; // ~180 meters

  for (const lawyer of lawyers) {
    if (lawyer.lat === 0 || lawyer.lng === 0) continue;
    let foundCluster = false;
    for (const cluster of clusters) {
      const dLat = lawyer.lat - cluster.center[0];
      const dLng = lawyer.lng - cluster.center[1];
      if (Math.hypot(dLat, dLng) < PROXIMITY_THRESHOLD) {
        cluster.members.push(lawyer);
        foundCluster = true;
        break;
      }
    }
    if (!foundCluster) {
      clusters.push({ center: [lawyer.lat, lawyer.lng], members: [lawyer] });
    }
  }

  for (const cluster of clusters) {
    if (cluster.members.length === 1) {
      const single = cluster.members[0];
      result.set(single.id, [single.lng, single.lat]);
    } else {
      const count = cluster.members.length;
      const radius = 0.0024; // ~220m radial fan-out
      cluster.members.forEach((member, i) => {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
        const offsetLat = cluster.center[0] + radius * Math.cos(angle);
        const offsetLng = cluster.center[1] + radius * Math.sin(angle) * 1.08;
        result.set(member.id, [offsetLng, offsetLat]);
      });
    }
  }
  return result;
}

interface MarkerData {
  marker: maplibregl.Marker;
  element: HTMLDivElement;
  inner: HTMLDivElement;
  pin: HTMLDivElement;
  pointer: HTMLDivElement;
  popup: maplibregl.Popup;
  hoverTimeout: ReturnType<typeof setTimeout> | null;
}

function createMarkerElements(props: {
  name: string;
  rate: number;
  verified: boolean;
  selected: boolean;
  hovered: boolean;
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
}): { container: HTMLDivElement; inner: HTMLDivElement; pin: HTMLDivElement; pointer: HTMLDivElement } {
  // IMPORTANT: this element is the MapLibre marker root. MapLibre positions it with
  // `position:absolute` + `transform:translate(...)`, so we must NOT override either here.
  const el = document.createElement("div");
  el.style.cssText = "cursor:pointer;user-select:none;";
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", props.t("viewProfileAria", { name: props.name }));

  const BRAND = "rgb(36,85,141)";
  const isHigh = props.selected || props.hovered;
  const bg = isHigh ? BRAND : "#ffffff";
  const textColor = isHigh ? "#ffffff" : "#0f172a";
  const borderColor = isHigh ? "#ffffff" : "rgba(15,23,42,0.12)";
  const shadow = isHigh
    ? "0 8px 24px -2px rgba(36,85,141,0.45), 0 4px 12px rgba(0,0,0,0.15)"
    : "0 4px 14px -1px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)";
  const pointerColor = isHigh ? BRAND : "#ffffff";

  const pin = document.createElement("div");
  pin.style.cssText = `
    display:flex;align-items:center;gap:6px;
    padding:3px 9px 3px 3px;
    background:${bg};
    color:${textColor};
    border:1.5px solid ${borderColor};
    border-radius:9999px;
    box-shadow:${shadow};
    transition:background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.22s ease;
    white-space:nowrap;
  `;

  // Avatar inside pin
  const initials = props.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatarBg = isHigh ? "rgba(255,255,255,0.2)" : BRAND;
  const avatarHtml = props.avatarUrl
    ? `<img src="${props.avatarUrl}" alt="${props.name}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.outerHTML='<div style=\\'width:22px;height:22px;border-radius:50%;background:${avatarBg};color:white;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;\\'>${initials}</div>'" />`
    : `<div style="width:22px;height:22px;border-radius:50%;background:${avatarBg};color:white;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;">${initials}</div>`;

  const rateLabel = props.rate > 0 ? `${formatRate(props.rate)} RWF` : props.name.split(" ")[0];
  const verifiedBadge = props.verified
    ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${isHigh ? '#ffffff' : BRAND}" stroke-width="3" style="margin-left:-2px;flex-shrink:0;"><path d="M20 6L9 17l-5-5"/></svg>`
    : "";

  pin.innerHTML = `
    ${avatarHtml}
    <span style="font-size:11.5px;font-weight:800;letter-spacing:-0.01em;line-height:1;pointer-events:none">${rateLabel}</span>
    ${verifiedBadge}
  `;

  const pointer = document.createElement("div");
  pointer.style.cssText = `
    width:0;height:0;
    border-left:5px solid transparent;
    border-right:5px solid transparent;
    border-top:5px solid ${pointerColor};
    margin-top:-1px;
    filter:drop-shadow(0 1px 2px rgba(0,0,0,0.12));
    transition:border-top-color 0.2s ease;
  `;

  const inner = document.createElement("div");
  inner.style.cssText =
    "display:flex;flex-direction:column;align-items:center;justify-content:center;transform-origin:50% 100%;transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1);";
  inner.appendChild(pin);
  inner.appendChild(pointer);
  el.appendChild(inner);

  if (isHigh) {
    inner.style.transform = "scale(1.15)";
    el.style.zIndex = props.selected ? "35" : "25";
  } else {
    inner.style.transform = "";
    el.style.zIndex = "1";
  }

  el.addEventListener("mouseenter", () => {
    if (!props.selected) {
      inner.style.transform = "scale(1.15)";
      el.style.zIndex = "25";
    }
  });
  el.addEventListener("mouseleave", () => {
    if (!props.selected && !props.hovered) {
      inner.style.transform = "";
      el.style.zIndex = "1";
    }
  });

  return { container: el, inner, pin, pointer };
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
  distanceAnchorLabel?: string;
  officeAddress: string;
  city: string;
  yearsExperience: number;
  languages: string;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  tSpecialties?: (k: string) => string;
}): string {
  const rateStr =
    props.rate > 0
      ? `${props.rate.toLocaleString()} RWF`
      : props.t("contactForPricing");
  const distStr = formatDistance(props.distanceKm);

  const BRAND = "rgb(36,85,141)";
  const MUTED = "#64748b";
  const BORDER = "#e2e8f0";
  const prefix = `/${props.locale}`;

  const starsHtml =
    props.rating > 0
      ? `<span style="display:inline-flex;align-items:center;gap:2px;font-size:12px;font-weight:600;color:${BRAND}">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="${BRAND}" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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
    ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;color:${BRAND};flex-shrink:0;white-space:nowrap">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${BRAND}" stroke-width="2.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
         ${props.t("verified")}
       </span>`
    : "";

  const locationLine = [props.officeAddress, props.city]
    .filter(Boolean)
    .join(", ");

  const rawSpecialties = props.specialties
    ? props.specialties.split(", ").map((s) => formatSpecialtyName(s, props.tSpecialties))
    : props.specialty
      ? [formatSpecialtyName(props.specialty, props.tSpecialties)]
      : [];
  const specialtiesList =
    rawSpecialties.length > 0
      ? rawSpecialties
          .slice(0, 2)
          .map(
            (s) =>
              `<span style="display:inline-block;font-size:11px;font-weight:500;color:${BRAND};background:rgba(36,85,141,0.08);border:1px solid #cbd5e1;border-radius:6px;padding:2px 8px">${s}</span>`
          )
          .join(" ") +
        (rawSpecialties.length > 2
          ? `<span style="font-size:11px;font-weight:500;color:${MUTED};margin-left:4px">+${rawSpecialties.length - 2}</span>`
          : "")
      : "";

  const expLine = props.yearsExperience > 0
    ? `<span style="font-size:11px;color:${MUTED}">${props.yearsExperience} ${props.t("yrShort")}</span>`
    : "";

  return `
    <div style="padding:0;min-width:280px;max-width:320px;font-family:system-ui,-apple-system,sans-serif;overflow:hidden">

      <div style="padding:14px 44px 10px 14px;position:relative;display:flex;gap:12px;align-items:flex-start">
        <a href="${prefix}/lawyers/${props.lawyerId}" title="${props.t("viewProfile")}" style="text-decoration:none;position:relative;flex-shrink:0;width:52px;height:52px;border-radius:50%;background:${BRAND};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;cursor:pointer;transition:transform 0.15s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          ${props.avatarUrl
            ? `<img src="${props.avatarUrl}" alt="${props.name}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid ${BRAND}" onerror="this.parentElement.innerHTML='${props.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}'" />`
            : props.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
          }
        </a>
        <div style="min-width:0;flex:1">
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
            <a href="${prefix}/lawyers/${props.lawyerId}" style="margin:0;font-size:14px;font-weight:700;color:${BRAND};line-height:1.25;word-break:break-word;text-decoration:none;cursor:pointer" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${props.name}</a>
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

      ${specialtiesList ? `
      <div style="border-top:1px solid ${BORDER};padding:8px 14px;display:flex;flex-wrap:wrap;align-items:center;gap:4px">
        ${specialtiesList}
      </div>` : ""}

      <div style="border-top:1px solid ${BORDER};padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <p style="margin:0;font-size:15px;font-weight:800;color:${BRAND}">${rateStr}</p>
          <p style="margin:1px 0 0;font-size:10px;color:${MUTED}">${props.t("rwfPerConsult")}</p>
        </div>
        <div style="text-align:right">
          <p style="margin:0;font-size:12px;font-weight:600;color:${BRAND}">${distStr}</p>
          <p style="margin:1px 0 0;font-size:10px;color:${MUTED}">${props.distanceAnchorLabel || props.t("fromCityCenter")}</p>
        </div>
      </div>

      ${locationLine ? `
      <div style="border-top:1px solid ${BORDER};padding:8px 14px;display:flex;align-items:center;gap:6px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${MUTED}" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span style="font-size:11px;color:${MUTED};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${locationLine}</span>
      </div>` : ""}

      <div style="border-top:1px solid ${BORDER};padding:10px 14px;display:flex;flex-direction:column;gap:7px">
        <a href="${prefix}/lawyers/${props.lawyerId}/book"
          style="display:flex;align-items:center;justify-content:center;gap:6px;height:36px;font-size:13px;font-weight:600;color:white;background:${BRAND};border-radius:8px;text-decoration:none;transition:opacity 0.15s"
          onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${props.t("bookConsultation")}
        </a>
        <div style="display:flex;gap:6px">
          <a href="${prefix}/lawyers/${props.lawyerId}"
            style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;height:32px;font-size:12px;font-weight:600;color:${BRAND};background:rgb(241,245,249);border-radius:7px;text-decoration:none;transition:background 0.15s"
            onmouseover="this.style.background='rgb(226,232,240)'" onmouseout="this.style.background='rgb(241,245,249)'">
            ${props.t("viewProfile")}
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationLine || props.city || "Kigali")}"
            target="_blank" rel="noopener noreferrer"
            title="${props.t("getDirections")}"
            aria-label="${props.t("getDirections")}"
            style="width:36px;height:32px;display:flex;align-items:center;justify-content:center;color:${BRAND};background:rgb(241,245,249);border-radius:7px;text-decoration:none;transition:background 0.15s"
            onmouseover="this.style.background='rgb(226,232,240)'" onmouseout="this.style.background='rgb(241,245,249)'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          </a>
        </div>
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
    background:rgb(36,85,141);color:white;
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
  hoveredId,
  onSelect,
  center,
  onCenterChange,
  onBoundsChange,
  searchRadiusKm,
  userLocation,
  onUserLocationChange,
  distanceAnchorLabel,
  className,
  isMobile = false,
}: MapViewProps) {
  const t = useTranslations("search");
  const tSpecialties = useTranslations("specialties");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersMapRef = useRef<Map<string, MarkerData>>(new Map());
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
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

  const displayCoordsMap = useMemo(
    () => computeNonOverlappingCoords(lawyers),
    [lawyers]
  );

  const fitBoundsToLawyers = useCallback(
    (animate = true) => {
      const map = mapRef.current;
      if (!map || lawyers.length === 0) return;
      const coords = lawyers
        .filter((l) => l.lat !== 0 && l.lng !== 0)
        .map((l) => displayCoordsMap.get(l.id) ?? ([l.lng, l.lat] as [number, number]));
      if (coords.length === 0) return;
      if (coords.length === 1) {
        map.flyTo({ center: coords[0], zoom: 14, duration: animate ? 600 : 0 });
        return;
      }
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 70, left: 70, right: 70 },
        maxZoom: 15,
        duration: animate ? 600 : 0,
      });
    },
    [lawyers, displayCoordsMap]
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
        new maplibregl.ScaleControl({ unit: "metric" }),
        "bottom-right"
      );

      map.on("load", () => {
        setReady(true);
      });

      map.on("click", () => {
        onSelect("");
      });

      map.on("dragstart", () => {
        isDraggingRef.current = true;
      });

      map.on("moveend", () => {
        if (isDraggingRef.current) {
          setShowSearchThisArea(true);
        }
        isDraggingRef.current = false;
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
        // Panning finished: show "Search this area" button for user to confirm area exploration
        setShowSearchThisArea(true);
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
      try { mapRef.current?.remove(); } catch {}
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || lawyers.length === 0) return;
    const hasCoords = lawyers.some((l) => l.lat !== 0 && l.lng !== 0);
    if (hasCoords) fitBoundsToLawyers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lawyers.length > 0]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !center || isDraggingRef.current) return;
    const current = map.getCenter();
    const dist = Math.hypot(current.lat - center.lat, current.lng - center.lng);
    // Smoothly fly to new center if moved significantly (> 400m)
    if (dist > 0.004) {
      map.flyTo({ center: [center.lng, center.lat], zoom: 12, duration: 800 });
    }
  }, [ready, center?.lat, center?.lng]);

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
      const isHovered = lawyer.id === hoveredId;
      const existing = markersMapRef.current.get(lawyer.id);

      if (existing) {
        const coords = displayCoordsMap.get(lawyer.id) ?? [lawyer.lng, lawyer.lat];
        existing.marker.setLngLat(coords);

        const isHigh = isSelected || isHovered;
        const BRAND = "rgb(36,85,141)";
        const bg = isHigh ? BRAND : "#ffffff";
        const textColor = isHigh ? "#ffffff" : "#0f172a";
        const borderColor = isHigh ? "#ffffff" : "rgba(15,23,42,0.12)";
        const shadow = isHigh
          ? "0 8px 24px -2px rgba(36,85,141,0.45), 0 4px 12px rgba(0,0,0,0.15)"
          : "0 4px 14px -1px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)";
        const pointerColor = isHigh ? BRAND : "#ffffff";

        existing.pin.style.background = bg;
        existing.pin.style.color = textColor;
        existing.pin.style.borderColor = borderColor;
        existing.pin.style.boxShadow = shadow;
        if (existing.pointer) {
          existing.pointer.style.borderTopColor = pointerColor;
        }

        existing.inner.style.transform = isHigh ? "scale(1.15)" : "";
        existing.element.style.zIndex = isSelected ? "35" : isHovered ? "25" : "1";

        // Refresh popup content so updated distances and details stay completely in sync
        existing.popup.setHTML(
          createRichPopupHtml({
            name: lawyer.name,
            rate: lawyer.startingRateRwf,
            rating: lawyer.rating,
            reviewCount: lawyer.reviewCount,
            verified: lawyer.verified,
            avatarUrl: lawyer.avatarUrl ?? "",
            lawyerId: lawyer.id,
            online: lawyer.online,
            specialty: formatSpecialtyName(lawyer.specialtyLabel, tSpecialties),
            specialties: (lawyer.specialties || []).map((s) => formatSpecialtyName(s, tSpecialties)).join(", "),
            distanceKm: lawyer.distanceKm,
            distanceAnchorLabel,
            officeAddress: lawyer.officeAddress ?? "",
            city: lawyer.city ?? "",
            yearsExperience: lawyer.yearsExperience ?? 0,
            languages: (lawyer.languages || []).map((l) => getLocalizedLanguage(l, locale)).join(", "),
            locale,
            t,
            tSpecialties,
          })
        );

        if (isSelected) {
          if (!isMobile) {
            if (!existing.marker.getPopup()) existing.marker.setPopup(existing.popup);
            if (!existing.popup.isOpen()) existing.marker.togglePopup();
          } else {
            if (existing.popup.isOpen()) existing.popup.remove();
          }
        } else {
          if (existing.popup.isOpen()) existing.popup.remove();
        }
        continue;
      }

      const { container, inner: newInner, pin: newPin, pointer: newPointer } = createMarkerElements({
        name: lawyer.name,
        rate: lawyer.startingRateRwf,
        verified: lawyer.verified,
        selected: isSelected,
        hovered: isHovered,
        rating: lawyer.rating,
        reviewCount: lawyer.reviewCount,
        avatarUrl: lawyer.avatarUrl ?? "",
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
        offset: [0, -42],
        closeButton: true,
        maxWidth: "320px",
        className: "lawyer-popup",
      }).setHTML(
        createRichPopupHtml({
          name: lawyer.name,
          rate: lawyer.startingRateRwf,
          rating: lawyer.rating,
          reviewCount: lawyer.reviewCount,
          verified: lawyer.verified,
          avatarUrl: lawyer.avatarUrl ?? "",
          lawyerId: lawyer.id,
          online: lawyer.online,
          specialty: formatSpecialtyName(lawyer.specialtyLabel, tSpecialties),
          specialties: (lawyer.specialties || []).map((s) => formatSpecialtyName(s, tSpecialties)).join(", "),
          distanceKm: lawyer.distanceKm,
          distanceAnchorLabel,
          officeAddress: lawyer.officeAddress ?? "",
          city: lawyer.city ?? "",
          yearsExperience: lawyer.yearsExperience ?? 0,
          languages: (lawyer.languages || []).map((l) => getLocalizedLanguage(l, locale)).join(", "),
          locale,
          t,
          tSpecialties,
        })
      );

      popup.on("close", () => {
        if (selectedIdRef.current === lawyer.id) {
          onSelect("");
        }
      });

      const coords = displayCoordsMap.get(lawyer.id) ?? [lawyer.lng, lawyer.lat];
      const marker = new maplibregl.Marker({ element: container, anchor: "bottom" })
        .setLngLat(coords);

      if (!isMobile) {
        marker.setPopup(popup);
      }

      marker.addTo(map);

      if (isSelected && !isMobile) {
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
              specialty: formatSpecialtyName(lawyer.specialtyLabel, tSpecialties),
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
        inner: newInner,
        pin: newPin,
        pointer: newPointer,
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
  }, [lawyers, selectedId, hoveredId, ready, onSelect, isMobile, t, locale, displayCoordsMap]);

  useEffect(() => {
    if (!ready) return;
    const lawyer = lawyers.find((l) => l.id === selectedId);
    if (lawyer && lawyer.lat !== 0 && lawyer.lng !== 0) {
      if (flyToTimerRef.current) clearTimeout(flyToTimerRef.current);
      flyToTimerRef.current = setTimeout(() => {
        const coords = displayCoordsMap.get(lawyer.id) ?? [lawyer.lng, lawyer.lat];
        setShowSearchThisArea(false);
        mapRef.current?.flyTo({
          center: coords,
          zoom: Math.max(mapRef.current?.getZoom() ?? 12, 14),
          duration: 600,
          offset: isMobile ? [0, -100] : [0, -75],
        });
      }, 50);
    }
  }, [selectedId, lawyers, ready, isMobile, displayCoordsMap]);

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

    const onStyleLoad = () => {
      // style reloaded
    };

    map.on("style.load", onStyleLoad);
    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [baseLayer, ready]);

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setShowSearchThisArea(false);
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onUserLocationChange]);

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div ref={containerRef} className="h-full w-full" role="region" aria-label={t("mapAriaLabel")} />

      {/* ── Top-Left: Live experts count badge (hidden on mobile to prevent overlap with Search this area) ── */}
      <div className="absolute left-4 top-4 z-20 hidden sm:flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur-xs px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-md ring-1 ring-black/5 dark:ring-white/10">
        <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "#10b981" }} />
        <span>{t("expertsInView", { count: lawyers.length })}</span>
      </div>

      {/* ── Top-Center: Search this area pill ── */}
      {showSearchThisArea && !selectedId && (
        <div className="absolute left-1/2 top-4 sm:top-5 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => {
              setShowSearchThisArea(false);
              const map = mapRef.current;
              if (map && onCenterChange) {
                const c = map.getCenter();
                onCenterChange(c.lat, c.lng);
              }
            }}
            className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur-md transition-all hover:shadow-xl hover:bg-accent active:scale-95"
          >
            <ZoomIn className="h-3.5 w-3.5 text-brand-dark dark:text-white" />
            <span>{t("searchThisArea")}</span>
          </button>
        </div>
      )}

      {/* ── Top-Right: Map layer & locate controls (adequate spacing from right panel) ── */}
      <div className="absolute right-6 top-4 z-20 flex flex-col items-end gap-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card text-xs shadow-md ring-1 ring-black/5 dark:ring-white/10">
          <button
            type="button"
            onClick={() => setBaseLayer("street")}
            className={`flex w-full items-center gap-2 px-3 py-2 font-medium transition-colors ${
              baseLayer === "street"
                ? "bg-accent font-semibold text-foreground"
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
                ? "bg-accent font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Navigation className="h-3.5 w-3.5 rotate-45" />
            {t("satelliteLayer")}
          </button>
        </div>

        <button
          type="button"
          onClick={requestUserLocation}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card shadow-md ring-1 ring-black/5 dark:ring-white/10 transition hover:bg-accent hover:shadow-lg"
          title={t("locateMe")}
        >
          <LocateFixed className="h-4 w-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}
