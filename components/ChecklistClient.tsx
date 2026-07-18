"use client";

import { useState } from "react";
import type { Puja, Scenario, Vendor } from "@/lib/data";
import { formatINR } from "@/lib/data";
import { logEvent } from "@/lib/analytics";
import { Chat, Check } from "./icons";
import VendorMap from "./VendorMap";

function Item({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button className="flex items-center gap-2.5 py-[7px] text-left" onClick={onToggle}>
      <span
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-sm border-[1.5px] ${
          checked ? "border-green bg-green text-card" : "border-maroon/40 text-card/0"
        }`}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 text-[13px]">{label}</span>
    </button>
  );
}

export default function ChecklistClient({
  scenario,
  puja,
  vendors,
}: {
  scenario: Scenario;
  puja: Puja;
  vendors: Vendor[];
}) {
  const [mode, setMode] = useState<"self" | "kit">("self");
  const groups: { title: string; items: string[] }[] = [
    { title: "Essential", items: puja.samagri.essential },
    { title: "Offerings", items: puja.samagri.offerings },
    { title: "Good to have", items: puja.samagri.optional },
  ];
  const allItems = groups.flatMap((g) => g.items);
  const [checked, setChecked] = useState<Set<string>>(
    () =>
      new Set([
        ...puja.samagri.essential.slice(0, 3),
        puja.samagri.essential[puja.samagri.essential.length - 1],
        puja.samagri.offerings[0],
      ]),
  );

  function toggle(item: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      logEvent("checklist_toggle", { item, checked: next.has(item) });
      return next;
    });
  }

  function shareOnWhatsApp() {
    logEvent("wa_share_tap", { scenarioId: scenario.id });
    const remaining = allItems.filter((i) => !checked.has(i));
    const text = [
      `🙏 Samagri checklist — ${puja.name} (${scenario.date.day})`,
      "",
      ...remaining.map((i) => `◻ ${i}`),
      "",
      "— via PujaBot",
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const cityLabel = scenario.city === "bengaluru" ? "Koramangala" : "Lajpat Nagar";

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 pb-8">
      <div className="flex rounded-md bg-cardwarm p-[3px]">
        {(
          [
            ["kit", `Pandit brings everything · +${formatINR(puja.samagriKitPrice)}`],
            ["self", "I'll arrange it myself"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setMode(value);
              logEvent("checklist_mode", { value });
            }}
            className={`flex-1 rounded-[6px] px-1.5 py-[9px] text-[13px] ${
              mode === value
                ? "bg-card font-bold text-maroon shadow-warm"
                : "font-medium text-inksoft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-green">
        <Check size={14} strokeWidth={2.4} />
        List reviewed for {puja.name} · Jun 2026
      </div>

      {mode === "kit" ? (
        <div className="mt-4 rounded-lg bg-cardwarm px-4 py-4 text-[14px] leading-relaxed">
          Your pandit brings the full samagri set for{" "}
          <span className="font-semibold text-maroon">{puja.name}</span> —
          everything below is included for{" "}
          <span className="font-semibold">+{formatINR(puja.samagriKitPrice)}</span>.
          Fresh flowers and fruits are bought the same morning.
        </div>
      ) : null}

      <div className={mode === "kit" ? "opacity-60" : ""}>
        {groups.map((g, gi) => (
          <div key={g.title} className={gi === 0 ? "mt-[14px]" : "mt-3"}>
            <span className="kicker">{g.title}</span>
            <div className="mt-1 flex flex-col">
              {g.items.map((item) => (
                <Item
                  key={item}
                  label={item}
                  checked={mode === "kit" ? true : checked.has(item)}
                  onToggle={() => mode === "self" && toggle(item)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {mode === "self" && (
        <p className="mt-1.5 text-[12px] text-inksoft">
          {checked.size} of {allItems.length} arranged · {puja.samagriNote}
        </p>
      )}

      <div className="mt-[18px]">
        <span className="kicker">Nearby in {cityLabel}</span>
        <div className="mt-2 flex flex-col gap-2">
          {vendors.slice(0, 2).map((v, i) => (
            <div
              key={v.name}
              className="flex items-center gap-2.5 rounded-lg border border-hairline bg-card px-3.5 py-3"
            >
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-maroon font-disp text-[11px] font-bold text-card">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">{v.name}</div>
                <div className="text-[12px] text-inksoft">
                  {v.area} · {v.distanceKm} km
                </div>
              </div>
              <span className="flex-none text-[12px] font-semibold text-green">
                {v.status}
              </span>
            </div>
          ))}
          <VendorMap city={scenario.city} />
        </div>
      </div>

      <button
        onClick={shareOnWhatsApp}
        className="mt-[18px] flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-wafill text-[16px] font-bold text-waink"
      >
        <Chat />
        Share checklist on WhatsApp
      </button>
    </div>
  );
}
