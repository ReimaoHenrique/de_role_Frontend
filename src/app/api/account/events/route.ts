import { NextRequest } from "next/server";
import { accountProxy } from "@/lib/account-proxy";
import type { Event } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return accountProxy<Event[]>(request, "/api/accounts/me/events");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return accountProxy<Event>(request, "/api/accounts/me/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
