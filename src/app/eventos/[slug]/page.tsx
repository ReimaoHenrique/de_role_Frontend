import { gatewayRequest } from "@/lib/gateway";
import { getFeaturedEventBySlug } from "@/lib/events-data";
import { findUserEvent } from "@/lib/user-events";
import {
  EventClientLoader,
  EventDetailView,
} from "@/components/events/event-detail-view";
import type { Event } from "@/types";

export const dynamic = "force-dynamic";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;

  let event: Event | null = null;

  try {
    const result = await gatewayRequest<Event>(
      `/api/events/${encodeURIComponent(slug)}`
    );
    event = result.data;
  } catch {
    const userEvent = findUserEvent(slug);
    if (userEvent) {
      event = userEvent;
    } else {
      const featured = getFeaturedEventBySlug(slug);
      if (featured) {
        event = featured;
      }
    }
  }

  // Se o servidor encontrou o evento pelo gateway, arquivo local ou destaques, renderiza diretamente
  if (event) {
    return <EventDetailView event={event} />;
  }

  // Se o backend remoto não tem e não estava no arquivo no momento da renderização do servidor,
  // consulta o cliente (localStorage e API interna) com loading gracioso ao invés de lançar 404 imediato.
  return <EventClientLoader slug={slug} />;
}
