"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";

const originIcon = L.divIcon({
  className: "cw-pin-icon",
  html: `<div class="cw-map-pin cw-map-pin-origin" title="Origine"><span></span></div>`,
  iconSize: [22, 28],
  iconAnchor: [11, 28],
});

const destIcon = L.divIcon({
  className: "cw-pin-icon",
  html: `<div class="cw-map-pin cw-map-pin-dest" title="Destination"><span></span></div>`,
  iconSize: [22, 28],
  iconAnchor: [11, 28],
});

const pulseIcon = L.divIcon({
  className: "cw-pulse-icon",
  html: `<div class="cw-pulse-marker"><span class="cw-pulse-ring"></span><span class="cw-pulse-dot"></span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface Point {
  lat: number;
  lng: number;
  label?: string;
}

interface TrackMapProps {
  origin?: Point;
  destination?: Point;
  current?: Point;
  routeGeometry?: [number, number][] | null;
  showLiveMarker?: boolean;
}

function MapReady({ points }: { points: [number, number][] }) {
  const map = useMap();
  const fittedKey = useRef("");

  useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });
    invalidate();
    const t1 = window.setTimeout(invalidate, 80);
    const t2 = window.setTimeout(invalidate, 320);
    window.addEventListener("orientationchange", invalidate);
    window.addEventListener("resize", invalidate);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("orientationchange", invalidate);
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);

  useEffect(() => {
    if (points.length === 0) return;
    const key = `${points.length}:${points[0][0].toFixed(3)},${points[0][1].toFixed(3)}:${points[points.length - 1][0].toFixed(3)},${points[points.length - 1][1].toFixed(3)}`;
    if (fittedKey.current === key) return;
    fittedKey.current = key;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const padding: [number, number] = isMobile ? [28, 28] : [48, 48];
    const maxZoom = isMobile ? 6 : 7;

    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding, maxZoom });
    } else {
      map.setView(points[0], isMobile ? 5 : 6);
    }
  }, [map, points]);

  return null;
}

function MovingMarker({ current }: { current: Point }) {
  const markerRef = useRef<L.Marker | null>(null);
  const displayRef = useRef<[number, number]>([current.lat, current.lng]);
  const targetRef = useRef<[number, number]>([current.lat, current.lng]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    targetRef.current = [current.lat, current.lng];
  }, [current.lat, current.lng]);

  useEffect(() => {
    const tick = () => {
      const marker = markerRef.current;
      const [tLat, tLng] = targetRef.current;
      let [lat, lng] = displayRef.current;
      const dLat = tLat - lat;
      const dLng = tLng - lng;
      lat += dLat * 0.12;
      lng += dLng * 0.12;
      if (Math.abs(dLat) < 0.00001 && Math.abs(dLng) < 0.00001) {
        lat = tLat;
        lng = tLng;
      }
      displayRef.current = [lat, lng];
      marker?.setLatLng([lat, lng]);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <Marker
      position={[current.lat, current.lng]}
      icon={pulseIcon}
      zIndexOffset={1000}
      ref={(m) => {
        markerRef.current = m;
        if (m) displayRef.current = [m.getLatLng().lat, m.getLatLng().lng];
      }}
    >
      <Popup>{current.label || "Position du colis"}</Popup>
    </Marker>
  );
}

export default function TrackMap({
  origin,
  destination,
  current,
  routeGeometry,
  showLiveMarker = true,
}: TrackMapProps) {
  const centerLat = current?.lat ?? origin?.lat ?? destination?.lat ?? 20;
  const centerLng = current?.lng ?? origin?.lng ?? destination?.lng ?? 0;

  const fullRoute = useMemo(() => {
    if (routeGeometry && routeGeometry.length >= 2) return routeGeometry;
    // Avoid ugly straight line while waiting for OSRM road geometry
    return [] as [number, number][];
  }, [routeGeometry]);

  const traveledLine = useMemo(() => {
    if (!current || !origin) return [] as [number, number][];
    if (routeGeometry && routeGeometry.length >= 2) {
      let best = 0;
      let bestD = Infinity;
      routeGeometry.forEach((p, i) => {
        const d = Math.hypot(p[0] - current.lat, p[1] - current.lng);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return routeGeometry.slice(0, Math.max(2, best + 1));
    }
    return [] as [number, number][];
  }, [origin, current, routeGeometry]);

  const fitPoints = useMemo(() => {
    if (fullRoute.length >= 2) return fullRoute;
    const pts: [number, number][] = [];
    if (origin) pts.push([origin.lat, origin.lng]);
    if (destination) pts.push([destination.lat, destination.lng]);
    return pts;
  }, [fullRoute, origin, destination]);

  const nearDestination =
    current &&
    destination &&
    Math.hypot(current.lat - destination.lat, current.lng - destination.lng) < 0.08;

  const routeReady = fullRoute.length >= 2;

  return (
    <div className="relative h-[min(58vh,420px)] w-full overflow-hidden rounded-xl border border-border sm:h-80 md:h-96">
      {!routeReady && (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-[500] flex justify-center px-3">
          <span className="rounded-full bg-panel/95 px-3 py-1 text-[11px] font-medium text-text-secondary shadow-soft sm:text-xs">
            Chargement de l’itinéraire…
          </span>
        </div>
      )}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={5}
        scrollWheelZoom={false}
        dragging
        touchZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapReady points={fitPoints} />
        {routeReady && (
          <Polyline
            positions={fullRoute}
            pathOptions={{ color: "#93c5fd", weight: 6, opacity: 0.85, lineJoin: "round", lineCap: "round" }}
          />
        )}
        {traveledLine.length >= 2 && (
          <Polyline
            positions={traveledLine}
            pathOptions={{ color: "#2563EB", weight: 5, lineJoin: "round", lineCap: "round" }}
          />
        )}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>{origin.label || "Origine"}</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Popup>{destination.label || "Destination"}</Popup>
          </Marker>
        )}
        {showLiveMarker && current && !nearDestination && <MovingMarker current={current} />}
      </MapContainer>
    </div>
  );
}
