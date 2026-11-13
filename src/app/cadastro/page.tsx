"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2, Ticket, User } from "lucide-react";
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
import { ApiError, listEvents, registerAccount } from "@/lib/api";
import { formatarCPF, validarCPF, validarEmail } from "@/lib/validations";
import type { Event, Guest } from "@/types";

export default function CadastroPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);

  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Guest | null>(null);

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

    // Obrigatórios: e-mail, senha e data de nascimento (idade).
    if (!normalizedEmail || !validarEmail(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (!birthDate) {
      setError("Informe a data de nascimento.");
      return;
    }

    const birth = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(birth.getTime()) || birth > new Date()) {
      setError("Data de nascimento inválida.");
      return;
    }

    let age = new Date().getFullYear() - birth.getFullYear();
    const monthDiff = new Date().getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && new Date().getDate() < birth.getDate())
    ) {
      age -= 1;
    }
    if (age < 13) {
      setError("Você precisa ter pelo menos 13 anos para criar uma conta.");
      return;
    }

    // Opcionais: nome, CPF, endereço, conta bancária, chave Pix e evento.
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits && !validarCPF(cpfDigits)) {
      setError("CPF inválido. Confira os números informados.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerAccount({
        email: normalizedEmail,
        password,
        birthDate,
        name: fullName.trim() || null,
        cpf: cpfDigits || null,
        address: address.trim() || null,
        bankAccount: bankAccount.trim() || null,
        pixKey: pixKey.trim() || null,
        eventId: eventId || null,
      });

      if (result.ticket) {
        setTicket(result.ticket);
      } else {
        router.push("/perfil");
      }
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

  if (ticket) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Ticket className="mx-auto mb-4 h-16 w-16 text-blue-600" />
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              Conta criada
            </h1>
            <p className="text-muted-foreground">
              Sua conta foi criada e o ingresso para {ticket.event.name} foi
              emitido.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {ticket.event.name}
                </span>
              </CardTitle>
              <CardDescription>
                Guarde a tag abaixo: ela é o seu ingresso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 p-4 text-center sm:flex-row sm:text-left">
                <div className="rounded-lg border bg-background p-2">
                  <QRCodeSVG value={ticket.ticketHash} size={132} level="M" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tag do ingresso
                  </p>
                  <p className="break-all rounded bg-muted px-2 py-1 font-mono text-sm">
                    {ticket.ticketHash}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.name} · {ticket.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href="/perfil">
                    <User className="h-4 w-4" />
                    Ver meu perfil
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/eventos/${ticket.event.id}`}>Ver evento</Link>
                </Button>
              </div>
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
          <User className="mx-auto mb-4 h-16 w-16 text-blue-600" />
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Criar conta
          </h1>
          <p className="text-muted-foreground">
            Só e-mail, senha e data de nascimento são obrigatórios. O restante
            é opcional.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da conta</CardTitle>
            <CardDescription>
              Com a conta você acompanha seus próximos eventos e ingressos no
              perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cadastro-email">
                  E-mail <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cadastro-email"
                  type="email"
                  autoComplete="email"
                  placeholder="maria@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cadastro-password">
                    Senha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cadastro-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo de 8 caracteres"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cadastro-birth">
                    Data de nascimento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cadastro-birth"
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="rounded-md border border-dashed p-3">
                <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">
                  Opcionais
                </p>

                <div className="space-y-4">
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
                        onChange={(event) =>
                          setCpf(formatarCPF(event.target.value))
                        }
                        maxLength={14}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cadastro-event">Evento</Label>
                      <select
                        id="cadastro-event"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        value={eventId}
                        onChange={(event) => setEventId(event.target.value)}
                        disabled={loadingEvents}
                      >
                        <option value="">
                          {loadingEvents
                            ? "Carregando eventos..."
                            : "Nenhum (depois no evento)"}
                        </option>
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
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || loadingEvents}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:underline"
                >
                  Entrar
                </Link>
              </p>
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
