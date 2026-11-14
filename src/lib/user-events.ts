import fs from "fs";
import path from "path";
import type { CreateEventInput, Event, UpdateEventInput } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "user-events.json");

function ensureDirectoryExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Erro ao criar diretório data:", err);
  }
}

function readEventsFromFile(): Event[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(EVENTS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(EVENTS_FILE, "utf-8");
    if (!content.trim()) return [];
    return JSON.parse(content) as Event[];
  } catch (err) {
    console.error("Erro ao ler user-events.json:", err);
    return [];
  }
}

function writeEventsToFile(events: Event[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar user-events.json:", err);
  }
}

export function saveUserEvent(
  input: CreateEventInput & {
    category?: string;
    latitude?: number;
    longitude?: number;
  }
): Event {
  const events = readEventsFromFile();

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

  events.unshift(newEvent);
  writeEventsToFile(events);

  return newEvent;
}

export function listUserEvents(): Event[] {
  return readEventsFromFile();
}

export function findUserEvent(idOrSlug: string): Event | null {
  if (!idOrSlug) return null;
  const events = readEventsFromFile();
  const normalized = idOrSlug.trim().toLowerCase();

  return (
    events.find(
      (e) =>
        e.id === idOrSlug ||
        e.slug === idOrSlug ||
        e.slug.toLowerCase() === normalized ||
        e.id.toLowerCase() === normalized ||
        e.slug.endsWith(`-${normalized}`)
    ) ?? null
  );
}

export function updateUserEvent(id: string, input: UpdateEventInput): Event | null {
  const events = readEventsFromFile();
  const index = events.findIndex((e) => e.id === id || e.slug === id);
  if (index === -1) return null;

  const existing = events[index];
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

  events[index] = updated;
  writeEventsToFile(events);
  return updated;
}

export function deleteUserEvent(id: string): boolean {
  const events = readEventsFromFile();
  const filtered = events.filter((e) => e.id !== id && e.slug !== id);
  if (filtered.length === events.length) return false;

  writeEventsToFile(filtered);
  return true;
}
