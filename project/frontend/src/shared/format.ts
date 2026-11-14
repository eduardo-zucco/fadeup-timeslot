import type { Booking } from "@/shared/types";

export const money = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

export const clock = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

export const today = (): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export const dateLabel = (date: string): string =>
  new Date(`${date}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

export const shiftDate = (date: string, days: number): string =>
  new Date(+new Date(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

export const startsAt = (booking: Booking): number =>
  +new Date(`${booking.date}T${clock(booking.start)}:00-03:00`);

export const canManage = (booking: Booking, now = Date.now()): boolean =>
  booking.status === "confirmed" && startsAt(booking) > now;

export const monthShort = (date: string): string =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" });

export const dayOfMonth = (date: string): number => new Date(`${date}T12:00:00Z`).getUTCDate();
