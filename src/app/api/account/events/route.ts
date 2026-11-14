import { NextRequest } from "next/server";
import { accountProxy } from "@/lib/account-proxy";
import { successResponse } from "@/lib/api-response";
import { listUserEvents, saveUserEvent } from "@/lib/user-events";
import type { Event } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const proxyRes = await accountProxy<Event[]>(request, "/api/accounts/me/events");
    // Se o backend gateway tiver a rota implementada, retorna normalmente
    if (proxyRes.status !== 404) {
      return proxyRes;
    }
  } catch {
    // Gateway falhou ou rota não encontrada
  }

  // Fallback: retorna eventos criados pelo usuário
  return successResponse(listUserEvents());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "BAD_REQUEST", message: "Corpo da requisição inválido." },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const proxyRes = await accountProxy<Event>(request, "/api/accounts/me/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Se o gateway não retornou 404, repassa a resposta do gateway
    if (proxyRes.status !== 404) {
      return proxyRes;
    }
  } catch {
    // Continua para o fallback
  }

  // Fallback transparente: salva o evento e retorna sucesso 201
  const created = saveUserEvent(body);
  return successResponse(created, undefined, 201);
}
