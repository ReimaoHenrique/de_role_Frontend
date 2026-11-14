"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Ticket,
  User,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ApiError,
  accountEvents,
  accountGuests,
  accountMe,
  cancelAccountEvent,
  createAccountEvent,
  logoutAccount,
  updateAccount,
  updateAccountEvent,
} from "@/lib/api";
import {
  EVENT_STATUS_LABELS,
  GUEST_STATUS_LABELS,
  eventStatusClass,
  formatCurrencyFromCents,
  formatDateTime,
  fromDateTimeInputValue,
  guestStatusClass,
  toDateTimeInputValue,
} from "@/lib/format";
import type { Account, Event, EventStatus, Guest } from "@/types";

export default function PerfilPage() {
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Instantâneo do relógio capturado na montagem (evita data instável em re-render).
  const [now] = useState(() => Date.now());

  // Diálogos
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [me, tickets, events] = await Promise.all([
          accountMe(),
          accountGuests().catch(() => [] as Guest[]),
          accountEvents().catch(() => [] as Event[]),
        ]);
        if (!active) return;
        setAccount(me);
        setGuests(tickets);
        setMyEvents(events);
        setError(null);
      } catch (caught) {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace("/login");
          return;
        }
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Não foi possível carregar seu perfil."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await logoutAccount();
    } finally {
      router.push("/login");
    }
  }

  function handleProfileUpdated(updated: Account) {
    setAccount(updated);
    setEditProfileOpen(false);
    setSuccessMessage("Perfil atualizado com sucesso!");
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  function handleEventSaved(saved: Event) {
    setMyEvents((prev) => {
      const index = prev.findIndex((e) => e.id === saved.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setEventDialogOpen(false);
    setEditingEvent(null);
    setSuccessMessage(
      editingEvent
        ? "Evento atualizado com sucesso!"
        : "Evento criado com sucesso! Sua conta agora é uma conta de produtor."
    );
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  async function handleCancelEvent(eventId: string) {
    if (!window.confirm("Tem certeza que deseja cancelar este evento? Os ingressos não poderão mais ser vendidos.")) {
      return;
    }
    setCancellingEventId(eventId);
    try {
      await cancelAccountEvent(eventId);
      setMyEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "CANCELLED" } : e))
      );
      setSuccessMessage("Evento cancelado.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível cancelar o evento."
      );
    } finally {
      setCancellingEventId(null);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando perfil...
        </div>
      </div>
    );
  }

  if (!account) return null;

  const upcoming = guests.filter(
    (guest) =>
      guest.status === "ACTIVE" && Date.parse(guest.event.startsAt) > now
  );
  const pastOrUsed = guests.filter((guest) => !upcoming.includes(guest));
  const hasCpf = Boolean(account.cpf && account.cpf.trim().length > 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <User className="h-7 w-7 text-blue-600" />
              {account.name || "Meu perfil"}
            </h1>
            <p className="text-muted-foreground">{account.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={() => {
                setEditingEvent(null);
                setEventDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Criar evento
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Feedback de erro e sucesso */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-green-500/50 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Alerta de CPF ausente / convite para completar perfil */}
        {!hasCpf && (
          <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
              <AlertDescription className="text-sm">
                <strong>Complete seu cadastro:</strong> Você ainda não cadastrou seu CPF e dados bancários/Pix.
                Eles são necessários para organizar eventos e receber transferências.
              </AlertDescription>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-amber-600 text-amber-900 hover:bg-amber-100 dark:border-amber-400 dark:text-amber-200 dark:hover:bg-amber-900/40"
                onClick={() => setEditProfileOpen(true)}
              >
                Completar dados
              </Button>
            </div>
          </Alert>
        )}

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Ticket className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{guests.length}</p>
              <p className="text-xs text-muted-foreground">Meus Ingressos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground">Próximos eventos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Sparkles className="mx-auto mb-1 h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold">{myEvents.length}</p>
              <p className="text-xs text-muted-foreground">Eventos criados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {myEvents.reduce((acc, ev) => acc + (ev.issuedTickets ?? 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Ingressos emitidos</p>
            </CardContent>
          </Card>
        </div>

        {/* SEÇÃO: MEUS EVENTOS (PRODUTOR) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Eventos que eu organizo
              </h2>
              <p className="text-sm text-muted-foreground">
                Crie e gerencie os eventos produzidos por você
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/eventos/criar">
                <Plus className="h-4 w-4 mr-1" />
                Novo evento
              </Link>
            </Button>
          </div>

          {myEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-blue-50 dark:bg-blue-950/50 p-3 mb-3">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground">Você ainda não organiza eventos</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
                  Transforme sua conta em produtora! Crie seu primeiro evento para começar a emitir e gerenciar ingressos.
                </p>
                <Button asChild>
                  <Link href="/eventos/criar">
                    <Plus className="h-4 w-4 mr-1" />
                    Criar meu primeiro evento
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {myEvents.map((event) => (
                <ProducerEventCard
                  key={event.id}
                  event={event}
                  cancelling={cancellingEventId === event.id}
                  onEdit={() => {
                    setEditingEvent(event);
                    setEventDialogOpen(true);
                  }}
                  onCancel={() => handleCancelEvent(event.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* SEÇÃO: MEUS INGRESSOS */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-600" />
            Meus ingressos para eventos futuros
          </h2>

          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Você ainda não tem ingressos para eventos futuros.{" "}
                <Link href="/" className="text-blue-600 hover:underline">
                  Ver eventos disponíveis
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {upcoming.map((guest) => (
                <TicketCard key={guest.id} guest={guest} />
              ))}
            </div>
          )}
        </section>

        {pastOrUsed.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              Histórico de ingressos
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pastOrUsed.map((guest) => (
                <TicketCard key={guest.id} guest={guest} />
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO: DADOS DA CONTA */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Dados da conta</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditProfileOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Editar dados
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Perfil e Pagamentos</CardTitle>
              <CardDescription>
                Informações cadastrais e dados para transferências Pix.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Info label="Nome" value={account.name || "(Não informado)"} />
              <Info label="E-mail" value={account.email} />
              <Info
                label="Data de nascimento"
                value={
                  account.birthDate
                    ? `${account.birthDate} (${account.age ?? "-"} anos)`
                    : "-"
                }
              />
              <Info
                label="CPF"
                value={account.cpf || "(Pendente de preenchimento)"}
                highlight={!hasCpf}
              />
              <Info label="Endereço" value={account.address || "-"} />
              <Info label="Conta bancária" value={account.bankAccount || "-"} />
              <Info label="Chave Pix" value={account.pixKey || "-"} />
            </CardContent>
          </Card>
        </section>
      </div>

      {/* MODAL: EDITAR PERFIL */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        account={account}
        onSaved={handleProfileUpdated}
      />

      {/* MODAL: CRIAR / EDITAR EVENTO DA CONTA */}
      <AccountEventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={editingEvent}
        onSaved={handleEventSaved}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componentes Auxiliares
// ---------------------------------------------------------------------------

function Info({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md px-3 py-2 ${
        highlight
          ? "border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
          : "bg-muted/50"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-all font-medium">{value}</p>
    </div>
  );
}

function TicketCard({ guest }: { guest: Guest }) {
  const [showQr, setShowQr] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="truncate">{guest.event.name}</span>
          <Badge className={guestStatusClass(guest.status)}>
            {GUEST_STATUS_LABELS[guest.status]}
          </Badge>
        </CardTitle>
        <CardDescription className="flex flex-col gap-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateTime(guest.event.startsAt)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {guest.event.venue}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          {showQr && (
            <div className="rounded-lg border bg-background p-2">
              <QRCodeSVG value={guest.ticketHash} size={96} level="M" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Tag do ingresso</p>
            <p className="break-all rounded bg-muted px-2 py-1 font-mono text-xs">
              {guest.ticketHash}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowQr((current) => !current)}
          >
            {showQr ? "Ocultar QR" : "Ver QR"}
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/eventos/${guest.event.id}`}>Ver evento</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProducerEventCard({
  event,
  cancelling,
  onEdit,
  onCancel,
}: {
  event: Event;
  cancelling: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const isCancelled = event.status === "CANCELLED";

  return (
    <Card className={isCancelled ? "opacity-75" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base truncate font-semibold">
            {event.name}
          </CardTitle>
          <Badge className={eventStatusClass(event.status)}>
            {EVENT_STATUS_LABELS[event.status]}
          </Badge>
        </div>
        <CardDescription className="space-y-1">
          <span className="flex items-center gap-1 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateTime(event.startsAt)}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <MapPin className="h-3.5 w-3.5" />
            {event.venue}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-muted/60 p-2">
            <span className="text-muted-foreground block">Ingressos</span>
            <span className="font-semibold">
              {event.issuedTickets ?? 0} / {event.totalTickets} emitidos
            </span>
          </div>
          <div className="rounded bg-muted/60 p-2">
            <span className="text-muted-foreground block">Valor</span>
            <span className="font-semibold">
              {event.priceInCents === 0
                ? "Gratuito"
                : formatCurrencyFromCents(event.priceInCents)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t">
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/eventos/${event.slug || event.id}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Ver página
            </Link>
          </Button>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
            {!isCancelled && (
              <Button
                size="sm"
                variant="destructive"
                disabled={cancelling}
                onClick={onCancel}
              >
                {cancelling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Ban className="h-3.5 w-3.5 mr-1" />
                )}
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Diálogo de Edição de Perfil
// ---------------------------------------------------------------------------

function EditProfileDialog({
  open,
  onOpenChange,
  account,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account;
  onSaved: (account: Account) => void;
}) {
  const [name, setName] = useState(account.name ?? "");
  const [cpf, setCpf] = useState(account.cpf ?? "");
  const [address, setAddress] = useState(account.address ?? "");
  const [pixKey, setPixKey] = useState(account.pixKey ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(account.name ?? "");
      setCpf(account.cpf ?? "");
      setAddress(account.address ?? "");
      setPixKey(account.pixKey ?? "");
      setError(null);
    }
  }, [open, account]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updated = await updateAccount({
        name: name.trim() || undefined,
        cpf: cpf.trim() || undefined,
        address: address.trim() || undefined,
        pixKey: pixKey.trim() || undefined,
      });
      onSaved(updated);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível atualizar o perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar dados do perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais, endereço e chave Pix para recebimentos.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome completo</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-cpf">
              CPF {!account.cpf && <span className="text-amber-600 font-normal">(Recomendado preencher)</span>}
            </Label>
            <Input
              id="profile-cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-address">Endereço</Label>
            <Input
              id="profile-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, complemento, cidade - UF"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-pix">Chave Pix</Label>
            <Input
              id="profile-pix"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Chave Pix (CPF, e-mail, telefone ou aleatória)"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Diálogo de Criação / Edição de Evento da Conta
// ---------------------------------------------------------------------------

function AccountEventDialog({
  open,
  onOpenChange,
  event,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onSaved: (event: Event) => void;
}) {
  const isEditing = Boolean(event);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [venue, setVenue] = useState("");
  const [price, setPrice] = useState("0");
  const [totalTickets, setTotalTickets] = useState("100");
  const [termsOfUse, setTermsOfUse] = useState(
    "Entrada permitida mediante apresentação de documento com foto."
  );
  const [status, setStatus] = useState<EventStatus>("ACTIVE");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (event) {
        setName(event.name);
        setDescription(event.description);
        setImageUrl(event.imageUrl ?? "");
        setStartsAt(toDateTimeInputValue(event.startsAt));
        setVenue(event.venue);
        setPrice((event.priceInCents / 100).toFixed(2));
        setTotalTickets(String(event.totalTickets));
        setTermsOfUse(event.termsOfUse);
        setStatus(event.status);
      } else {
        setName("");
        setDescription("");
        setImageUrl("");
        // Define data default para amanhã às 19:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(19, 0, 0, 0);
        setStartsAt(toDateTimeInputValue(tomorrow.toISOString()));
        setVenue("");
        setPrice("0");
        setTotalTickets("100");
        setTermsOfUse(
          "Entrada permitida mediante apresentação de documento com foto."
        );
        setStatus("ACTIVE");
      }
      setError(null);
    }
  }, [open, event]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEditing && event) {
        const updated = await updateAccountEvent(event.id, {
          name: name.trim(),
          description: description.trim(),
          status,
        });
        onSaved(updated);
      } else {
        const priceClean = Number(price.replace(",", "."));
        const priceInCents = Math.round((Number.isFinite(priceClean) ? priceClean : 0) * 100);
        const ticketsClean = parseInt(totalTickets, 10);

        if (!name.trim()) throw new Error("Informe o nome do evento.");
        if (description.trim().length < 10) throw new Error("A descrição deve ter ao menos 10 caracteres.");
        if (!venue.trim()) throw new Error("Informe o local do evento.");
        if (!startsAt) throw new Error("Informe a data e hora do evento.");
        if (!ticketsClean || ticketsClean <= 0) throw new Error("Quantidade de ingressos deve ser maior que zero.");

        const created = await createAccountEvent({
          name: name.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim() || null,
          startsAt: fromDateTimeInputValue(startsAt),
          venue: venue.trim(),
          priceInCents,
          totalTickets: ticketsClean,
          termsOfUse: termsOfUse.trim(),
          status,
        });
        onSaved(created);
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
          ? caught.message
          : "Erro ao salvar evento."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar evento" : "Criar novo evento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do seu evento."
              : "Preencha os detalhes do evento para publicá-lo na plataforma."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">Nome do evento *</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Noite de Samba no Pelô"
              required
              minLength={3}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Descrição *</Label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as atrações, horário e detalhes do evento..."
              required
              minLength={10}
              maxLength={5000}
              rows={3}
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>

          {!isEditing && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-starts">Data e hora *</Label>
                  <Input
                    id="event-starts"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-venue">Local *</Label>
                  <Input
                    id="event-venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Ex: Arena Fonte Nova"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-price">Preço por ingresso (R$)</Label>
                  <Input
                    id="event-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00 para gratuito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-tickets">Total de ingressos *</Label>
                  <Input
                    id="event-tickets"
                    type="number"
                    min="1"
                    max="1000000"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-image">URL da Imagem de capa (opcional)</Label>
                <Input
                  id="event-image"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-terms">Regras e Termos de uso</Label>
                <textarea
                  id="event-terms"
                  value={termsOfUse}
                  onChange={(e) => setTermsOfUse(e.target.value)}
                  rows={2}
                  maxLength={5000}
                  className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
              </div>
            </>
          )}

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="event-status">Status do evento</Label>
              <select
                id="event-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="ACTIVE">Ativo (visível e vendendo)</option>
                <option value="DRAFT">Rascunho (não público)</option>
                <option value="FINISHED">Finalizado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Atualizar evento"
              ) : (
                "Publicar evento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
