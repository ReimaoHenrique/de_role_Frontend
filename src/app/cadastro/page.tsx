"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Ticket } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError, createGuest, listEvents } from "@/lib/api";
import { formatarCPF, validarCPF, validarEmail } from "@/lib/validations";
import type { Event, Guest } from "@/types";

export default function CadastroPage() {
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);

  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      setLoadingEvents(true);
      try {
        const result = await listEvents({ status: "ACTIVE" });
        if (active) setEvents(result.data);
      } catch {
        if (active) setEvents([]);
      } finally {
        if (active) setLoadingEvents(false);
      }
    }

    void loadEvents();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const cpfDigits = cpf.replace(/\D/g, "");

    if (fullName.trim().length < 2) {
      setError("Informe o nome completo.");
      return;
    }

    if (!cpfDigits || !validarCPF(cpfDigits)) {
      setError("CPF inválido. Confira os números informados.");
      return;
    }

    if (!normalizedEmail || !validarEmail(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (!birthDate) {
      setError("Informe a data de nascimento.");
      return;
    }

    if (!eventId) {
      setError("Selecione o evento para criar a conta.");
      return;
    }

    setLoading(true);
    try {
      const created = await createGuest({
        eventId,
        name: fullName.trim(),
        email: normalizedEmail,
        cpf: cpfDigits,
      });
      setGuest(created);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível criar a conta. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  if (guest) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Ticket className="mx-auto mb-4 h-16 w-16 text-blue-600" />
            <h1 className="mb-2 text-3xl font-bold text-foreground">Conta criada</h1>
            <p className="text-muted-foreground">
              A conta foi vinculada ao evento e o ingresso foi gerado.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {guest.event.name}
                </span>
              </CardTitle>
              <CardDescription>
                Dados da conta e do ingresso gerado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 p-4 text-center sm:flex-row sm:text-left">
                <div className="rounded-lg border bg-background p-2">
                  <QRCodeSVG value={guest.ticketHash} size={132} level="M" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tag do ingresso
                  </p>
                  <p className="break-all rounded bg-muted px-2 py-1 font-mono text-sm">
                    {guest.ticketHash}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {guest.name} · {guest.email}
                  </p>
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-300">
                  Conta criada com sucesso para {guest.name}. O ingresso para{" "}
                  {guest.event.name} está disponível.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <Ticket className="mx-auto mb-4 h-16 w-16 text-blue-600" />
          <h1 className="mb-2 text-3xl font-bold text-foreground">Criar conta</h1>
          <p className="text-muted-foreground">
            Cadastre o participante e gere a tag de ingresso do evento.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da conta</CardTitle>
            <CardDescription>
              CPF, nome completo, e-mail, data de nascimento, endereço, conta
              bancária e chave Pix são vinculados à conta criada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cadastro-name">Nome completo</Label>
                <Input
                  id="cadastro-name"
                  placeholder="Maria Silva"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cadastro-cpf">CPF</Label>
                  <Input
                    id="cadastro-cpf"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(event) => setCpf(formatarCPF(event.target.value))}
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cadastro-email">E-mail</Label>
                  <Input
                    id="cadastro-email"
                    type="email"
                    autoComplete="email"
                    placeholder="maria@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cadastro-birth">Data de nascimento</Label>
                  <Input
                    id="cadastro-birth"
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cadastro-event">Evento</Label>
                  <select
                    id="cadastro-event"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={eventId}
                    onChange={(event) => setEventId(event.target.value)}
                    disabled={loadingEvents}
                  >
                    <option value="">{loadingEvents ? "Carregando eventos..." : "Selecione o evento"}</option>
                    {events.map((eventOption) => (
                      <option key={eventOption.id} value={eventOption.id}>
                        {eventOption.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cadastro-address">Endereço</Label>
                <Input
                  id="cadastro-address"
                  placeholder="Rua, número, cidade, estado"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cadastro-bank">Conta bancária</Label>
                  <Input
                    id="cadastro-bank"
                    placeholder="Conta bancária"
                    value={bankAccount}
                    onChange={(event) => setBankAccount(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cadastro-pix">Chave Pix</Label>
                  <Input
                    id="cadastro-pix"
                    placeholder="Chave Pix"
                    value={pixKey}
                    onChange={(event) => setPixKey(event.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || loadingEvents}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
