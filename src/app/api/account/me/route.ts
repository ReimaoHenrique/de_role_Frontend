import { NextRequest } from "next/server";
import { accountProxy } from "@/lib/account-proxy";
import type { Account } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return accountProxy<Account>(request, "/api/accounts/me");
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return accountProxy<Account>(request, "/api/accounts/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
