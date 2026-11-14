import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Info,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EventImage } from "@/components/event-image";
import { TicketForm } from "@/components/TicketForm";
import {
  EVENT_STATUS_LABELS,
  eventStatusClass,
  formatCurrencyFromCents,
  formatDateTime,
  occupancyPercentage,
} from "@/lib/format";
import { GatewayError, gatewayRequest } from "@/lib/gateway";
import { getFeaturedEventBySlug } from "@/lib/events-data";
import { findUserEvent } from "@/lib/user-events";
import type { Event } from "@/types";

export const dynamic = "force-dynamic";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;

  let event: Event | null = null;
  let error: string | null = null;

  try {
    const result = await gatewayRequest<Event>(
      `/api/events/${encodeURIComponent(slug)}`
    );
    event = result.data;
  } catch (caught) {
    const userEvent = findUserEvent(slug);
    if (userEvent) {
      event = userEvent;
    } else {
      const featured = getFeaturedEventBySlug(slug);
      if (featured) {
        event = featured;
      } else {
        if (caught instanceof GatewayError && caught.status === 404) {
          notFound();
        }
        error =
          caught instanceof GatewayError
            ? caught.message
            : "Não foi possível carregar os detalhes do evento.";
      }
    }
  }

  if (error || !event) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error ?? "Evento não encontrado."}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar para os eventos
          </Link>
        </Button>
      </div>
    );
  }

  const soldOut = event.status === "SOLD_OUT" || event.availableTickets <= 0;
  const percent = occupancyPercentage(
    event.issuedTickets,
    event.totalTickets
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Todos os eventos
        </Link>
      </Button>

      <div className="mx-auto max-w-4xl">
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
              <Badge className={eventStatusClass(event.status)}>
                {EVENT_STATUS_LABELS[event.status]}
              </Badge>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                {event.name}
              </h1>
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
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950/40">
                <Users className="mx-auto mb-2 h-7 w-7 text-blue-600" />
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {event.availableTickets}
                </p>
                <p className="text-sm text-muted-foreground">
                  ingressos disponíveis
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950/40">
                <Ticket className="mx-auto mb-2 h-7 w-7 text-green-600" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrencyFromCents(event.priceInCents)}
                </p>
                <p className="text-sm text-muted-foreground">por ingresso</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-950/40">
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {percent}%
                </p>
                <p className="text-sm text-muted-foreground">já vendido</p>
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {event.issuedTickets} de {event.totalTickets} ingressos emitidos
                </span>
                <span>{event.availableTickets} restantes</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold">Sobre o evento</h2>
              <p className="whitespace-pre-line text-muted-foreground">
                {event.description}
              </p>
            </section>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{event.termsOfUse}</AlertDescription>
            </Alert>

            <section>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Garanta seu ingresso</CardTitle>
              </CardHeader>
              <TicketForm event={event} disabled={soldOut} />
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
