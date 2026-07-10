"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadBooking, type Booking } from "@/lib/booking";
import { logEvent } from "@/lib/analytics";
import { Chat, Diya } from "@/components/icons";
import { DISCLAIMER, FooterNote, Hairline } from "@/components/ui";
import { formatINR } from "@/lib/data";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2.5">
      <span className="flex-none text-[13px] text-inksoft">{label}</span>
      <span className="text-right text-[13px] font-semibold">{value}</span>
    </div>
  );
}

export default function ConfirmedPage() {
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [calToast, setCalToast] = useState(false);

  useEffect(() => {
    setBooking(loadBooking());
  }, []);

  if (booking === undefined) return null; // first client render

  if (booking === null) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-maroon">
          <Diya size={32} />
        </span>
        <p className="text-inksoft">No booking yet.</p>
        <Link href="/" className="font-semibold text-maroon underline">
          Start with your occasion →
        </Link>
      </main>
    );
  }

  const cityLabel =
    booking.city === "bengaluru" ? "HSR Layout, Bengaluru" : "Lajpat Nagar, Delhi";

  return (
    <main className="flex min-h-dvh flex-col">
      {/* Deep Sanctum moment — the one committed dark surface */}
      <div className="flex flex-col items-center gap-2 bg-sanctum px-6 pb-[52px] pt-10 text-center text-sanctumtext">
        <Diya size={40} body="#f5ecdd" />
        <h1 className="font-disp text-[25px] font-bold">Booking confirmed</h1>
        <span className="font-scrip text-[19px] text-sanctumgold">शुभम्</span>
        <span className="text-[13px] opacity-85">
          May this new beginning be blessed.
        </span>
      </div>

      <div className="mx-auto -mt-[34px] w-full max-w-[560px] px-5">
        <div className="flex flex-col gap-2.5 rounded-lg border border-hairline bg-card p-4 shadow-warm">
          <Row label="Puja" value={booking.pujaName} />
          <Row label="Pandit" value={`${booking.panditName} · Verified`} />
          <Row label="Date" value={`${booking.dateDay} · ${booking.dateWindow}`} />
          <Row label="Where" value={`Home · ${cityLabel}`} />
          <Hairline />
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-semibold">Total</span>
            <div className="flex flex-col items-end">
              <span className="font-disp text-[17px] font-bold text-maroon">
                {formatINR(booking.price)}
              </span>
              <span className="text-[12px] font-semibold text-green">
                {booking.payment === "after" ? "Pay after puja" : "UPI on confirmation"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2">
          <span className="mt-0.5 flex-none text-wa">
            <Chat />
          </span>
          <span className="text-[13px] font-semibold text-wa">
            {booking.panditName} will confirm on WhatsApp within 30 minutes
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1 rounded-md border border-wa/20 bg-wabubble px-3 py-2.5">
          <span className="text-[12px] leading-relaxed text-waink">
            🙏 Namaste {booking.name.split(" ")[0]}! Your {booking.pujaName} is
            confirmed — {booking.dateDay}, {booking.dateWindow} with{" "}
            {booking.panditName}. Samagri checklist: pujabot.in/s/
            {booking.scenarioId.slice(0, 5)}. He will call you a day before. —
            PujaBot
          </span>
          <span className="text-right text-[12px] text-waink/60">now</span>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Link
            href={`/checklist/${booking.scenarioId}`}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-md border-[1.5px] border-maroon text-[14px] font-semibold text-maroon"
          >
            View checklist
          </Link>
          <button
            onClick={() => {
              logEvent("add_to_calendar_tap");
              setCalToast(true);
              setTimeout(() => setCalToast(false), 1800);
            }}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-md border-[1.5px] border-maroon text-[14px] font-semibold text-maroon"
          >
            {calToast ? "Saved ✓ (demo)" : "Add to calendar"}
          </button>
        </div>
      </div>

      <div className="mt-auto">
        <FooterNote>{DISCLAIMER}</FooterNote>
      </div>
    </main>
  );
}
