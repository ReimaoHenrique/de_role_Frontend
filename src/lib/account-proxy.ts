import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { GatewayError, gatewayRequest } from "@/lib/gateway";
import {
  ACCOUNT_SESSION_COOKIE,
  clearedAccountSessionCookieOptions,
} from "@/lib/session";

function unauthorized(message: string): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: { code: "UNAUTHORIZED", message },
    },
    { status: 401 }
  );
  response.cookies.set(ACCOUNT_SESSION_COOKIE, "", clearedAccountSessionCookieOptions());
  return response;
}

/**
 * Proxy das rotas do participante: lê o JWT do cookie httpOnly e injeta o
 * header Authorization antes de chamar o gateway.
 */
export async function accountProxy<T>(
  request: NextRequest,
  path: string,
  init: RequestInit = {}
): Promise<NextResponse> {
  const token = request.cookies.get(ACCOUNT_SESSION_COOKIE)?.value;

  if (!token) {
    return unauthorized("Faça login para acessar seu perfil.");
  }

  try {
    const result = await gatewayRequest<T>(path, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`,
      },
    });

    return successResponse(
      result.data,
      result.meta,
      result.status === 201 ? 201 : 200
    );
  } catch (error) {
    if (error instanceof GatewayError && error.status === 401) {
      return unauthorized(error.message);
    }
    return errorResponse(error);
  }
}
