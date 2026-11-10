"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Eye, Pencil, Plus, RefreshCw, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApiError,
  cancelAdminEvent,
  listAdminEvents,
} from "@/lib/api";
import {
  EVENT_STATUS_LABELS,
  formatCurrencyFromCents,
  formatDateTime,
} from "@/lib/format";
import type { Event, EventStatus, Pagination } from "@/types";
import {
  EventStatusBadge,
  InlineError,
  InlineSuccess,
  PanelLoading,
  PaginationControls,
} from "@/components/admin/admin-ui";
import { EventFormDialog } from "@/components/admin/event-form-dialog";

interface EventsPanelProps {
  onUnauthorized: () => void;
}

export function EventsPanel({ onUnauthorized }: EventsPanelProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const result = await listAdminEvents({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setEvents(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onUnauthorized();
        return;
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível carregar os eventos."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, onUnauthorized]);

  function refresh() {
    setLoading(true);
    setError(null);
    void fetchEvents();
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setError(null);
    setPage(nextPage);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca ao montar/trocar filtros
    void fetchEvents();
  }, [fetchEvents]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(event: Event) {
    setEditing(event);
    setDialogOpen(true);
  }

  async function handleCancel(event: Event) {
    const confirmed = window.confirm(
      `Cancelar o evento “${event.name}”? Inscrições existentes serão mantidas, mas o evento deixa de ser público.`
    );
    if (!confirmed) return;

    setCancellingId(event.id);
    setError(null);
    setMessage(null);
    try {
      await cancelAdminEvent(event.id);
      setMessage(`Evento “${event.name}” cancelado.`);
      await fetchEvents();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onUnauthorized();
        return;
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível cancelar o evento."
      );
    } finally {
      setCancellingId(null);
    }
  }

  async function handleSaved(saved: Event) {
    setDialogOpen(false);
    setEditing(null);
    setMessage(
      editing
        ? `Evento “${saved.name}” atualizado com sucesso.`
        : `Evento “${saved.name}” cadastrado com sucesso.`
    );
    setPage(1);
    await fetchEvents();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Eventos</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre, edite e cancele eventos pelo gateway.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo evento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busque por nome ou filtre por status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar evento"
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setLoading(true);
                setError(null);
                setPage(1);
                setStatusFilter(event.target.value as EventStatus | "");
              }}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="">Todos os status</option>
              {(Object.keys(EVENT_STATUS_LABELS) as EventStatus[]).map(
                (status) => (
                  <option key={status} value={status}>
                    {EVENT_STATUS_LABELS[status]}
                  </option>
                )
              )}
            </select>
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <InlineError message={error} />}
      {message && <InlineSuccess message={message} />}

      <Card>
        <CardContent className="pt-6">
          {loading && events.length === 0 ? (
            <PanelLoading label="Carregando eventos..." />
          ) : events.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Nenhum evento encontrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data e local</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Ingressos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="max-w-64 whitespace-normal font-medium">
                      {event.name}
                      <span className="mt-1 block font-mono text-xs text-muted-foreground">
                        /{event.slug}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <span className="block">{formatDateTime(event.startsAt)}</span>
                      <span className="text-xs text-muted-foreground">
                        {event.venue}
                      </span>
                    </TableCell>
                    <TableCell>
                      <EventStatusBadge status={event.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyFromCents(event.priceInCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {event.issuedTickets} / {event.totalTickets}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/admin/eventos/${event.id}`)
                          }
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Detalhes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(event)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleCancel(event)}
                          disabled={
                            event.status === "CANCELLED" ||
                            cancellingId === event.id
                          }
                        >
                          <Ban className="h-3.5 w-3.5" />
                          {cancellingId === event.id ? "Cancelando..." : "Cancelar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4">
            <PaginationControls
              pagination={pagination}
              onPageChange={changePage}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
