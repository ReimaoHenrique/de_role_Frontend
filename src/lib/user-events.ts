import type { CreateEventInput, Event, UpdateEventInput } from "@/types";

// Armazenamento em memória no servidor para eventos criados pelo usuário
const createdEventsStore = new Map<string, Event>();

export function saveUserEvent(
  input: CreateEventInput & {
    category?: string;
    latitude?: number;
    longitude?: number;
  }
): Event {
  const id = crypto.randomUUID();
  const slugBase = input.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${slugBase || "role"}-${id.slice(0, 6)}`;

  const newEvent: Event = {
    id,
    slug,
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl || null,
    startsAt: input.startsAt,
    venue: input.venue,
    priceInCents: input.priceInCents,
    price: input.priceInCents / 100,
    totalTickets: input.totalTickets,
    issuedTickets: 0,
    availableTickets: input.totalTickets,
    status: input.status || "ACTIVE",
    termsOfUse:
      input.termsOfUse ||
      "Entrada permitida mediante apresentação de documento oficial com foto.",
    producerId: input.producerId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: input.category || "Festas",
    latitude: input.latitude,
    longitude: input.longitude,
  };

  createdEventsStore.set(newEvent.id, newEvent);
  createdEventsStore.set(newEvent.slug, newEvent);
  return newEvent;
}

export function listUserEvents(): Event[] {
  const unique = new Map<string, Event>();
  for (const event of createdEventsStore.values()) {
    unique.set(event.id, event);
  }
  return Array.from(unique.values());
}

export function findUserEvent(idOrSlug: string): Event | null {
  return createdEventsStore.get(idOrSlug) ?? null;
}

export function updateUserEvent(id: string, input: UpdateEventInput): Event | null {
  const existing = createdEventsStore.get(id);
  if (!existing) return null;

  const updated: Event = {
    ...existing,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
    ...(input.venue !== undefined ? { venue: input.venue } : {}),
    ...(input.priceInCents !== undefined
      ? { priceInCents: input.priceInCents, price: input.priceInCents / 100 }
      : {}),
    ...(input.totalTickets !== undefined ? { totalTickets: input.totalTickets } : {}),
    ...(input.termsOfUse !== undefined ? { termsOfUse: input.termsOfUse } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    updatedAt: new Date().toISOString(),
  };

  createdEventsStore.set(updated.id, updated);
  createdEventsStore.set(updated.slug, updated);
  return updated;
}

export function deleteUserEvent(id: string): boolean {
  const existing = createdEventsStore.get(id);
  if (!existing) return false;

  createdEventsStore.delete(existing.id);
  createdEventsStore.delete(existing.slug);
  return true;
}
