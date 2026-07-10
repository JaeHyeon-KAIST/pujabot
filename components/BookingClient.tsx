"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Pandit, Puja, Scenario } from "@/lib/data";
import { formatINR } from "@/lib/data";
import { logEvent } from "@/lib/analytics";
import { saveBooking } from "@/lib/booking";
import { Check, Diya, Star } from "./icons";
import { Avatar, Chip, Hairline } from "./ui";

function Field({
  label,
  helper,
  children,
}: {
  label: React.ReactNode;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold text-maroon">{label}</span>
      {children}
      {helper && <span className="text-[12px] text-inksoft">{helper}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border-[1.5px] border-hairline bg-card px-3.5 py-3 text-[16px] text-ink outline-none focus:border-maroon";

export default function BookingClient({
  scenario,
  puja,
  pandit,
}: {
  scenario: Scenario;
  puja: Puja;
  pandit: Pandit;
}) {
  const router = useRouter();
  const [name, setName] = useState("Ankit Sharma");
  const [mobile, setMobile] = useState("+91 98860 4XXXX");
  const [gotra, setGotra] = useState("");
  const [sankalpa, setSankalpa] = useState(scenario.sankalpaPrefill);
  const [payment, setPayment] = useState<"upi" | "after">("upi");
  const [dateChoice, setDateChoice] = useState<"main" | "alt">("main");

  const altFull = scenario.date.alt.replace(
    /^(Earlier|Also good|Festival option):\s*/,
    "",
  );
  const altDay = altFull.split("·")[0]?.trim() ?? altFull;

  function book() {
    saveBooking({
      scenarioId: scenario.id,
      pujaId: puja.id,
      pujaName: puja.name,
      panditId: pandit.id,
      panditName: pandit.name,
      dateDay: dateChoice === "main" ? scenario.date.day : altDay,
      dateWindow:
        dateChoice === "main"
          ? scenario.date.window
          : "Muhurat confirmed by your pandit",
      city: scenario.city,
      price: pandit.price,
      payment,
      name,
      sankalpa,
    });
    logEvent("booking_submitted", {
      scenarioId: scenario.id,
      panditId: pandit.id,
      payment,
    });
    router.push("/confirmed");
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 pb-8">
      {/* Profile header — torana cap (second of the two permitted surfaces) */}
      <div className="torana flex flex-col gap-2.5 rounded-lg border border-hairline bg-card px-[18px] pb-4 pt-[26px] shadow-warm">
        <div className="flex items-start gap-3">
          <Avatar initials={pandit.initials} size={64} />
          <div className="min-w-0 flex-1">
            <div className="font-disp text-[20px] font-bold leading-tight text-maroon">
              {pandit.name}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-inksoft">
              Home-ritual specialist · Purohit
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[13px]">
              <Star />
              <span className="font-semibold">
                {pandit.rating} ({pandit.ratingCount})
              </span>
              <span className="text-inksoft">
                · {pandit.years} yrs · {pandit.distanceKm} km
              </span>
            </div>
          </div>
        </div>
        <span className="text-[13px]">
          {pandit.credential} · {pandit.langLine}
        </span>
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-green">
          <Check size={13} />
          Verified in person · credentials on file
        </span>
      </div>

      {/* Review snippets */}
      <div className="mt-3.5 flex flex-col gap-2">
        {pandit.reviews.slice(0, 2).map((r) => (
          <div key={r.quote} className="rounded-lg bg-cardwarm px-3.5 py-3">
            <p className="text-[13px]">&ldquo;{r.quote}&rdquo;</p>
            <p className="mt-1 text-[12px] text-inksoft">
              {r.author}, {r.area} · {r.date}
            </p>
          </div>
        ))}
      </div>

      {/* Transparent price card */}
      <div className="mt-3.5 flex flex-col gap-2 rounded-lg border border-hairline bg-card px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-maroon">{puja.name}</span>
          <span className="font-disp text-[20px] font-bold text-maroon">
            {formatINR(pandit.price)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span>Pandit dakshina</span>
          <span className="font-semibold">{formatINR(pandit.price)}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span>
            Samagri kit{" "}
            <span className="text-inksoft">(optional —</span>{" "}
            <Link
              href={`/checklist/${scenario.id}`}
              className="font-semibold text-maroon underline"
            >
              see the checklist
            </Link>
            <span className="text-inksoft">)</span>
          </span>
          <span className="font-semibold">+{formatINR(puja.samagriKitPrice)}</span>
        </div>
        <Hairline />
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-inksoft">Transparent pricing · no hidden charges</span>
          <span className="font-semibold text-green">Pay after puja available</span>
        </div>
      </div>

      {/* Auspicious dates */}
      <div className="mt-5">
        <span className="kicker">Auspicious dates</span>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setDateChoice("main");
              logEvent("booking_date_choice", { choice: "main" });
            }}
          >
            <Chip on={dateChoice === "main"}>
              {scenario.date.day} ·{" "}
              {scenario.date.detail.split("·")[0]?.trim()}
            </Chip>
          </button>
          <button
            onClick={() => {
              setDateChoice("alt");
              logEvent("booking_date_choice", { choice: "alt" });
            }}
          >
            <Chip on={dateChoice === "alt"}>{altFull}</Chip>
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="text-maroon">
            <Diya size={18} />
          </span>
          <div>
            <div className="text-[13px] font-semibold">
              {dateChoice === "main"
                ? scenario.date.window
                : "Exact muhurat — confirmed by your pandit"}
            </div>
            <div className="text-[12px] text-inksoft">
              auspicious window ·{" "}
              {scenario.city === "bengaluru" ? "Bengaluru" : "Delhi"}
            </div>
          </div>
        </div>
      </div>

      {/* Details form */}
      <div className="mt-5 flex flex-col gap-3">
        <span className="kicker">Your details</span>
        <Field label="Full name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Mobile number">
          <input className={inputCls} value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" />
        </Field>
        <Field
          label={
            <>
              Gotra <span className="font-normal text-inksoft">(optional)</span>
            </>
          }
          helper="Your family lineage, recited during Sankalpa. Skip if unsure."
        >
          <input
            className={inputCls}
            value={gotra}
            onChange={(e) => setGotra(e.target.value)}
            placeholder="e.g., Bharadwaja"
          />
        </Field>
        <Field
          label="Your wish (Sankalpa)"
          helper="Prefilled from your words — the pandit will confirm it with you."
        >
          <textarea
            className={`${inputCls} min-h-[64px] resize-none`}
            value={sankalpa}
            onChange={(e) => setSankalpa(e.target.value)}
          />
        </Field>
      </div>

      {/* Payment */}
      <div className="mt-5">
        <span className="kicker">Payment</span>
        <div className="mt-2.5 flex gap-2">
          {(
            [
              ["upi", "UPI"],
              ["after", "Pay after puja"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setPayment(value);
                logEvent("payment_selected", { value });
              }}
              className={`flex flex-1 items-center gap-2 rounded-md border-[1.5px] px-3 py-3 text-[14px] ${
                payment === value
                  ? "border-maroon bg-card font-semibold"
                  : "border-hairline"
              }`}
            >
              <span
                className={`h-[18px] w-[18px] flex-none rounded-[999px] border-[1.5px] ${
                  payment === value
                    ? "border-[5.5px] border-maroon"
                    : "border-hairline"
                }`}
              />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[12px] text-inksoft">
          No card needed · UPI apps or cash after the ceremony
        </p>
      </div>

      <button
        onClick={book}
        className="btn-key mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-saffron px-5 text-[16px] font-bold text-maroondeep"
      >
        Book Now · {formatINR(pandit.price)}
      </button>
      <p className="mt-2 text-center text-[12px] text-inksoft">
        Pandit confirms on WhatsApp within 30 minutes
      </p>
    </div>
  );
}
