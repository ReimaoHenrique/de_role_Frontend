import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { gatewayRequest } from "@/lib/gateway";
import { findUserEvent } from "@/lib/user-events";
import { getFeaturedEventBySlug } from "@/lib/events-data";
import type { Event } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;

  try {
    const result = await gatewayRequest<Event>(
      `/api/events/${encodeURIComponent(idOrSlug)}`
    );
    return successResponse(result.data, result.meta);
  } catch (error) {
    const userEvent = findUserEvent(idOrSlug);
    if (userEvent) {
      return successResponse(userEvent);
    }

    const featured = getFeaturedEventBySlug(idOrSlug);
    if (featured) {
      return successResponse(featured);
    }

    return errorResponse(error);
  }
}
