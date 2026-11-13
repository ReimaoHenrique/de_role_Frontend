"use client";

import { useEffect, useMemo, useState } from "react";
import { RetractableGpsMap } from "./retractable-gps-map";
import { NearbyEventsList } from "./nearby-events-list";
import {
  DEFAULT_USER_COORDS,
  type GeoCoordinates,
} from "@/lib/geo";
import { enrichEvents } from "@/lib/events-data";
import { isEventToday, isEventWeekend } from "@/lib/format";
import type { Event, EventFilterType, EventSortType } from "@/types";

interface EventsExplorerProps {
  initialEvents: Event[];
  initialSearch?: string;
}

export function EventsExplorer({
  initialEvents,
  initialSearch = "",
}: EventsExplorerProps) {
  // 1. O componente GPS DEVE iniciar FECHADO por padrão
  const [isMapOpen, setIsMapOpen] = useState(false);

  // 2. Estado de localização do usuário (Rolezeiro)
  const [userLocation, setUserLocation] = useState<GeoCoordinates>(DEFAULT_USER_COORDS);

  // 3. Estado compartilhado dos filtros
  const [selectedFilter, setSelectedFilter] = useState<EventFilterType>("ALL");
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);

  // 4. Estado de ordenação: "distance" (padrão) ou "date"
  const [sortBy, setSortBy] = useState<EventSortType>("distance");

  // 5. Evento selecionado / em destaque compartilhado entre mapa e lista
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // 6. Busca textual recebida da página
  const search = initialSearch;

  // Obter geolocalização do navegador
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          // Mantém as coordenadas padrão em caso de recusa/erro
          console.warn("Geolocalização não autorizada ou indisponível:", error.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
      );
    }
  }, []);

  // Enriquece eventos com coordenadas, distâncias e categorias
  const enrichedEvents = useMemo(() => {
    return enrichEvents(initialEvents, userLocation);
  }, [initialEvents, userLocation]);

  // Aplica filtros sincronizados entre mapa e lista
  const filteredEvents = useMemo(() => {
    const searchLower = search.trim().toLowerCase();

    return enrichedEvents.filter((event) => {
      // Filtro por texto de busca
      if (searchLower) {
        const matchesName = event.name.toLowerCase().includes(searchLower);
        const matchesVenue = event.venue.toLowerCase().includes(searchLower);
        const matchesDesc = (event.description || "").toLowerCase().includes(searchLower);
        if (!matchesName && !matchesVenue && !matchesDesc) {
          return false;
        }
      }

      // Filtro por categoria / tipo
      if (selectedFilter === "FESTAS" && event.category !== "Festas") {
        return false;
      }
      if (selectedFilter === "SHOWS" && event.category !== "Shows") {
        return false;
      }
      if (selectedFilter === "MUSICA" && event.category !== "Música") {
        return false;
      }
      if (selectedFilter === "GRATUITO" && event.priceInCents !== 0) {
        return false;
      }
      if (selectedFilter === "HOJE" && !isEventToday(event.startsAt)) {
        return false;
      }
      if (selectedFilter === "FIM_DE_SEMANA" && !isEventWeekend(event.startsAt)) {
        return false;
      }

      // Filtro por raio de distância (em km)
      if (maxDistanceKm !== null) {
        const dist = event.distanceKm ?? 9999;
        if (dist > maxDistanceKm) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedEvents, search, selectedFilter, maxDistanceKm]);

  // Aplica ordenação (Por distância ou Por data)
  const sortedAndFilteredEvents = useMemo(() => {
    const result = [...filteredEvents];

    if (sortBy === "distance") {
      result.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    } else if (sortBy === "date") {
      result.sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
    }

    return result;
  }, [filteredEvents, sortBy]);

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Componente GPS Retrátil (Inicia FECHADO por padrão) */}
      {/* ----------------------------------------------------------------- */}
      <RetractableGpsMap
        isOpen={isMapOpen}
        onToggle={setIsMapOpen}
        events={enrichedEvents}
        filteredEvents={sortedAndFilteredEvents}
        userLocation={userLocation}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        maxDistanceKm={maxDistanceKm}
        onSelectMaxDistance={setMaxDistanceKm}
        selectedEventId={selectedEventId}
        onSelectEvent={setSelectedEventId}
      />

      {/* ----------------------------------------------------------------- */}
      {/* 2. Seção de Eventos Abaixo do GPS: ROLÊS MAIS PRÓXIMOS */}
      {/* (Lista vertical, NÃO cards e NÃO carrossel) */}
      {/* ----------------------------------------------------------------- */}
      <NearbyEventsList
        events={sortedAndFilteredEvents}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        selectedEventId={selectedEventId}
        onSelectEvent={setSelectedEventId}
      />
    </div>
  );
}
