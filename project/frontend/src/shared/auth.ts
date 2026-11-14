const STORAGE = {
  appAccess: "fadeup-app-access",
  appRefresh: "fadeup-app-refresh",
  userAccess: "fadeup-user-access",
  userRefresh: "fadeup-user-refresh",
  userId: "fadeup-user-id",
};

const BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");
const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID ?? "";
const CLIENT_SECRET = import.meta.env.VITE_APP_CLIENT_SECRET ?? "";

function read(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignora
  }
}

function remove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignora
  }
}

export const tokens = {
  get appAccess() {
    return read(STORAGE.appAccess);
  },
  get userAccess() {
    return read(STORAGE.userAccess);
  },
  get userId() {
    return read(STORAGE.userId);
  },
  get isUserAuthenticated() {
    return Boolean(read(STORAGE.userAccess));
  },
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE}/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`auth ${path} falhou (${response.status})`);
  return (await response.json()) as T;
}

interface AppTokens {
  access_token: string;
  refresh_token: string;
}
interface UserTokens extends AppTokens {
  userId: number;
}

export async function authenticateApp(): Promise<void> {
  const data = await post<AppTokens>("auth/app-token", {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  write(STORAGE.appAccess, data.access_token);
  write(STORAGE.appRefresh, data.refresh_token);
}

export async function refreshApp(): Promise<boolean> {
  const refresh = read(STORAGE.appRefresh);
  try {
    const data = refresh
      ? await post<AppTokens>("auth/app-refresh", { refresh_token: refresh })
      : null;
    if (data) {
      write(STORAGE.appAccess, data.access_token);
      write(STORAGE.appRefresh, data.refresh_token);
      return true;
    }
  } catch {
    // cai para re-autenticar
  }
  try {
    await authenticateApp();
    return true;
  } catch {
    return false;
  }
}

export async function loginUser(email: string, password: string): Promise<number> {
  const data = await post<UserTokens>("auth/login", { email, password });
  write(STORAGE.userAccess, data.access_token);
  write(STORAGE.userRefresh, data.refresh_token);
  write(STORAGE.userId, String(data.userId));
  return data.userId;
}

export async function refreshUser(): Promise<boolean> {
  const refresh = read(STORAGE.userRefresh);
  if (!refresh) return false;
  try {
    const data = await post<UserTokens>("auth/refresh", { refresh_token: refresh });
    write(STORAGE.userAccess, data.access_token);
    write(STORAGE.userRefresh, data.refresh_token);
    write(STORAGE.userId, String(data.userId));
    return true;
  } catch {
    logoutUser();
    return false;
  }
}

export function logoutUser(): void {
  remove(STORAGE.userAccess);
  remove(STORAGE.userRefresh);
  remove(STORAGE.userId);
}
