import { AlertCircle, Search, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventsExplorer } from "@/components/gps/events-explorer";
import { buildQuery, GatewayError, gatewayRequest } from "@/lib/gateway";
import type { Event } from "@/types";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = (params.search ?? "").trim();

  let events: Event[] = [];
  let error: string | null = null;

  try {
    const query = buildQuery({
      status: "ACTIVE",
      limit: 20,
      search: search || undefined,
    });
    const result = await gatewayRequest<Event[]>(`/api/events${query}`);
    events = result.data;
  } catch (caught) {
    if (caught instanceof GatewayError) {
      error = caught.message;
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      {/* Hero / Cabeçalho de Descoberta */}
      <section className="mx-auto mb-8 text-center">
        <Badge className="mb-3" variant="secondary">
          <Ticket className="mr-1 h-3 w-3" />
          Descubra onde ir hoje
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Encontre seu próximo rolê
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Explore o mapa interativo, veja as distâncias em tempo real e escolha onde colar.
        </p>

        {/* Busca por texto */}
        <form action="/" method="get" className="mx-auto mt-5 flex max-w-lg gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder="Buscar por nome, local ou estilo de rolê"
              className="pl-9"
              aria-label="Buscar eventos"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </form>
      </section>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {error} (Modo de demonstração ativado com rolês locais em destaque)
          </p>
        </div>
      )}

      {/* 
        Componente Principal com:
        1. GPS Retrátil (Inicia fechado por padrão como botão retangular "EXPLORAR MAPA", abre em 74vh)
        2. ROLÊS MAIS PRÓXIMOS (Lista vertical, NÃO cards e NÃO carrossel, seletor Por distância/Por data)
      */}
      <EventsExplorer initialEvents={events} initialSearch={search} />
    </div>
  );
}
