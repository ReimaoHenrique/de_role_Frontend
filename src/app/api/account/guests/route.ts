import { NextRequest } from "next/server";
import { accountProxy } from "@/lib/account-proxy";
import type { Guest } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return accountProxy<Guest[]>(request, "/api/accounts/me/guests");
}
