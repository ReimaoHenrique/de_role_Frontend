"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Compass,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Tag,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAccountEvent } from "@/lib/api";
import { fromDateTimeInputValue, toDateTimeInputValue } from "@/lib/format";
import type { Event } from "@/types";

const SUGGESTED_TAGS = [
  "Festas",
  "Shows",
  "Música",
  "Cultura",
  "Gastronomia",
  "Eletrônica",
  "Samba/Pagode",
  "Trap/Funk",
  "Universitário",
  "Open Bar",
  "Ar Livre",
  "Acústico",
];

const PRESET_IMAGES = [
  {
    label: "Balada / Festa",
    url: "/events/boreal.jpg",
  },
  {
    label: "Show / Festival",
    url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Samba / Roda de Pagode",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Rooftop / Sunset",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Bar / Gastronomia",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
  },
];

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function CreateEventWizard() {
  // Etapa atual (1, 2 ou 3)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // -------------------------------------------------------------------------
  // PASSO 1: Descrever o evento (nome, descrição, data/horário, tags, imagem)
  // -------------------------------------------------------------------------
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Festas"]);

  // Inicializa data para amanhã às 22:00
  const [startsAt, setStartsAt] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(22, 0, 0, 0);
    return toDateTimeInputValue(tomorrow.toISOString());
  });

  const [imageUrl, setImageUrl] = useState("/events/boreal.jpg");

  // -------------------------------------------------------------------------
  // PASSO 2: Definir local com endereço e busca por CEP
  // -------------------------------------------------------------------------
  const [venueName, setVenueName] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("São Paulo");
  const [stateUf, setStateUf] = useState("SP");

  const [loadingCep, setLoadingCep] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // PASSO 3: Ingressos, valores e publicação
  // -------------------------------------------------------------------------
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState("30,00");
  const [totalTickets, setTotalTickets] = useState("200");
  const [termsOfUse, setTermsOfUse] = useState(
    "Entrada permitida mediante apresentação de documento oficial com foto. Proibida a entrada de menores desacompanhados."
  );

  // Estados de submissão
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

  // -------------------------------------------------------------------------
  // Busca automática de CEP via ViaCEP
  // -------------------------------------------------------------------------
  async function handleCepLookup(rawCep: string) {
    const clean = rawCep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setCepError("Informe um CEP com 8 dígitos.");
      return;
    }

    setLoadingCep(true);
    setCepError(null);
    setCepSuccess(false);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      if (!res.ok) throw new Error("Erro na consulta do CEP");
      const data: ViaCepResponse = await res.json();

      if (data.erro) {
        setCepError("CEP não encontrado. Você pode preencher o endereço manualmente abaixo.");
        return;
      }

      // Preenche os campos automaticamente e permite edição
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setStateUf(data.uf);

      setCepSuccess(true);
    } catch {
      setCepError("Não foi possível buscar o CEP automaticamente. Preencha os campos abaixo.");
    } finally {
      setLoadingCep(false);
    }
  }

  function handleCepChange(value: string) {
    // Aplica máscara 00000-000
    const digits = value.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 5) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    setCep(formatted);

    // Se preencheu 8 dígitos, busca automaticamente
    if (digits.length === 8) {
      handleCepLookup(digits);
    } else {
      setCepSuccess(false);
      setCepError(null);
    }
  }

  // Toggle de tags
  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      }
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  // Montagem do endereço completo do venue
  function buildFullVenue(): string {
    const parts: string[] = [];
    if (venueName.trim()) {
      parts.push(venueName.trim());
    }
    const addressParts: string[] = [];
    if (street.trim()) {
      let streetLine = street.trim();
      if (number.trim()) streetLine += `, ${number.trim()}`;
      if (complement.trim()) streetLine += ` (${complement.trim()})`;
      addressParts.push(streetLine);
    }
    if (neighborhood.trim()) addressParts.push(neighborhood.trim());
    if (city.trim() && stateUf.trim()) {
      addressParts.push(`${city.trim()} - ${stateUf.trim()}`);
    } else if (city.trim()) {
      addressParts.push(city.trim());
    }

    if (addressParts.length > 0) {
      const addressString = addressParts.join(", ");
      return parts.length > 0 ? `${parts[0]} · ${addressString}` : addressString;
    }

    return venueName.trim() || "Local a definir";
  }

  // Validação do Passo 1
  function handleNextStep1() {
    setError(null);
    if (!name.trim()) {
      setError("Informe o nome do evento.");
      return;
    }
    if (name.trim().length < 3) {
      setError("O nome do evento deve ter pelo menos 3 caracteres.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError("A descrição do evento deve ter no mínimo 10 caracteres.");
      return;
    }
    if (!startsAt) {
      setError("Informe a data e o horário de início do evento.");
      return;
    }
    setStep(2);
  }

  // Validação do Passo 2
  function handleNextStep2() {
    setError(null);
    if (!venueName.trim() && !street.trim()) {
      setError("Informe o nome do local ou a rua do evento.");
      return;
    }
    setStep(3);
  }

  // Submissão Final do Evento
  async function handleFinalSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      const priceClean = isFree ? 0 : Number(price.replace(",", "."));
      const priceInCents = Math.round((Number.isFinite(priceClean) ? priceClean : 0) * 100);
      const ticketsClean = parseInt(totalTickets, 10);

      if (!ticketsClean || ticketsClean <= 0) {
        throw new Error("A quantidade de ingressos deve ser de pelo menos 1.");
      }

      const fullVenue = buildFullVenue();
      const mainCategory = selectedTags[0] || "Festas";

      const created = await createAccountEvent({
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || null,
        startsAt: fromDateTimeInputValue(startsAt),
        venue: fullVenue,
        priceInCents,
        totalTickets: ticketsClean,
        termsOfUse: termsOfUse.trim(),
        status: "ACTIVE",
        category: mainCategory,
      });

      // Salva também no localStorage para redundância e disponibilidade imediata no navegador
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`de_role_event_${created.slug}`, JSON.stringify(created));
          localStorage.setItem(`de_role_event_${created.id}`, JSON.stringify(created));
          const savedList = JSON.parse(localStorage.getItem("de_role_user_events") || "[]");
          localStorage.setItem(
            "de_role_user_events",
            JSON.stringify([created, ...savedList.filter((e: Event) => e.slug !== created.slug)])
          );
        } catch {
          // ignore
        }
      }

      setCreatedEvent(created);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível criar o evento. Verifique os dados e tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // TELA DE SUCESSO APÓS CRIAÇÃO
  // -------------------------------------------------------------------------
  if (createdEvent) {
    return (
      <div className="mx-auto max-w-xl py-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-4 shadow-sm">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <Badge variant="outline" className="mb-2 border-emerald-500/40 text-emerald-600">
          Rolê publicado com sucesso!
        </Badge>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          {createdEvent.name}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu evento já está disponível para emissão de ingressos e visível no mapa de rolês!
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href={`/eventos/${createdEvent.slug}`}>
              <span>Ver página do rolê</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Compass className="h-4 w-4 mr-2" />
              Explorar no mapa
            </Link>
          </Button>

          <Button asChild variant="ghost" size="lg">
            <Link href="/perfil">Ir para meu perfil</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* BARRA DE PROGRESSO EM 3 PASSOS */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span className={step >= 1 ? "text-primary" : ""}>1. Descrever Rolê</span>
          <span className={step >= 2 ? "text-primary" : ""}>2. Local & Endereço</span>
          <span className={step >= 3 ? "text-primary" : ""}>3. Ingressos & Publicar</span>
        </div>

        {/* Linha visual de progresso */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`h-2 rounded-full transition-colors ${
              step >= 1 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-2 rounded-full transition-colors ${
              step >= 2 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-2 rounded-full transition-colors ${
              step >= 3 ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>
      </div>

      {/* Banner de erro geral */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* PASSO 1: Descrever o evento */}
      {/* ----------------------------------------------------------------- */}
      {step === 1 && (
        <Card className="border border-border/80 shadow-sm animate-in fade-in-50">
          <CardContent className="space-y-5 p-5 sm:p-7">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-xl font-extrabold text-foreground sm:text-2xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Descrever o Rolê
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
                Defina o nome, estilo, data e horário em que seu evento vai acontecer.
              </p>
            </div>

            {/* Nome do evento */}
            <div className="space-y-1.5">
              <Label htmlFor="event-name" className="text-sm font-bold">
                Nome do Evento *
              </Label>
              <Input
                id="event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Festa Universitária na Augusta, Pagode da Praça..."
                className="text-base font-medium"
                required
              />
            </div>

            {/* Tags e Categoria */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-primary" />
                  Categoria & Tags *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Selecione as que combinam
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((t) => {
                  const active = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                          : "bg-muted/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {active && <Check className="h-3 w-3 inline mr-1" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data e Horário */}
            <div className="space-y-1.5">
              <Label htmlFor="event-starts-at" className="text-sm font-bold flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                Data e Horário de Início *
              </Label>
              <Input
                id="event-starts-at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="font-medium"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Horário oficial de Brasília. Expressões como &quot;Hoje&quot;, &quot;Amanhã&quot; e &quot;Sábado&quot; serão calculadas automaticamente.
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="event-description" className="text-sm font-bold">
                  Descrição do Evento *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {description.length} caracteres
                </span>
              </div>
              <textarea
                id="event-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Conte sobre o clima do rolê, atrações especiais, DJs convidados, promoções de bar..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>

            {/* Imagem de Capa */}
            <div className="space-y-2">
              <Label htmlFor="event-image-url" className="text-sm font-bold flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-primary" />
                Imagem de Capa (URL ou sugestões)
              </Label>
              <Input
                id="event-image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.jpg"
              />

              {/* Sugestões rápidas de fotos */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground self-center mr-1">
                  Fotos prontas:
                </span>
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition ${
                      imageUrl === img.url
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border bg-card text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão Avançar */}
            <div className="pt-3">
              <Button
                type="button"
                onClick={handleNextStep1}
                className="w-full gap-2 font-bold"
                size="lg"
              >
                <span>Avançar para Local & Endereço</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* PASSO 2: Definir o local com endereço e busca por CEP */}
      {/* ----------------------------------------------------------------- */}
      {step === 2 && (
        <Card className="border border-border/80 shadow-sm animate-in fade-in-50">
          <CardContent className="space-y-5 p-5 sm:p-7">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-xl font-extrabold text-foreground sm:text-2xl flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Definir Local & Endereço
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
                Digite o CEP para buscar o endereço automaticamente e edite os campos como quiser.
              </p>
            </div>

            {/* Nome do Local / Venue */}
            <div className="space-y-1.5">
              <Label htmlFor="venue-name" className="text-sm font-bold">
                Nome do Estabelecimento / Espaço *
              </Label>
              <Input
                id="venue-name"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Ex: Club Inbox, Praça Benedito Calixto, Espaço Unimed..."
                className="text-base font-medium"
              />
            </div>

            {/* Campo de CEP com busca automática */}
            <div className="space-y-1.5">
              <Label htmlFor="cep" className="text-sm font-bold flex items-center justify-between">
                <span>CEP do Local *</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  Busca automática via ViaCEP
                </span>
              </Label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="font-mono text-base font-semibold pl-9"
                  />
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCepLookup(cep)}
                  disabled={loadingCep || cep.replace(/\D/g, "").length !== 8}
                >
                  {loadingCep ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Buscar"
                  )}
                </Button>
              </div>

              {cepSuccess && (
                <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Endereço localizado! Você pode editar qualquer campo abaixo.
                </p>
              )}
              {cepError && (
                <p className="text-xs text-destructive">{cepError}</p>
              )}
            </div>

            {/* Campos de Endereço (Totalmente Editáveis) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Logradouro / Rua */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="street" className="text-xs font-bold">
                  Rua / Avenida *
                </Label>
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Ex: Rua Augusta"
                />
              </div>

              {/* Número */}
              <div className="space-y-1.5">
                <Label htmlFor="number" className="text-xs font-bold">
                  Número
                </Label>
                <Input
                  id="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ex: 1283"
                />
              </div>

              {/* Complemento */}
              <div className="space-y-1.5">
                <Label htmlFor="complement" className="text-xs font-bold">
                  Complemento
                </Label>
                <Input
                  id="complement"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Ex: Galpão 3, Sala 12"
                />
              </div>

              {/* Bairro */}
              <div className="space-y-1.5">
                <Label htmlFor="neighborhood" className="text-xs font-bold">
                  Bairro
                </Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Consolação"
                />
              </div>

              {/* Cidade / UF */}
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-bold">
                  Cidade / UF
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="flex-1"
                  />
                  <Input
                    id="stateUf"
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                    className="w-16 uppercase text-center"
                  />
                </div>
              </div>
            </div>

            {/* Prévia do Endereço Formatado */}
            <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Prévia do local nos ingressos e no mapa:
              </span>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>{buildFullVenue()}</span>
              </p>
            </div>

            {/* Botões de Navegação */}
            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>

              <Button
                type="button"
                onClick={handleNextStep2}
                className="flex-1 gap-2 font-bold"
                size="lg"
              >
                <span>Avançar para Ingressos</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* PASSO 3: Ingressos, Valores e Publicação */}
      {/* ----------------------------------------------------------------- */}
      {step === 3 && (
        <Card className="border border-border/80 shadow-sm animate-in fade-in-50">
          <CardContent className="space-y-5 p-5 sm:p-7">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-xl font-extrabold text-foreground sm:text-2xl flex items-center gap-2">
                <Ticket className="h-5 w-5 text-emerald-600" />
                Ingressos, Valores & Publicação
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
                Defina o valor por pessoa, quantidade disponível e regras de entrada.
              </p>
            </div>

            {/* Seletor Gratuito vs Pago */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Tipo de Entrada *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                    !isFree
                      ? "border-primary bg-primary/5 ring-2 ring-primary/40 font-bold"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span className="text-lg">💰</span>
                  <span className="text-sm font-bold text-foreground mt-1">
                    Ingresso Pago
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Cobrado por pessoa
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFree(true)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                    isFree
                      ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40 font-bold"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span className="text-lg">🎟️</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    Entrada Gratuita
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Sem custo para o público
                  </span>
                </button>
              </div>
            </div>

            {/* Valor do Ingresso (se pago) e Quantidade Total */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!isFree && (
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-sm font-bold">
                    Preço por Pessoa (R$) *
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="30,00"
                      className="pl-10 font-bold text-base"
                    />
                  </div>
                </div>
              )}

              <div className={`space-y-1.5 ${isFree ? "sm:col-span-2" : ""}`}>
                <Label htmlFor="total-tickets" className="text-sm font-bold">
                  Quantidade Total de Ingressos *
                </Label>
                <Input
                  id="total-tickets"
                  type="number"
                  min="1"
                  max="100000"
                  value={totalTickets}
                  onChange={(e) => setTotalTickets(e.target.value)}
                  placeholder="200"
                  className="font-bold text-base"
                />
              </div>
            </div>

            {/* Termos de Uso e Regras */}
            <div className="space-y-1.5">
              <Label htmlFor="terms-of-use" className="text-sm font-bold">
                Regras de Entrada & Termos de Uso
              </Label>
              <textarea
                id="terms-of-use"
                rows={3}
                value={termsOfUse}
                onChange={(e) => setTermsOfUse(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Card de Resumo do Rolê antes de publicar */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary block">
                Resumo do seu Rolê:
              </span>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-foreground">{name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedTags[0]} · {buildFullVenue()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-foreground">
                    {isFree ? "Gratuito" : `R$ ${price}`}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {totalTickets} vagas
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="gap-2"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>

              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 gap-2 font-extrabold bg-primary text-primary-foreground shadow-md hover:opacity-90"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Publicando Rolê...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Publicar Rolê Agora</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
