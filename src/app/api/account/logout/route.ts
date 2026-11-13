import { NextResponse } from "next/server";
import {
  ACCOUNT_SESSION_COOKIE,
  clearedAccountSessionCookieOptions,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    data: { loggedOut: true },
  });

  response.cookies.set(
    ACCOUNT_SESSION_COOKIE,
    "",
    clearedAccountSessionCookieOptions()
  );

  return response;
}
