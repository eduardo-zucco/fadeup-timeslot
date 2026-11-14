export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Config {
  name: string;
  open: number;
  close: number;
  interval: number;
  days: number[];
  services: Service[];
}

export type BookingStatus = "confirmed" | "cancelled";
export type BookingKind = "appointment" | "block";

export interface Booking {
  id: string;
  name: string;
  phone: string;
  service: string;
  price: number;
  duration: number;
  date: string;
  start: number;
  status: BookingStatus;
  kind: BookingKind;
  token?: string;
}

export interface ReservationKey {
  id: string;
  token: string;
}

export interface CustomerDraft {
  name: string;
  phone: string;
  consent: boolean;
}

export interface SlotsResponse {
  slots: number[];
}

export interface AgendaResponse {
  records: Booking[];
}
