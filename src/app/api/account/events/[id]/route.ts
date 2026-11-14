import { NextRequest } from "next/server";
import { accountProxy } from "@/lib/account-proxy";
import { successResponse } from "@/lib/api-response";
import { deleteUserEvent, updateUserEvent } from "@/lib/user-events";
import type { Event } from "@/types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    const proxyRes = await accountProxy<Event>(
      request,
      `/api/accounts/me/events/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (proxyRes.status !== 404) {
      return proxyRes;
    }
  } catch {
    // Continua para o fallback
  }

  const updated = updateUserEvent(id, body || {});
  return successResponse(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const proxyRes = await accountProxy<void>(
      request,
      `/api/accounts/me/events/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
    if (proxyRes.status !== 404) {
      return proxyRes;
    }
  } catch {
    // Continua para o fallback
  }

  deleteUserEvent(id);
  return successResponse({ deleted: true });
}
