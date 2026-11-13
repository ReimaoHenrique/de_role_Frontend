import type {
  Account,
  AccountSession,
  AdminLoginResult,
  AdminSession,
  ApiMeta,
  CreateEventInput,
  CreateGuestInput,
  CreateProducerInput,
  DashboardData,
  Event,
  Guest,
  GuestStats,
  ListEventsParams,
  ListGuestsParams,
  ListProducersParams,
  LoginAccountInput,
  LookupGuestInput,
  Paginated,
  Producer,
  RegisterAccountInput,
  RegisterAccountResult,
  UpdateEventInput,
  UpdateProducerInput,
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

export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const hash = await sha256Hex(`${normalizedEmail}:${password}`);

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

export async function listAdminProducers(
  params: ListProducersParams = {}
): Promise<Paginated<Producer>> {
  const query = toQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
  });
  const result = await apiRequest<Producer[]>(`/api/admin/producers${query}`);
  return {
    data: result.data,
    pagination: result.meta?.pagination ?? null,
  };
}

export async function createAdminProducer(
  input: CreateProducerInput
): Promise<Producer> {
  const result = await apiRequest<Producer>("/api/admin/producers", {
    method: "POST",
    body: input,
  });
  return result.data;
}

export async function updateAdminProducer(
  id: string,
  input: UpdateProducerInput
): Promise<Producer> {
  const result = await apiRequest<Producer>(
    `/api/admin/producers/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input }
  );
  return result.data;
}

// ---------------------------------------------------------------------------
// Conta do participante
// ---------------------------------------------------------------------------

export async function registerAccount(
  input: RegisterAccountInput
): Promise<RegisterAccountResult> {
  const result = await apiRequest<RegisterAccountResult>(
    "/api/account/register",
    { method: "POST", body: input }
  );
  return result.data;
}

export async function loginAccount(
  input: LoginAccountInput
): Promise<AccountSession> {
  const result = await apiRequest<AccountSession>("/api/account/login", {
    method: "POST",
    body: input,
  });
  return result.data;
}

export async function logoutAccount(): Promise<void> {
  await apiRequest<{ loggedOut: boolean }>("/api/account/logout", {
    method: "POST",
  });
}

export async function accountMe(): Promise<Account> {
  const result = await apiRequest<Account>("/api/account/me");
  return result.data;
}

export async function accountGuests(): Promise<Guest[]> {
  const result = await apiRequest<Guest[]>("/api/account/guests");
  return result.data;
}

export async function updateAccount(data: {
  name?: string;
  cpf?: string;
  address?: string;
  pixKey?: string;
}): Promise<Account> {
  const result = await apiRequest<Account>("/api/account/me", {
    method: "PATCH",
    body: data,
  });
  return result.data;
}

export async function accountEvents(): Promise<Event[]> {
  const result = await apiRequest<Event[]>("/api/account/events");
  return result.data;
}

export async function createAccountEvent(
  input: CreateEventInput
): Promise<Event> {
  const result = await apiRequest<Event>("/api/account/events", {
    method: "POST",
    body: input,
  });
  return result.data;
}

export async function updateAccountEvent(
  id: string,
  input: UpdateEventInput
): Promise<Event> {
  const result = await apiRequest<Event>(
    `/api/account/events/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: input,
    }
  );
  return result.data;
}

export async function cancelAccountEvent(id: string): Promise<void> {
  await apiRequest<void>(`/api/account/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// SHA-256
// ---------------------------------------------------------------------------

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const SHA256_H0 = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

function rotr(value: number, amount: number): number {
  return ((value >>> amount) | (value << (32 - amount))) >>> 0;
}

/** SHA-256 em JS puro (fallback quando o WebCrypto não está disponível). */
function sha256Fallback(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const bitLength = bytes.length * 8;
  const padded: number[] = [];
  for (const byte of bytes) padded.push(byte);
  padded.push(0x80);
  while (padded.length % 64 !== 56) padded.push(0);

  const lengthHigh = Math.floor(bitLength / 4294967296);
  const lengthLow = bitLength - lengthHigh * 4294967296;
  for (let i = 3; i >= 0; i--) padded.push((lengthHigh >>> (8 * i)) & 0xff);
  for (let i = 3; i >= 0; i--) padded.push((lengthLow >>> (8 * i)) & 0xff);

  const hash = [...SHA256_H0];
  const w = new Array<number>(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      const base = offset + i * 4;
      w[i] =
        ((padded[base] << 24) | (padded[base + 1] << 16) | (padded[base + 2] << 8) | padded[base + 3]) >>>
        0;
    }

    for (let i = 16; i < 64; i++) {
      const s0 = (rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
      const s1 = (rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return hash.map((value) => value.toString(16).padStart(8, "0")).join("");
}

/** Converte a credencial (e-mail + senha) digitada em hash SHA-256 para o backend. */
export async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback puro JS: mantém o login funcionando em contextos sem WebCrypto
  // (por exemplo, HTTP fora de localhost ou navegadores sem suporte ao SubtleCrypto).
  return sha256Fallback(value);
}


