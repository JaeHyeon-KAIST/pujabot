/** Booking state persisted to localStorage so /confirmed can render it. */

export interface Booking {
  scenarioId: string;
  pujaId: string;
  pujaName: string;
  panditId: string;
  panditName: string;
  dateDay: string;
  dateWindow: string;
  city: string;
  price: number;
  payment: "upi" | "after";
  name: string;
  sankalpa: string;
}

const KEY = "pujabot_booking";

export function saveBooking(b: Booking) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(b));
}

export function loadBooking(): Booking | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
}
