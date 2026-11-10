import type {
  AdminLoginResult,
  AdminSession,
  ApiMeta,
  CreateEventInput,
  CreateGuestInput,
  DashboardData,
  Event,
  Guest,
  GuestStats,
  ListEventsParams,
  ListGuestsParams,
  LookupGuestInput,
  Paginated,
  UpdateEventInput,
} from "@/types";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toQuery(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function apiRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<{ data: T; meta?: ApiMeta }> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "same-origin",
      cache: "no-store",
      signal: options.signal,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      0
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok || !isRecord(payload) || payload.success !== true) {
    const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
    throw new ApiError(
      typeof error?.code === "string" ? error.code : "UNKNOWN_ERROR",
      typeof error?.message === "string"
        ? error.message
        : "Não foi possível concluir a solicitação.",
      response.status,
      error?.details
    );
  }

  return {
    data: payload.data as T,
    meta: isRecord(payload.meta) ? (payload.meta as ApiMeta) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Público
// ---------------------------------------------------------------------------

export async function listEvents(
  params: ListEventsParams = {}
): Promise<Paginated<Event>> {
  const query = toQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
    search: params.search,
  });
  const result = await apiRequest<Event[]>(`/api/events${query}`);
  return {
    data: result.data,
    pagination: result.meta?.pagination ?? null,
  };
}

export async function getEvent(idOrSlug: string): Promise<Event> {
  const result = await apiRequest<Event>(
    `/api/events/${encodeURIComponent(idOrSlug)}`
  );
  return result.data;
}

export async function createGuest(input: CreateGuestInput): Promise<Guest> {
  const result = await apiRequest<Guest>("/api/guests", {
    method: "POST",
    body: input,
  });
  return result.data;
}

export async function lookupGuest(input: LookupGuestInput): Promise<Guest> {
  const result = await apiRequest<Guest>("/api/guests/lookup", {
    method: "POST",
    body: input,
  });
  return result.data;
}

// ---------------------------------------------------------------------------
// Admin (JWT em cookie httpOnly, injetado pelas route handlers)
// ---------------------------------------------------------------------------

export async function adminLogin(hash: string): Promise<AdminLoginResult> {
  const result = await apiRequest<AdminLoginResult>("/api/admin/login", {
    method: "POST",
    body: { hash },
  });
  return result.data;
}

export async function adminLogout(): Promise<void> {
  await apiRequest<{ loggedOut: boolean }>("/api/admin/logout", {
    method: "POST",
  });
}

export async function adminMe(): Promise<AdminSession> {
  const result = await apiRequest<AdminSession>("/api/admin/me");
  return result.data;
}

export async function adminDashboard(): Promise<DashboardData> {
  const result = await apiRequest<DashboardData>("/api/admin/dashboard");
  return result.data;
}

export async function listAdminEvents(
  params: ListEventsParams = {}
): Promise<Paginated<Event>> {
  const query = toQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
    search: params.search,
  });
  const result = await apiRequest<Event[]>(`/api/admin/events${query}`);
  return {
    data: result.data,
    pagination: result.meta?.pagination ?? null,
  };
}

export async function getAdminEvent(id: string): Promise<Event> {
  const result = await apiRequest<Event>(
    `/api/admin/events/${encodeURIComponent(id)}`
  );
  return result.data;
}

export async function createAdminEvent(input: CreateEventInput): Promise<Event> {
  const result = await apiRequest<Event>("/api/admin/events", {
    method: "POST",
    body: input,
  });
  return result.data;
}

export async function updateAdminEvent(
  id: string,
  input: UpdateEventInput
): Promise<Event> {
  const result = await apiRequest<Event>(
    `/api/admin/events/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input }
  );
  return result.data;
}

export async function cancelAdminEvent(id: string): Promise<Event> {
  const result = await apiRequest<Event>(
    `/api/admin/events/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  return result.data;
}

export async function listAdminGuests(
  params: ListGuestsParams = {}
): Promise<Paginated<Guest>> {
  const query = toQuery({
    page: params.page,
    limit: params.limit,
    eventId: params.eventId,
    status: params.status,
    search: params.search,
  });
  const result = await apiRequest<Guest[]>(`/api/admin/guests${query}`);
  return {
    data: result.data,
    pagination: result.meta?.pagination ?? null,
  };
}

export async function adminGuestStats(eventId?: string): Promise<GuestStats> {
  const query = toQuery({ eventId });
  const result = await apiRequest<GuestStats>(`/api/admin/guests/stats${query}`);
  return result.data;
}

export async function checkInGuest(id: string): Promise<Guest> {
  const result = await apiRequest<Guest>(
    `/api/admin/guests/${encodeURIComponent(id)}/check-in`,
    { method: "POST" }
  );
  return result.data;
}

export async function cancelGuest(id: string): Promise<Guest> {
  const result = await apiRequest<Guest>(
    `/api/admin/guests/${encodeURIComponent(id)}/cancel`,
    { method: "POST" }
  );
  return result.data;
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

/** Converte a senha digitada para o hash SHA-256 exigido pelo backend. */
export async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new ApiError(
      "CRYPTO_UNAVAILABLE",
      "Seu navegador não oferece suporte ao cálculo seguro de senha.",
      0
    );
  }

  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}


