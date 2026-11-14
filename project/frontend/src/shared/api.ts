import { refreshApp, refreshUser, tokens } from "@/shared/auth";

export class ApiError extends Error {
  status?: number;
  fields?: Record<string, string>;

  constructor(message: string, status?: number, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

const BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");

export interface ApiOptions extends RequestInit {
  bookingToken?: string;
}

function buildHeaders(path: string, extra?: HeadersInit, bookingToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra as Record<string, string>),
  };
  const isAdmin = path.startsWith("admin/");
  if (isAdmin) {
    if (tokens.userAccess) headers["Authorization"] = `Bearer ${tokens.userAccess}`;
    if (tokens.appAccess) headers["X-App-Token"] = tokens.appAccess;
  } else if (tokens.appAccess) {
    headers["Authorization"] = `Bearer ${tokens.appAccess}`;
  }
  if (bookingToken) headers["X-Booking-Token"] = bookingToken;
  return headers;
}

async function doFetch(path: string, options: ApiOptions): Promise<Response> {
  const { bookingToken, headers, ...rest } = options;
  return fetch(`${BASE}/api/${path}`, {
    ...rest,
    headers: buildHeaders(path, headers, bookingToken),
  });
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await doFetch(path, options);
  } catch {
    throw new ApiError("Sem conexão com a agenda. Verifique sua conexão e tente novamente.");
  }

  // 401: tenta renovar o token adequado e repete uma vez.
  if (response.status === 401) {
    const isAdmin = path.startsWith("admin/");
    const renewed = isAdmin ? await refreshUser() : await refreshApp();
    // rota admin também pode falhar por app token expirado
    if (isAdmin && renewed === false) await refreshApp();
    if (renewed) {
      try {
        response = await doFetch(path, options);
      } catch {
        throw new ApiError("Sem conexão com a agenda. Verifique sua conexão e tente novamente.");
      }
    }
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("A agenda não respondeu como esperado. Tente novamente.");
  }

  if (!response.ok) {
    const body = data as { error?: string; fields?: Record<string, string> };
    throw new ApiError(body.error || "Não foi possível concluir.", response.status, body.fields);
  }
  return data as T;
}
