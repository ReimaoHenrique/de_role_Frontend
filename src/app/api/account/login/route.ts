import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { gatewayRequest } from "@/lib/gateway";
import {
  ACCOUNT_SESSION_COOKIE,
  accountSessionCookieOptions,
} from "@/lib/session";
import type { Account } from "@/types";

export const dynamic = "force-dynamic";

interface LoginResponse {
  account: Account;
  token: string;
  expiresAt: string;
  linkedTickets: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Envie e-mail e senha em formato JSON.",
          },
        },
        { status: 400 }
      );
    }

    const result = await gatewayRequest<LoginResponse>(
      "/api/accounts/login",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    const { account, token, expiresAt, linkedTickets } = result.data;
    const response = NextResponse.json({
      success: true,
      data: { account, linkedTickets },
    });

    response.cookies.set(
      ACCOUNT_SESSION_COOKIE,
      token,
      accountSessionCookieOptions(expiresAt)
    );

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
