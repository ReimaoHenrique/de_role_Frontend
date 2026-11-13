import { NextRequest, NextResponse } from "next/server";
import { adminProxy } from "@/lib/admin-proxy";
import type { Producer } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Envie os dados do produtor em formato JSON.",
        },
      },
      { status: 400 }
    );
  }

  return adminProxy<Producer>(
    request,
    `/api/admin/producers/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
}
