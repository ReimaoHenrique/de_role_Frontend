import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateEventWizard } from "@/components/events/create-event-wizard";

export const metadata = {
  title: "Criar Novo Rolê - De Rolê",
  description: "Crie e publique seu evento em 3 passos simples com busca automática por CEP.",
};

export default function CriarEventoPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Botão de retorno */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href="/perfil">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o perfil</span>
          </Link>
        </Button>
      </div>

      {/* Cabeçalho */}
      <div className="mb-8 text-center sm:text-left">
        <Badge variant="secondary" className="mb-2">
          <Sparkles className="h-3 w-3 mr-1 text-primary" />
          Área do Produtor / Criador
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Criar Novo Rolê
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Preencha os detalhes do evento em 3 etapas para publicá-lo na plataforma e no mapa GPS.
        </p>
      </div>

      {/* Assistente em 3 passos */}
      <CreateEventWizard />
    </div>
  );
}
