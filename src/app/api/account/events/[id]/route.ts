import { NextRequest } from "next/server";
import { accountProxy } from "@/lib/account-proxy";
import type { Event } from "@/types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  return accountProxy<Event>(request, `/api/accounts/me/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return accountProxy<void>(request, `/api/accounts/me/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
