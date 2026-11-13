"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  Filter,
  MapPin,
  Navigation,
} from "lucide-react";
import { EventImage } from "@/components/event-image";
import { formatCurrencyFromCents } from "@/lib/format";
import type { Event, EventFilterType, EventSortType } from "@/types";

interface NearbyEventsListProps {
  events: Event[];
  sortBy: EventSortType;
  onSortChange: (sort: EventSortType) => void;
  selectedFilter: EventFilterType;
  onSelectFilter: (filter: EventFilterType) => void;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

const FILTER_ITEMS: { id: EventFilterType; label: string }[] = [
  { id: "ALL", label: "Todos" },
  { id: "FESTAS", label: "Festas" },
  { id: "SHOWS", label: "Shows" },
  { id: "MUSICA", label: "Música" },
  { id: "GRATUITO", label: "Gratuitos" },
  { id: "HOJE", label: "Hoje" },
  { id: "FIM_DE_SEMANA", label: "Fim de semana" },
];

export function NearbyEventsList({
  events,
  sortBy,
  onSortChange,
  selectedFilter,
  onSelectFilter,
  selectedEventId,
  onSelectEvent,
}: NearbyEventsListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Faz scroll suave até o evento selecionado quando o usuário clica num marcador do mapa
  useEffect(() => {
    if (selectedEventId) {
      const element = document.getElementById(`event-row-${selectedEventId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedEventId]);

  return (
    <section className="w-full space-y-4" aria-labelledby="roles-proximos-heading">
      {/* ----------------------------------------------------------------- */}
      {/* Cabeçalho da Seção: Título e Seletor de Ordenação */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div>
          <h2
            id="roles-proximos-heading"
            className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
          >
            ROLÊS MAIS PRÓXIMOS
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {events.length} rolê(s) encontrado(s) ordenados{" "}
            {sortBy === "distance" ? "por menor distância" : "por data mais próxima"}
          </p>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Seletor Simples de Ordenação: Por distância / Por data */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => onSortChange("distance")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              sortBy === "distance"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={sortBy === "distance"}
          >
            <Navigation className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Por distância</span>
          </button>

          <button
            type="button"
            onClick={() => onSortChange("date")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              sortBy === "date"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={sortBy === "date"}
          >
            <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Por data</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Barra de Filtros Sincronizada (visível para acesso rápido) */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground shrink-0 mr-1">
          <Filter className="h-3 w-3" />
          Filtro:
        </span>
        {FILTER_ITEMS.map((item) => {
          const active = selectedFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFilter(item.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* LISTA VERTICAL (NÃO CARDS, NÃO CARROSSEL) */}
      {/* ----------------------------------------------------------------- */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-10 text-center bg-card/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Nenhum rolê encontrado
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Não encontramos eventos com os filtros selecionados. Tente alterar os filtros
            ou expandir o raio de distância.
          </p>
          <button
            type="button"
            onClick={() => onSelectFilter("ALL")}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-90"
          >
            Ver todos os rolês
          </button>
        </div>
      ) : (
        <div
          ref={listRef}
          className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border/80 bg-card/80 overflow-hidden shadow-sm"
        >
          {events.map((event) => {
            const isSelected = event.id === selectedEventId;
            const isFree = event.priceInCents === 0;
            const priceText = isFree
              ? "Gratuito"
              : formatCurrencyFromCents(event.priceInCents);

            return (
              <div
                key={event.id}
                id={`event-row-${event.id}`}
                onClick={() => onSelectEvent(event.id)}
                className={`group relative flex items-center justify-between gap-3 p-3.5 sm:gap-4 sm:p-4 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-primary/5 ring-2 ring-primary/40 dark:bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
              >
                {/* Indicador lateral quando selecionado */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r" />
                )}

                {/* Link envolvendo a linha para navegação direta */}
                <Link
                  href={`/eventos/${event.slug}`}
                  className="flex flex-1 items-center gap-3 sm:gap-4 min-w-0"
                >
                  {/* 1. Miniatura da imagem do evento */}
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted shadow-xs">
                    <EventImage
                      src={event.imageUrl}
                      alt={event.name}
                      sizes="80px"
                    />
                    {isFree && (
                      <span className="absolute bottom-1 right-1 rounded bg-emerald-600 px-1 py-0.2 text-[9px] font-bold text-white shadow-xs">
                        GRÁTIS
                      </span>
                    )}
                  </div>

                  {/* 2. Informações do Evento: Nome, Categoria, Data, Distância, Local */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Nome do evento */}
                    <h3 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary sm:text-base truncate">
                      {event.name}
                    </h3>

                    {/* Categoria e Data/Horário com expressões inteligentes */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/80">
                        {event.category || "Festas"}
                      </span>
                      <span>·</span>
                      <span className="font-medium text-foreground">
                        {event.dateLabel || "Data a confirmar"}
                      </span>
                    </div>

                    {/* Distância em km e Localização */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {event.distanceLabel && (
                        <>
                          <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                            {event.distanceLabel}
                          </span>
                          <span>·</span>
                        </>
                      )}
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                </Link>

                {/* 3. Preço e Ação */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold sm:text-base ${
                        isFree
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {priceText}
                    </span>
                    <p className="text-[10px] text-muted-foreground hidden sm:block">
                      {event.availableTickets > 0
                        ? `${event.availableTickets} restantes`
                        : "Esgotado"}
                    </p>
                  </div>

                  <Link
                    href={`/eventos/${event.slug}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                    aria-label={`Ver detalhes de ${event.name}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
