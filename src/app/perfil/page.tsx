"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  Loader2,
  LogOut,
  MapPin,
  Ticket,
  User,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError, accountGuests, accountMe, updateAccount, logoutAccount } from "@/lib/api";
import {
  formatDateTime,
  GUEST_STATUS_LABELS,
  guestStatusClass,
} from "@/lib/format";
import type { Account, Guest } from "@/types";

export default function PerfilPage() {
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Instantâneo do relógio capturado na montagem (evita data instável em re-render).
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [me, tickets] = await Promise.all([accountMe(), accountGuests()]);
        if (!active) return;
        setAccount(me);
        setGuests(tickets);
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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <User className="h-7 w-7 text-blue-600" />
              {account.name || "Meu perfil"}
            </h1>
            <p className="text-muted-foreground">{account.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Ticket className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{guests.length}</p>
              <p className="text-xs text-muted-foreground">Ingressos</p>
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
              <User className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{account.age ?? "-"}</p>
              <p className="text-xs text-muted-foreground">Idade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {guests.filter((guest) => guest.status === "USED").length}
              </p>
              <p className="text-xs text-muted-foreground">Utilizados</p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            Próximos eventos
          </h2>

          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Você ainda não tem ingressos para eventos futuros.{" "}
                <Link href="/" className="text-blue-600 hover:underline">
                  Ver eventos
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
              Outros ingressos
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pastOrUsed.map((guest) => (
                <TicketCard key={guest.id} guest={guest} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Dados da conta</h2>
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Informações fornecidas no cadastro.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Info label="E-mail" value={account.email} />
              <Info
                label="Data de nascimento"
                value={
                  account.birthDate
                    ? `${account.birthDate} (${account.age ?? "-"} anos)`
                    : "-"
                }
              />
              <Info label="CPF" value={account.cpf ?? "-"} />
              <Info label="Endereço" value={account.address ?? "-"} />
              <Info label="Conta bancária" value={account.bankAccount ?? "-"} />
              <Info label="Chave Pix" value={account.pixKey ?? "-"} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
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
