"use client";

import dynamic from "next/dynamic";
import {
  ChevronDown,
  Compass,
  Filter,
  Loader2,
  MapPin,
  Maximize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event, EventFilterType } from "@/types";
import type { GeoCoordinates } from "@/lib/geo";

const LeafletMapView = dynamic(
  () => import("@/components/gps/leaflet-map-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Carregando mapa GPS dos rolês...
        </span>
      </div>
    ),
  }
);

interface RetractableGpsMapProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onRequestLocation?: () => void;
  events: Event[];
  filteredEvents: Event[];
  userLocation: GeoCoordinates;
  selectedFilter: EventFilterType;
  onSelectFilter: (filter: EventFilterType) => void;
  maxDistanceKm: number | null;
  onSelectMaxDistance: (dist: number | null) => void;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

const FILTER_ITEMS: { id: EventFilterType; label: string }[] = [
  { id: "ALL", label: "TODOS" },
  { id: "FESTAS", label: "FESTAS" },
  { id: "SHOWS", label: "SHOWS" },
  { id: "MUSICA", label: "MÚSICA" },
  { id: "GRATUITO", label: "GRATUITOS" },
  { id: "HOJE", label: "HOJE" },
  { id: "FIM_DE_SEMANA", label: "FINAL DE SEMANA" },
];

const DISTANCE_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Raio: Todos", value: null },
  { label: "Até 5 km", value: 5 },
  { label: "Até 10 km", value: 10 },
  { label: "Até 25 km", value: 25 },
];

export function RetractableGpsMap({
  isOpen,
  onToggle,
  onRequestLocation,
  filteredEvents,
  userLocation,
  selectedFilter,
  onSelectFilter,
  maxDistanceKm,
  onSelectMaxDistance,
  selectedEventId,
  onSelectEvent,
}: RetractableGpsMapProps) {
  // -------------------------------------------------------------------------
  // ESTADO FECHADO (Padrão)
  // Botão retangular horizontal ocupando toda a largura disponível
  // Moderno, minimalista, bordas arredondadas, ícone, texto "EXPLORAR MAPA"
  // e pequeno indicador visual de expansão.
  // -------------------------------------------------------------------------
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => onToggle(true)}
        className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/90 px-4 py-3.5 sm:px-6 sm:py-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:bg-accent/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.995]"
        aria-expanded={false}
        aria-label="Abrir mapa GPS e explorar rolês próximos"
      >
        {/* Glow de fundo sutil no hover */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Lado esquerdo: Ícone de localização/mapa + Texto EXPLORAR MAPA */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover:scale-105">
            <MapPin className="h-5 w-5 animate-bounce-subtle" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-wider text-foreground uppercase sm:text-base">
                EXPLORAR MAPA
              </span>
              <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 sm:inline-block">
                GPS
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Ver rolês no OpenStreetMap com marcador Rolezeiro
            </p>
          </div>
        </div>

        {/* Lado direito: Pequeno indicador visual de expansão */}
        <div className="relative flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
          <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-semibold sm:flex">
            <Maximize2 className="h-3 w-3 text-primary" />
            <span>Abrir 74%</span>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:bg-primary/10 group-hover:text-primary">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </button>
    );
  }

  // -------------------------------------------------------------------------
  // ESTADO ABERTO
  // Ocupa aproximadamente 74% da tela (74vh), animação suave,
  // OpenStreetMap, Rolezeiro, marcadores, filtros no topo e botão X para fechar.
  // -------------------------------------------------------------------------
  return (
    <div
      className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl transition-all duration-500 ease-in-out"
      style={{ height: "74vh" }}
      role="region"
      aria-label="Mapa GPS de Rolês"
    >
      {/* Barra de cabeçalho do GPS aberto */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Compass className="h-4 w-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-foreground sm:text-sm">
                MAPA GPS · ROLÊS
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                GPS Rolezeiro Ativo
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              {filteredEvents.length} rolê(s) no raio selecionado · Clique no marcador para detalhes
            </p>
          </div>
        </div>

        {/* Botão X para fechar o mapa */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onToggle(false)}
          className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          aria-label="Fechar mapa e voltar"
          title="Fechar mapa (voltar ao botão)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Barra de Filtros Superior integrada ao mapa */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border/70 bg-muted/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mr-1 shrink-0">
          <Filter className="h-3 w-3" />
          <span className="hidden sm:inline">FILTROS:</span>
        </div>

        {/* Categorias e tags rápidas */}
        <div className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {FILTER_ITEMS.map((item) => {
            const active = selectedFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectFilter(item.id)}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                    : "bg-background text-muted-foreground border border-border/60 hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Seletor de Raio / Distância */}
        <div className="flex items-center gap-1 shrink-0">
          {DISTANCE_OPTIONS.map((opt) => {
            const active = maxDistanceKm === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onSelectMaxDistance(opt.value)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-background/80 text-muted-foreground border border-border/50 hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Área do Mapa OpenStreetMap */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <LeafletMapView
          events={filteredEvents}
          userLocation={userLocation}
          selectedEventId={selectedEventId}
          onSelectEvent={onSelectEvent}
          onRequestLocation={onRequestLocation}
        />
      </div>
    </div>
  );
}
