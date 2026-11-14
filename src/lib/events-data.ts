import type { Event, EventCategory } from "@/types";
import { listUserEvents } from "./user-events";
import {
  DEFAULT_USER_COORDS,
  haversineDistance,
  formatDistance,
  type GeoCoordinates,
} from "./geo";
import { formatRelativeEventDate } from "./format";

/** Mapeamento de locais conhecidos para coordenadas reais */
const KNOWN_VENUES_COORDS: Record<string, { lat: number; lng: number }> = {
  "espaço unimed": { lat: -23.5262, lng: -46.6667 }, // Barra Funda, SP
  "rua augusta": { lat: -23.5539, lng: -46.6575 }, // Consolação, SP
  "praça benedito calixto": { lat: -23.5594, lng: -46.6806 }, // Pinheiros, SP
  "parque ibirapuera": { lat: -23.5874, lng: -46.6576 }, // Ibirapuera, SP
  "vila madalena": { lat: -23.5552, lng: -46.6908 }, // Vila Madalena, SP
  "vila olímpia": { lat: -23.5956, lng: -46.6865 }, // Vila Olímpia, SP
  "av. paulista": { lat: -23.5615, lng: -46.6559 }, // Bela Vista, SP
  "mirante do alto": { lat: -22.9519, lng: -43.2105 }, // Rio de Janeiro
  "feira do rolo": { lat: -23.5412, lng: -46.6389 }, // Centro, SP
};

function inferCategory(name: string, description: string): EventCategory {
  const text = `${name} ${description}`.toLowerCase();
  if (
    text.includes("festa") ||
    text.includes("balada") ||
    text.includes("party") ||
    text.includes("funk") ||
    text.includes("universitári")
  ) {
    return "Festas";
  }
  if (
    text.includes("show") ||
    text.includes("festival") ||
    text.includes("rock") ||
    text.includes("banda") ||
    text.includes("turnê")
  ) {
    return "Shows";
  }
  if (
    text.includes("música") ||
    text.includes("pagode") ||
    text.includes("samba") ||
    text.includes("jazz") ||
    text.includes("acústico") ||
    text.includes("eletrônic")
  ) {
    return "Música";
  }
  if (
    text.includes("feira") ||
    text.includes("gastronomia") ||
    text.includes("teatro") ||
    text.includes("cultura")
  ) {
    return "Cultura";
  }
  return "Festas";
}

/** Gera um offset determinístico em torno de uma coordenada base com base em uma string */
function getDeterministicOffset(seed: string): { latOffset: number; lngOffset: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  // Offset entre ~0.003 e ~0.035 graus (aproximadamente 300m a 4km)
  const angle = Math.abs(hash % 360) * (Math.PI / 180);
  const distanceDeg = 0.004 + (Math.abs((hash >> 3) % 100) / 100) * 0.035;
  return {
    latOffset: Math.sin(angle) * distanceDeg,
    lngOffset: Math.cos(angle) * distanceDeg,
  };
}

/**
 * Cria datas dinâmicas relativas ao dia de hoje para que os rolês
 * demonstrem "Hoje", "Amanhã", "Sábado", etc. sempre com precisão.
 */
function createRelativeDate(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Descobre o próximo dia da semana (ex: próximo sábado = 6) */
function getNextDayOfWeek(targetDay: number, hour: number, minute = 0): string {
  const d = new Date();
  const currentDay = d.getDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) {
    diff += 7;
  }
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Rolês em destaque conforme solicitado na especificação visual:
 * - Festa Universitária (Festas · Hoje, 22h · 500 m)
 * - Pagode na Praça (Música · Amanhã, 18h · 1,2 km · Gratuito)
 * - Festival de Música (Shows · Sábado, 20h · 2,5 km)
 * e outros complementares.
 */
export function getFeaturedRoleEvents(baseCoords: GeoCoordinates = DEFAULT_USER_COORDS): Event[] {
  return [
    {
      id: "role-festa-universitaria",
      slug: "festa-universitaria",
      name: "Festa Universitária",
      category: "Festas",
      description:
        "A maior festa universitária da região com 2 pistas de dança, DJs tocando os melhores hits, cerveja gelada e integração total até o amanhecer.",
      imageUrl: "/events/boreal.jpg",
      startsAt: createRelativeDate(0, 22, 0), // Hoje às 22h
      venue: "Club Inbox · Rua Augusta, 1283",
      priceInCents: 3000,
      price: 30,
      totalTickets: 500,
      issuedTickets: 320,
      availableTickets: 180,
      status: "ACTIVE",
      termsOfUse: "Entrada permitida apenas para maiores de 18 anos com documento oficial com foto.",
      producerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // ~500m de distância
      latitude: baseCoords.lat + 0.0035,
      longitude: baseCoords.lng + 0.0032,
    },
    {
      id: "role-pagode-na-praca",
      slug: "pagode-na-praca",
      name: "Pagode na Praça",
      category: "Música",
      description:
        "Roda de samba e pagode ao ar livre na praça! Traga os amigos para curtir os clássicos do samba, comidinhas de rua artesanais e ambiente acolhedor.",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
      startsAt: createRelativeDate(1, 18, 0), // Amanhã às 18h
      venue: "Praça Benedito Calixto · Pinheiros",
      priceInCents: 0,
      price: 0,
      totalTickets: 1000,
      issuedTickets: 450,
      availableTickets: 550,
      status: "ACTIVE",
      termsOfUse: "Evento livre e gratuito. Entrada franca para todas as idades.",
      producerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // ~1.2km de distância
      latitude: baseCoords.lat - 0.008,
      longitude: baseCoords.lng + 0.007,
    },
    {
      id: "role-festival-de-musica",
      slug: "festival-de-musica",
      name: "Festival de Música",
      category: "Shows",
      description:
        "O festival que celebra novos talentos e atrações consagradas do pop e rock nacional em um palco de alta tecnologia com praça gastronômica.",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
      startsAt: getNextDayOfWeek(6, 20, 0), // Sábado às 20h
      venue: "Parque Ibirapuera · Arena de Eventos",
      priceInCents: 8000,
      price: 80,
      totalTickets: 2500,
      issuedTickets: 1800,
      availableTickets: 700,
      status: "ACTIVE",
      termsOfUse: "Classificação etária 16 anos desacompanhado ou qualquer idade acompanhado de responsável legal.",
      producerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // ~2.5km de distância
      latitude: baseCoords.lat - 0.018,
      longitude: baseCoords.lng - 0.015,
    },
    {
      id: "role-baile-funk-sunset",
      slug: "baile-funk-sunset",
      name: "Baile Funk Sunset Rooftop",
      category: "Festas",
      description:
        "Pôr do sol com a vista mais incrível da cidade, open bar de boas-vindas na primeira hora e os maiores DJs de funk e trap mandando o som.",
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
      startsAt: getNextDayOfWeek(5, 23, 0), // Sexta às 23h (Fim de semana)
      venue: "Terraço Rooftop · Vila Olímpia",
      priceInCents: 4500,
      price: 45,
      totalTickets: 600,
      issuedTickets: 410,
      availableTickets: 190,
      status: "ACTIVE",
      termsOfUse: "Obrigatória apresentação de documento oficial com foto. Proibida entrada de regata ou chinelo.",
      producerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // ~3.8km de distância
      latitude: baseCoords.lat - 0.027,
      longitude: baseCoords.lng + 0.021,
    },
    {
      id: "role-jazz-drinks-calcada",
      slug: "jazz-drinks-calcada",
      name: "Jazz & Drinks na Calçada",
      category: "Música",
      description:
        "Noite de jazz acústico e blues instrumental ao ar livre, acompanhado de coquetéis autorais e petiscos especiais.",
      imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80",
      startsAt: createRelativeDate(0, 19, 30), // Hoje às 19:30
      venue: "Bistrô do Centro · República",
      priceInCents: 0,
      price: 0,
      totalTickets: 200,
      issuedTickets: 140,
      availableTickets: 60,
      status: "ACTIVE",
      termsOfUse: "Entrada gratuita com contribuição espontânea aos músicos.",
      producerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // ~1.8km de distância
      latitude: baseCoords.lat + 0.012,
      longitude: baseCoords.lng - 0.009,
    },
    {
      id: "role-gastronomia-e-arte",
      slug: "gastronomia-e-arte-na-vila",
      name: "Feira de Gastronomia & Arte",
      category: "Cultura",
      description:
        "Comida de rua autêntica, cervejarias artesanais, feirinha de vinil e flash tattoo em um espaço descontraído para passar a tarde.",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
      startsAt: getNextDayOfWeek(0, 13, 0), // Domingo às 13h (Fim de semana)
      venue: "Galpão Cultural · Vila Madalena",
      priceInCents: 0,
      price: 0,
      totalTickets: 800,
      issuedTickets: 310,
      availableTickets: 490,
      status: "ACTIVE",
      termsOfUse: "Evento pet-friendly e para toda a família. Entrada gratuita.",
      producerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // ~3.2km de distância
      latitude: baseCoords.lat - 0.005,
      longitude: baseCoords.lng - 0.028,
    },
  ];
}

/**
 * Enriquece uma lista de eventos com coordenadas geográficas,
 * distâncias calculadas, categorias e etiquetas contextuais de data.
 */
export function enrichEvents(
  rawEvents: Event[],
  userCoords: GeoCoordinates = DEFAULT_USER_COORDS
): Event[] {
  const featured = getFeaturedRoleEvents(userCoords);

  // Unifica eventos vindos da API com os eventos em destaque e criados pelo usuário
  const allEventsMap = new Map<string, Event>();

  // Primeiro adiciona os eventos em destaque (que cobrem os exemplos exigidos)
  for (const item of featured) {
    allEventsMap.set(item.slug, item);
  }

  // Adiciona eventos criados pelo usuário
  const userEvents = listUserEvents();
  for (const item of userEvents) {
    allEventsMap.set(item.slug, item);
  }

  // Depois mescla os da API / banco
  for (const raw of rawEvents) {
    if (!raw.id) continue;
    const existing = allEventsMap.get(raw.slug);
    if (existing) {
      // Mescla mantendo dados do banco caso existam
      allEventsMap.set(raw.slug, {
        ...existing,
        ...raw,
        category: raw.category || existing.category || inferCategory(raw.name, raw.description || ""),
        latitude: raw.latitude || existing.latitude,
        longitude: raw.longitude || existing.longitude,
      });
    } else {
      // Determina coordenadas para o evento da API
      let lat = raw.latitude;
      let lng = raw.longitude;

      if (!lat || !lng) {
        // Tenta encontrar por local conhecido
        const venueLower = (raw.venue || "").toLowerCase();
        for (const [key, coords] of Object.entries(KNOWN_VENUES_COORDS)) {
          if (venueLower.includes(key)) {
            lat = coords.lat;
            lng = coords.lng;
            break;
          }
        }
      }

      if (!lat || !lng) {
        // Gera offset determinístico
        const offset = getDeterministicOffset(raw.id || raw.name);
        lat = userCoords.lat + offset.latOffset;
        lng = userCoords.lng + offset.lngOffset;
      }

      const category =
        raw.category || inferCategory(raw.name, raw.description || "");

      allEventsMap.set(raw.slug, {
        ...raw,
        latitude: lat,
        longitude: lng,
        category,
      });
    }
  }

  // Agora calcula distâncias e labels para todos os eventos
  const enrichedList: Event[] = Array.from(allEventsMap.values()).map((evt) => {
    const lat = evt.latitude ?? userCoords.lat;
    const lng = evt.longitude ?? userCoords.lng;
    const distanceKm = haversineDistance(userCoords.lat, userCoords.lng, lat, lng);
    const distanceLabel = formatDistance(distanceKm);
    const dateLabel = formatRelativeEventDate(evt.startsAt);

    return {
      ...evt,
      latitude: lat,
      longitude: lng,
      distanceKm,
      distanceLabel,
      dateLabel,
    };
  });

  return enrichedList;
}

/** Busca evento em destaque por slug para a página de detalhes */
export function getFeaturedEventBySlug(slug: string): Event | null {
  const featured = getFeaturedRoleEvents(DEFAULT_USER_COORDS);
  return featured.find((e) => e.slug === slug) ?? null;
}
