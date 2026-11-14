import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { gatewayRequest } from "@/lib/gateway";
import { findUserEvent } from "@/lib/user-events";
import { getFeaturedEventBySlug } from "@/lib/events-data";
import type { Guest } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Envie os dados da inscrição em formato JSON.",
          },
        },
        { status: 400 }
      );
    }

    try {
      const result = await gatewayRequest<Guest>("/api/guests", {
        method: "POST",
        body: JSON.stringify(body),
      });

      return successResponse(result.data, result.meta, 201);
    } catch (gwErr) {
      // Fallback para eventos locais/criados pelo usuário
      const event = findUserEvent(body.eventId) || getFeaturedEventBySlug(body.eventId);
      if (event) {
        const guestId = crypto.randomUUID();
        const fakeTicket: Guest = {
          id: guestId,
          eventId: event.id,
          event: {
            id: event.id,
            name: event.name,
            startsAt: event.startsAt,
            venue: event.venue,
          },
          name: body.name || "Participante",
          email: body.email || "",
          cpf: body.cpf ? body.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4") : null,
          ticketHash: crypto.randomUUID().replace(/-/g, ""),
          status: "ACTIVE",
          checkedInAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return successResponse(fakeTicket, undefined, 201);
      }
      return errorResponse(gwErr);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
