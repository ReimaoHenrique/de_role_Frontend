"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Info,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventImage } from "@/components/event-image";
import { EventStatusBadge } from "@/components/admin/admin-ui";
import {
  formatCurrencyFromCents,
  formatDateTime,
  occupancyPercentage,
} from "@/lib/format";
import type { Event } from "@/types";

interface EventDetailsProps {
  event: Event;
}

export function EventDetails({ event }: EventDetailsProps) {
  const soldOut = event.status === "SOLD_OUT" || event.availableTickets <= 0;
  const percentSold = occupancyPercentage(
    event.issuedTickets,
    event.totalTickets,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/admin">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel administrativo
        </Link>
      </Button>

      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="overflow-hidden">
          <div className="relative h-64 md:h-80">
            <EventImage
              src={event.imageUrl}
              alt={event.name}
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <EventStatusBadge status={event.status} />
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                {event.name}
              </h1>
              <p className="mt-1 font-mono text-sm text-white/80">
                /{event.slug}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/90">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(event.startsAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {event.venue}
                </span>
              </div>
            </div>
          </div>

          <CardContent className="space-y-8 p-6">
            {event.status === "DRAFT" && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Este evento está como rascunho (DRAFT) e ainda não é público.
                </AlertDescription>
              </Alert>
            )}

            {soldOut && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este evento está esgotado ou não possui ingressos disponíveis.
                </AlertDescription>
              </Alert>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950/40">
                <Ticket className="mx-auto mb-2 h-7 w-7 text-blue-600" />
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {event.issuedTickets} / {event.totalTickets}
                </p>
                <p className="text-sm text-muted-foreground">
                  ingressos emitidos
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950/40">
                <Users className="mx-auto mb-2 h-7 w-7 text-green-600" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {event.availableTickets}
                </p>
                <p className="text-sm text-muted-foreground">
                  ingressos disponíveis
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-950/40">
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {percentSold}%
                </p>
                <p className="text-sm text-muted-foreground">já vendido</p>
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {event.issuedTickets} de {event.totalTickets} ingressos
                  emitidos
                </span>
                <span>{event.availableTickets} restantes</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${percentSold}%` }}
                />
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Sobre o evento</h2>
              <p className="whitespace-pre-line text-muted-foreground">
                {event.description}
              </p>
            </section>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{event.termsOfUse}</AlertDescription>
            </Alert>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Detalhes do evento</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <EventStatusBadge status={event.status} />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Data e hora</p>
                  <p className="mt-1 font-medium">
                    {formatDateTime(event.startsAt)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Local</p>
                  <p className="mt-1 font-medium">{event.venue}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Preço</p>
                  <p className="mt-1 font-medium">
                    {formatCurrencyFromCents(event.priceInCents)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Slug público</p>
                  <p className="mt-1 font-medium">/{event.slug}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Imagem</p>
                  <p className="mt-1 font-medium">
                    {event.imageUrl ?? "Placeholder"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="mt-1 font-medium">
                    {formatDateTime(event.createdAt)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Atualizado em</p>
                  <p className="mt-1 font-medium">
                    {formatDateTime(event.updatedAt)}
                  </p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
