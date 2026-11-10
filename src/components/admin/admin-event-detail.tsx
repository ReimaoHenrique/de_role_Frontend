"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminLogin } from "@/components/admin/admin-login";
import { EventDetails } from "@/components/admin/event-details";
import { Button } from "@/components/ui/button";
import { InlineError, PanelLoading } from "@/components/admin/admin-ui";
import { ApiError, adminMe, getAdminEvent } from "@/lib/api";
import type { Event } from "@/types";

interface AdminEventDetailProps {
  id: string;
}

type AuthState = "checking" | "anonymous" | "authenticated";

export function AdminEventDetail({ id }: AdminEventDetailProps) {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [notice, setNotice] = useState<string | undefined>();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    adminMe()
      .then(() => {
        if (active) setAuthState("authenticated");
      })
      .catch(() => {
        if (active) setAuthState("anonymous");
      });

    return () => {
      active = false;
    };
  }, []);

  const loadEvent = useCallback(async (eventId: string) => {
    setLoadingEvent(true);
    setEventError(null);

    try {
      const data = await getAdminEvent(eventId);
      setEvent(data);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setAuthState("anonymous");
        setNotice("Sua sessão expirou. Faça login novamente.");
        return;
      }
      setEventError(
        caught instanceof ApiError
          ? caught.message
          : "Não foi possível carregar os detalhes do evento.",
      );
    } finally {
      setLoadingEvent(false);
    }
  }, []);

  useEffect(() => {
    if (authState === "authenticated" && id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- busca do evento após autenticação
      void loadEvent(id);
    }
  }, [authState, id, loadEvent]);

  if (authState === "checking") {
    return (
      <div className="container mx-auto px-4 py-8">
        <PanelLoading label="Verificando sessão..." />
      </div>
    );
  }

  if (authState === "anonymous") {
    return (
      <div className="container mx-auto px-4 py-8">
        <AdminLogin
          onSuccess={() => {
            setNotice(undefined);
            setAuthState("authenticated");
          }}
          notice={notice}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {eventError ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <InlineError message={eventError} />
          <Button variant="outline" onClick={() => void loadEvent(id)}>
            Tentar novamente
          </Button>
        </div>
      ) : loadingEvent ? (
        <PanelLoading label="Carregando evento..." />
      ) : event ? (
        <EventDetails event={event} />
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          <InlineError message="Evento não encontrado." />
          <Button asChild variant="outline">
            <Link href="/admin">Voltar ao painel administrativo</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
