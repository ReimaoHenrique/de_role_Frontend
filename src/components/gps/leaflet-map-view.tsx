"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { ArrowRight, Calendar, Compass, MapPin } from "lucide-react";
import type { Event } from "@/types";
import type { GeoCoordinates } from "@/lib/geo";
import { formatCurrencyFromCents } from "@/lib/format";

interface LeafletMapViewProps {
  events: Event[];
  userLocation: GeoCoordinates;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

function createRolezeiroIcon() {
  return L.divIcon({
    className: "leaflet-rolezeiro-icon",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 120px; height: 42px; margin-left: -60px; margin-top: -38px; pointer-events: auto;">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(37, 99, 235, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; display: flex; items-center; gap: 6px; padding: 6px 12px; border-radius: 9999px; background: #2563eb; color: #ffffff; font-weight: 800; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.5); border: 2px solid #ffffff;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background: #60a5fa; box-shadow: 0 0 8px #93c5fd; animation: pulse 2s infinite;"></span>
          ROLEZEIRO
        </div>
        <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background: #2563eb; border-right: 2px solid #ffffff; border-bottom: 2px solid #ffffff;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createEventIcon(event: Event, isSelected: boolean) {
  const isFree = event.priceInCents === 0;
  const priceDisplay = isFree ? "Grátis" : `R$ ${Math.round(event.priceInCents / 100)}`;

  const bgColor = isSelected ? "#0f172a" : "#ffffff";
  const textColor = isSelected ? "#ffffff" : "#0f172a";
  const borderColor = isSelected ? "#2563eb" : "#e2e8f0";
  const borderWidth = isSelected ? "3px" : "1.5px";
  const scale = isSelected ? "1.18" : "1";
  const zIndex = isSelected ? "9999" : "10";
  const shadow = isSelected
    ? "0 8px 20px rgba(37, 99, 235, 0.45)"
    : "0 4px 10px rgba(0, 0, 0, 0.15)";

  const categoryBadgeColor =
    event.category === "Festas"
      ? "#ec4899"
      : event.category === "Shows"
      ? "#8b5cf6"
      : event.category === "Música"
      ? "#f59e0b"
      : "#10b981";

  const truncatedName =
    event.name.length > 18 ? `${event.name.slice(0, 16)}…` : event.name;

  return L.divIcon({
    className: "leaflet-event-marker-icon",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 140px; margin-left: -70px; margin-top: -38px; transform: scale(${scale}); transform-origin: bottom center; transition: all 0.2s ease; z-index: ${zIndex}; cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 9999px; background: ${bgColor}; color: ${textColor}; border: ${borderWidth} solid ${borderColor}; box-shadow: ${shadow}; font-family: system-ui, -apple-system, sans-serif;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background: ${categoryBadgeColor}; shrink: 0;"></span>
          <span style="font-size: 11px; font-weight: 700; white-space: nowrap; max-width: 85px; overflow: hidden; text-overflow: ellipsis;">${truncatedName}</span>
          <span style="font-size: 10px; font-weight: 600; padding: 1px 4px; border-radius: 4px; background: ${isFree ? "#dcfce7" : "#f1f5f9"}; color: ${isFree ? "#166534" : "#475569"};">${priceDisplay}</span>
        </div>
        <div style="width: 8px; height: 8px; background: ${bgColor}; transform: rotate(45deg); margin-top: -4px; border-right: ${borderWidth} solid ${borderColor}; border-bottom: ${borderWidth} solid ${borderColor};"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapController({
  userLocation,
  selectedEvent,
}: {
  userLocation: GeoCoordinates;
  selectedEvent: Event | null;
}) {
  const map = useMap();
  const initialCenterSet = useRef(false);

  // Força atualização de dimensões do Leaflet após transição CSS
  useEffect(() => {
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 400);
    const timer3 = setTimeout(() => map.invalidateSize(), 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [map]);

  // Se um evento for selecionado, voa suavemente até ele
  useEffect(() => {
    if (selectedEvent && selectedEvent.latitude && selectedEvent.longitude) {
      map.flyTo([selectedEvent.latitude, selectedEvent.longitude], 15, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedEvent, map]);

  // Centraliza na primeira montagem se necessário
  useEffect(() => {
    if (!initialCenterSet.current) {
      initialCenterSet.current = true;
      map.setView([userLocation.lat, userLocation.lng], 13.5);
    }
  }, [userLocation, map]);

  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          map.flyTo([userLocation.lat, userLocation.lng], 14, {
            animate: true,
            duration: 0.6,
          });
        }}
        className="flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:shadow-lg active:scale-95"
        title="Centralizar no Rolezeiro"
      >
        <Compass className="h-4 w-4 text-blue-600 animate-spin-slow" />
        <span>Minha localização</span>
      </button>
    </div>
  );
}

export default function LeafletMapView({
  events,
  userLocation,
  selectedEventId,
  onSelectEvent,
}: LeafletMapViewProps) {
  const rolezeiroIcon = createRolezeiroIcon();
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          userLocation={userLocation}
          selectedEvent={selectedEvent}
        />

        {/* Marcador especial ROLEZEIRO */}
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={rolezeiroIcon}
          zIndexOffset={1000}
        >
          <Popup className="rolezeiro-popup">
            <div className="p-1 text-center">
              <p className="font-bold text-sm text-blue-600">Você está aqui!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Marcador especial ROLEZEIRO
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Marcadores dos Eventos */}
        {events.map((evt) => {
          if (!evt.latitude || !evt.longitude) return null;
          const isSelected = evt.id === selectedEventId;
          const icon = createEventIcon(evt, isSelected);

          return (
            <Marker
              key={evt.id}
              position={[evt.latitude, evt.longitude]}
              icon={icon}
              zIndexOffset={isSelected ? 500 : 10}
              eventHandlers={{
                click: () => onSelectEvent(evt.id),
              }}
            >
              <Popup className="event-popup" minWidth={220} maxWidth={280}>
                <div className="space-y-2 p-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                      {evt.category ?? "Rolê"}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {evt.priceInCents === 0
                        ? "Gratuito"
                        : formatCurrencyFromCents(evt.priceInCents)}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-1">
                    {evt.name}
                  </h3>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 shrink-0 text-primary" />
                      <span>{evt.dateLabel || "Em breve"}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      <span className="line-clamp-1">{evt.venue}</span>
                    </p>
                    {evt.distanceLabel && (
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        📍 {evt.distanceLabel}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/eventos/${evt.slug}`}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-90"
                  >
                    <span>Ver detalhes</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
