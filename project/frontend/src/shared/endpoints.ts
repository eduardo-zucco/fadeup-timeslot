import { api } from "@/shared/api";
import type {
  AgendaResponse,
  Booking,
  Config,
  CustomerDraft,
  SlotsResponse,
} from "@/shared/types";

export const getConfig = () => api<Config>("config");

export const getSlots = (date: string, service: string) =>
  api<SlotsResponse>(`slots?date=${date}&service=${encodeURIComponent(service)}`);

export const createBooking = (
  body: CustomerDraft & { service: string; date: string; start: number },
) => api<Booking>("bookings", { method: "POST", body: JSON.stringify(body) });

export const getBooking = (id: string, token: string) =>
  api<Booking>(`bookings/${id}`, { bookingToken: token });

export const getBookingSlots = (id: string, date: string, token: string) =>
  api<SlotsResponse>(`bookings/${id}/slots?date=${date}`, { bookingToken: token });

export const moveBooking = (id: string, token: string, date: string, start: number) =>
  api<{ ok: boolean }>(`bookings/${id}`, {
    method: "PATCH",
    bookingToken: token,
    body: JSON.stringify({ date, start }),
  });

export const cancelBooking = (id: string, token: string) =>
  api<{ ok: boolean }>(`bookings/${id}`, { method: "DELETE", bookingToken: token });

export const checkSession = () => api<{ authenticated: boolean }>("admin/session");

export const getAdminConfig = () => api<Config>("admin/config");

export const saveAdminConfig = (config: Config) =>
  api<{ ok: boolean }>("admin/config", { method: "PUT", body: JSON.stringify(config) });

export const getAgenda = (date: string, end: string) =>
  api<AgendaResponse>(`admin/agenda?date=${date}&end=${end}`);

export const getAdminSlots = (date: string, duration: number) =>
  api<SlotsResponse>(`admin/slots?date=${date}&duration=${duration}`);

export const createAdminBooking = (body: Record<string, unknown>) =>
  api<Booking>("admin/bookings", { method: "POST", body: JSON.stringify(body) });

export const cancelAdminBooking = (id: string) =>
  api<{ ok: boolean }>(`admin/bookings/${id}`, { method: "DELETE" });
