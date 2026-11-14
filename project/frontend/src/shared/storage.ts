import type { Booking, ReservationKey } from "@/shared/types";

const STORAGE_KEY = "fadeup-reservas";

const isValidKey = (value: unknown): value is ReservationKey => {
  if (!value || typeof value !== "object") return false;
  const key = value as Record<string, unknown>;
  return (
    typeof key.id === "string" &&
    /^[\da-f-]{36}$/i.test(key.id) &&
    typeof key.token === "string" &&
    /^[\da-f-]{72}$/i.test(key.token)
  );
};

export function mergeReservationKeys(
  items: unknown,
  item?: Pick<Booking, "id" | "token">,
): ReservationKey[] {
  const list = Array.isArray(items) ? items : [];
  const map = new Map<string, ReservationKey>();
  for (const value of list) {
    if (isValidKey(value)) map.set(value.id, { id: value.id, token: value.token });
  }
  if (item && isValidKey(item)) map.set(item.id, { id: item.id, token: item.token });
  return [...map.values()];
}

export function loadReservations(): ReservationKey[] {
  try {
    return mergeReservationKeys(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function rememberReservation(
  keys: ReservationKey[],
  booking: Pick<Booking, "id" | "token">,
): ReservationKey[] {
  const next = mergeReservationKeys(keys, booking);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignora falha de persistência; chamador avisa o usuário
  }
  return next;
}
