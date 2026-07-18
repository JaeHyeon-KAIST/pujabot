"use client";

import { useState } from "react";
import type { Puja, SamagriPriced, Scenario, Vendor } from "@/lib/data";
import { formatINR } from "@/lib/data";
import { logEvent } from "@/lib/analytics";
import { Hairline } from "@/components/ui";
import { Chat, Check, Pin } from "./icons";
import VendorMap from "./VendorMap";

/** Stable key so identical labels across groups never collide. */
const itemKey = (groupTitle: string, label: string) => `${groupTitle}:${label}`;

export default function ChecklistClient({
  scenario,
  puja,
  samagri,
}: {
  scenario: Scenario;
  puja: Puja;
  vendors: Vendor[];
  samagri: SamagriPriced;
}) {
  const [mode, setMode] = useState<"self" | "kit">("self");
  const [checked, setChecked] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const g of samagri.groups)
      for (const it of g.items)
        if (it.checked) set.add(itemKey(g.title, it.label));
    return set;
  });

  // Derive count + total live from the checked Set, over items that exist.
  let tickedCount = 0;
  let total = 0;
  for (const g of samagri.groups)
    for (const it of g.items)
      if (checked.has(itemKey(g.title, it.label))) {
        tickedCount += 1;
        total += it.price;
      }

  function toggle(groupTitle: string, label: string) {
    const key = itemKey(groupTitle, label);
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      logEvent("checklist_toggle", { item: label, checked: next.has(key) });
      return next;
    });
  }

  function shareOnWhatsApp() {
    logEvent("wa_share_tap", { scenarioId: scenario.id });
    const remaining = samagri.groups.flatMap((g) =>
      g.items
        .filter((it) => !checked.has(itemKey(g.title, it.label)))
        .map((it) => it.label),
    );
    const text = [
      `🙏 Samagri checklist — ${puja.name} (${scenario.date.day})`,
      "",
      ...remaining.map((i) => `◻ ${i}`),
      "",
      "— via PujaBot",
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 pb-8">
      {/* Mode toggle */}
      <div className="flex rounded-md bg-cardwarm p-[3px]">
        {(
          [
            ["kit", `Pandit brings everything · +${formatINR(puja.samagriKitPrice)}`],
            ["self", "I'll arrange it myself"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
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

      {/* Subtitle + provenance */}
      <p className="mt-3 text-[13px] text-inksoft">
        Tick what you still need — prices from partner stores in{" "}
        {samagri.pricesArea}. Unticked items most homes already have.
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-green">
        <Check size={14} strokeWidth={2.4} />
        Sourced from 7 verified guides · pandit review in progress
      </div>

      {/* Item groups */}
      <div className={mode === "kit" ? "mt-4 opacity-60" : "mt-4"}>
        {samagri.groups.map((g, gi) => (
          <div key={g.title} className={gi === 0 ? "" : "mt-3"}>
            <span className="kicker">{g.title}</span>
            <div className="mt-1 flex flex-col">
              {g.items.map((it) => {
                const isChecked =
                  mode === "kit" || checked.has(itemKey(g.title, it.label));
                return (
                  <button
                    key={it.label}
                    type="button"
                    disabled={mode === "kit"}
                    onClick={() => toggle(g.title, it.label)}
                    className="flex w-full items-center gap-2.5 py-[7px] text-left"
                  >
                    <span
                      className={`flex h-5 w-5 flex-none items-center justify-center rounded-sm border-[1.5px] ${
                        isChecked
                          ? "border-green bg-green text-card"
                          : "border-maroon/40"
                      }`}
                    >
                      {isChecked && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 grow text-[13px]">{it.label}</span>
                    <span className="min-w-[44px] flex-none text-right text-[13px] font-semibold text-maroon">
                      {formatINR(it.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Get it delivered */}
      <div className="mt-6">
        <span className="kicker">Get it delivered</span>
        <div className="mt-2 flex flex-col gap-2.5 rounded-lg border border-hairline bg-card p-[14px_16px] shadow-warm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-maroon">
                {tickedCount} items ticked
              </div>
              <div className="text-[12px] text-inksoft">
                priced at {samagri.pricedStore}
              </div>
            </div>
            <span className="flex-none font-disp text-[20px] font-bold text-maroon">
              {formatINR(total)}
            </span>
          </div>

          <Hairline />

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-maroon">
              Deliver to
            </span>
            <div className="flex items-center gap-2 rounded-md border-[1.5px] border-hairline bg-card px-3 py-2.5">
              <Pin size={16} className="flex-none text-maroon" />
              <span className="min-w-0 grow text-[13px]">
                {samagri.delivery.address}
              </span>
              <span className="flex-none text-[12px] font-semibold text-maroon">
                Change
              </span>
            </div>
            <span className="text-[12px] font-semibold text-green">
              {samagri.delivery.arrival}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              logEvent("checklist_buy", { scenarioId: scenario.id, tickedCount, total })
            }
            className="btn-key flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-saffron px-5 text-[16px] font-bold text-maroondeep"
          >
            Buy {tickedCount} items · {formatINR(total)}
          </button>

          {samagri.delivery.payOnDelivery && (
            <p className="text-center text-[12px] text-inksoft">
              Pay on delivery available
            </p>
          )}
        </div>
      </div>

      {/* Prefer buying in person */}
      <div className="mt-6">
        <div className="flex items-baseline gap-2">
          <span className="kicker">Prefer buying in person?</span>
          <span className="text-[12px] text-inksoft">optional</span>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {samagri.vendors.map((v, i) => (
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
                  {v.area} · {v.distanceKm} km · {v.status}
                </div>
              </div>
              <div className="flex-none text-right">
                <div className="text-[13px] font-semibold text-maroon">
                  ≈ {formatINR(v.estimate)}
                </div>
                <div className="text-[12px] text-inksoft">
                  your {tickedCount} items
                </div>
              </div>
            </div>
          ))}
          <VendorMap city={scenario.city} />
        </div>
      </div>

      <button
        onClick={shareOnWhatsApp}
        className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-wafill text-[16px] font-bold text-waink"
      >
        <Chat />
        Share checklist on WhatsApp
      </button>
    </div>
  );
}
