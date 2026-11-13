export const ADMIN_SESSION_COOKIE = "dr_admin_session";
export const ACCOUNT_SESSION_COOKIE = "dr_session";

const DEFAULT_MAX_AGE = 8 * 60 * 60; // 8 horas

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * O JWT fica em cookie httpOnly: nenhum JavaScript do browser consegue lê-lo.
 */
export function adminSessionCookieOptions(expiresAt?: string) {
  const parsed = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const maxAge = Number.isFinite(parsed)
    ? Math.max(0, Math.floor((parsed - Date.now()) / 1000))
    : DEFAULT_MAX_AGE;

  return sessionCookieOptions(maxAge);
}

export function clearedAdminSessionCookieOptions() {
  return sessionCookieOptions(0);
}

/** Sessão do participante (cadastro/login/perfil). */
export function accountSessionCookieOptions(expiresAt?: string) {
  const parsed = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const maxAge = Number.isFinite(parsed)
    ? Math.max(0, Math.floor((parsed - Date.now()) / 1000))
    : DEFAULT_MAX_AGE;

  return sessionCookieOptions(maxAge);
}

export function clearedAccountSessionCookieOptions() {
  return sessionCookieOptions(0);
}
