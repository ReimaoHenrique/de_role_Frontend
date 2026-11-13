import { NextRequest } from "next/server";
import { accountProxy } from "@/lib/account-proxy";
import type { Account } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return accountProxy<Account>(request, "/api/accounts/me");
}
