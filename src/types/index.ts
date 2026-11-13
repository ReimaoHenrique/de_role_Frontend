// Contratos canônicos expostos pelo API Gateway.

export type EventStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SOLD_OUT"
  | "FINISHED"
  | "CANCELLED";

export type GuestStatus = "ACTIVE" | "USED" | "CANCELLED";

export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  startsAt: string;
  venue: string;
  priceInCents: number;
  price: number;
  totalTickets: number;
  issuedTickets: number;
  availableTickets: number;
  status: EventStatus;
  termsOfUse: string;
  producerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Producer {
  id: string;
  name: string;
  email: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuestEventSummary {
  id: string;
  name: string;
  startsAt: string;
  venue: string;
}

export interface Guest {
  id: string;
  eventId: string;
  event: GuestEventSummary;
  name: string;
  email: string;
  /** Sempre mascarado pela API, por exemplo: "***.567.890-**". */
  cpf: string | null;
  /** Credencial do ingresso. Não deve ser exibida em páginas públicas de consulta. */
  ticketHash: string;
  status: GuestStatus;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiMeta {
  pagination?: Pagination;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorBody;

export interface Paginated<T> {
  data: T[];
  pagination: Pagination | null;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface AdminLoginResult {
  expiresAt: string;
  sessionId: string;
}

export interface AdminSession {
  authenticated: boolean;
  tokenId: string;
  expiresAt: string;
}

export interface GuestStats {
  total: number;
  active: number;
  used: number;
  cancelled: number;
}

export interface DashboardTotals {
  events: number;
  activeEvents: number;
  totalTickets: number;
  issuedTickets: number;
  availableTickets: number;
  revenueInCents: number;
  revenue: number;
  occupancyRate: number;
  guests: GuestStats;
}

export interface DashboardEvent extends Event {
  revenueInCents: number;
  revenue: number;
  occupancyRate: number;
}

export interface DashboardData {
  totals: DashboardTotals;
  events: DashboardEvent[];
}

export interface CreateGuestInput {
  eventId: string;
  name: string;
  email: string;
  cpf?: string;
}

// ---------------------------------------------------------------------------
// Conta do participante
// ---------------------------------------------------------------------------

export interface Account {
  id: string;
  email: string;
  name: string | null;
  cpf: string | null;
  birthDate: string | null;
  age: number | null;
  address: string | null;
  bankAccount: string | null;
  pixKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSession {
  account: Account;
  expiresAt: string;
}

export interface RegisterAccountInput {
  email: string;
  password: string;
  birthDate: string;
  name?: string | null;
  cpf?: string | null;
  address?: string | null;
  bankAccount?: string | null;
  pixKey?: string | null;
  eventId?: string | null;
}

export interface LoginAccountInput {
  email: string;
  password: string;
}

export interface RegisterAccountResult {
  account: Account;
  expiresAt: string;
  ticket: Guest | null;
  linkedTickets: number;
}

export interface LookupGuestInput {
  email?: string;
  cpf?: string;
  name?: string;
}

export interface ListEventsParams {
  page?: number;
  limit?: number;
  status?: EventStatus;
  search?: string;
}

export interface ListGuestsParams {
  page?: number;
  limit?: number;
  eventId?: string;
  status?: GuestStatus;
  search?: string;
}

export interface CreateEventInput {
  name: string;
  description: string;
  imageUrl?: string | null;
  startsAt: string;
  venue: string;
  priceInCents: number;
  totalTickets: number;
  termsOfUse: string;
  status?: EventStatus;
  producerId?: string | null;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface CreateProducerInput {
  name: string;
  email: string;
  description?: string | null;
}

export type UpdateProducerInput = Partial<CreateProducerInput>;

export interface ListProducersParams {
  page?: number;
  limit?: number;
  search?: string;
}
