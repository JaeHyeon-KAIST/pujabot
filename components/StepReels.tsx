"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReelStep } from "@/lib/data";
import { Chip } from "./ui";
import { ChevronLeft, ChevronRight, Play, Square, X } from "./icons";

/** Screen 3b (V2) — full-screen step-by-step "reels" walkthrough of a puja. */
export default function StepReels({
  steps,
  pujaName,
  backHref,
}: {
  steps: ReelStep[];
  pujaName: string;
  backHref: string;
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  const step = steps[i];
  const isLast = i === steps.length - 1;

  return (
    <div className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-ground">
      {/* 1 — Image header (cross-fading frames + progress overlay) */}
      <div className="relative h-[296px] flex-none overflow-hidden border-b border-hairgold bg-ground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={step.images[0]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {step.images[1] ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.images[1]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ animation: "xfade 5s ease-in-out infinite" }}
            />
          </>
        ) : null}

        <div
          className="absolute inset-x-0 top-0 z-[5] px-3.5 py-3"
          style={{
            background:
              "linear-gradient(rgba(255,248,236,.92),rgba(255,248,236,0))",
          }}
        >
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-[3px] flex-1 rounded transition-colors ${
                  idx <= i ? "bg-maroon" : "bg-maroon/20"
                }`}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-maroon">
              {pujaName} · Step {i + 1} of {steps.length}
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => router.push(backHref)}
              className="-m-1 p-1"
            >
              <X size={18} className="text-maroon" />
            </button>
          </div>
        </div>
      </div>

      {/* 2 — Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-5 pt-4 pb-2.5">
        <span className="kicker">{step.dur} · estimate</span>
        <h2 className="font-disp text-[25px] font-bold text-maroon">
          {step.title}
        </h2>
        <span className="text-[13px] font-semibold text-goldink">
          {step.sub}
        </span>

        {step.callouts && step.callouts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {step.callouts.map((c) => (
              <Chip key={c} className="text-[11px]">
                {c}
              </Chip>
            ))}
          </div>
        ) : null}

        <p className="text-[13px]">{step.body}</p>
        <p className="text-[13px] text-inksoft">{step.detail}</p>
        <p className="text-[12px] text-inksoft">
          Sources: {step.src} · pandit review in progress
        </p>

        {step.mantra ? (
          <div className="flex flex-col gap-1.5 rounded-lg bg-sanctum p-[14px_16px] text-sanctumtext">
            <span className="kicker text-sanctumgold">Mantra in this step</span>
            <span className="text-[13px] font-semibold text-sanctumgold">
              {step.mantra.title}
            </span>
            {step.mantra.dev ? (
              <span
                className="font-scrip text-[19px] leading-relaxed"
                style={{ whiteSpace: "pre-line" }}
              >
                {step.mantra.dev}
              </span>
            ) : null}
            <span
              className="text-[13px] italic opacity-90"
              style={{ whiteSpace: "pre-line" }}
            >
              {step.mantra.rom}
            </span>
            <span className="text-[13px] opacity-90">
              <b className="text-sanctumgold">Meaning · </b>
              {step.mantra.meaning}
            </span>

            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-md font-semibold"
              style={{
                background: "rgba(212,175,55,.12)",
                border: "1px solid rgba(212,175,55,.5)",
                color: "#F5ECDD",
              }}
            >
              {playing ? (
                <>
                  <Square size={14} />
                  Playing · tap to stop
                  <span className="flex items-end gap-[2px]">
                    {["0s", ".2s", ".4s", ".1s"].map((delay, idx) => (
                      <span
                        key={idx}
                        className="h-[15px] w-[3px] bg-sanctumgold"
                        style={{
                          transformOrigin: "bottom",
                          animation: "eq .8s ease-in-out infinite",
                          animationDelay: delay,
                        }}
                      />
                    ))}
                  </span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  Listen to the chant
                </>
              )}
            </button>

            <span className="text-[12px] opacity-65">
              {step.mantra.cite} — verbatim from source · pandit review in
              progress
            </span>
            {step.mantra.more ? (
              <span className="border-t border-sanctumgold/25 pt-2 text-[12px] opacity-80">
                {step.mantra.more}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* 3 — Bottom nav */}
      <div
        className="flex flex-none gap-2.5 bg-ground px-5 pt-3 pb-4"
        style={{ boxShadow: "0 -6px 12px rgba(107,27,27,.05)" }}
      >
        <button
          type="button"
          aria-label="Previous step"
          onClick={() => {
            setI((prev) => Math.max(0, prev - 1));
            setPlaying(false);
          }}
          className="flex min-h-[48px] w-[52px] flex-none items-center justify-center gap-2 rounded-md border-[1.5px] border-maroon text-[16px] font-semibold text-maroon"
          style={{ opacity: i === 0 ? 0.35 : 1 }}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (isLast) {
              router.push(backHref);
            } else {
              setI((prev) => prev + 1);
              setPlaying(false);
            }
          }}
          className="btn-key flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-md bg-saffron px-5 text-[16px] font-bold text-maroondeep"
        >
          {isLast ? (
            "Done"
          ) : (
            <>
              Next step
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
