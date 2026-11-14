import type { Booking } from "@/shared/types";

export function managementLink(booking: Pick<Booking, "id" | "token">): string {
  return `${location.origin}/#reserva=${booking.id}.${booking.token}`;
}

export async function copyManagementLink(booking: Pick<Booking, "id" | "token">): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(managementLink(booking));
    return true;
  } catch {
    return false;
  }
}
