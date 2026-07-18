"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Diya } from "@/components/icons";
import { Chip, FooterNote } from "@/components/ui";
import { matchScenario } from "@/lib/matchScenario";
import { scenarios } from "@/lib/data";
import { logEvent } from "@/lib/analytics";

const TRY_CHIPS: { label: string; scenarioId: string }[] = [
  { label: "Moving into a new flat", scenarioId: "new-home" },
  { label: "A parent's health", scenarioId: "health" },
  { label: "Starting a new job", scenarioId: "new-job" },
];

const BUDGETS = ["Under ₹3K", "₹3–7K", "₹7–15K", "₹15K+"];
const LANGS = ["Hindi", "English", "Kannada", "Tamil"];
const TRADITIONS = ["Smartism", "Vaishnav", "Shaiva", "Shakta"];
const REGIONS = ["North", "South", "East", "West"];

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [budget, setBudget] = useState("₹3–7K");
  const [lang, setLang] = useState("Hindi");
  const [tradition, setTradition] = useState("Smartism");
  const [region, setRegion] = useState("North");
  const [langToast, setLangToast] = useState(false);

  function submit() {
    const text = input.trim();
    if (!text) return;
    logEvent("input_submitted", { text, budget, lang, tradition, region });
    // Demo never dead-ends: unmatched input routes to the reviewed
    // general-blessing template (still retrieval-only — the result page
    // shows a "pandit will review your words" banner for it).
    const id = matchScenario(text);
    if (id) {
      logEvent("scenario_matched", { id });
    } else {
      logEvent("unmatched_input", { text });
    }
    router.push(`/result/${id ?? "general"}?q=${encodeURIComponent(text)}`);
  }

  function tapTry(label: string, scenarioId: string) {
    const s = scenarios.find((x) => x.id === scenarioId);
    if (s) setInput(s.sampleInput);
    logEvent("try_chip_tap", { label });
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 mx-auto flex w-full max-w-[1080px] items-center justify-between bg-ground px-5 py-3.5 lg:py-5">
        <div className="flex items-center gap-2">
          <span className="text-maroon">
            <Diya size={24} className="lg:hidden" />
            <Diya size={26} className="hidden lg:block" />
          </span>
          <span className="font-disp text-[20px] font-extrabold text-maroon lg:text-[22px]">
            PujaBot
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-[13px] text-inksoft lg:inline">
            Which puja, with whom, how — answered in 1 minute
          </span>
          <div className="relative">
            <button
              className="flex overflow-hidden rounded-[999px] border border-hairline text-[12px] font-semibold"
              onClick={() => {
                setLangToast(true);
                logEvent("lang_toggle_tap");
                setTimeout(() => setLangToast(false), 1800);
              }}
            >
              <span className="bg-maroon px-2.5 py-1 text-ground">EN</span>
              <span className="px-2.5 py-1 text-maroon">हिन्दी</span>
            </button>
            {langToast && (
              <span className="absolute right-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-md border border-hairline bg-card px-2.5 py-1 text-[12px] text-ink shadow-warm">
                हिन्दी — coming soon
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[660px] flex-1 flex-col px-5 pt-6 lg:pt-[72px]">
        <span className="kicker">नमस्ते · Namaste</span>
        <h1 className="mt-2 font-disp text-[31px] font-bold leading-tight text-maroon lg:text-[39px]">
          What&rsquo;s the occasion?
        </h1>
        <p className="mt-1.5 max-w-[540px] text-inksoft lg:text-[17px]">
          Tell us in your own words — we&rsquo;ll suggest the right puja, an
          auspicious date, and a pandit to guide it.
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., I'm starting a new business. I want to invoke peace and prosperity for my family."
          rows={4}
          className="mt-5 w-full resize-none rounded-lg border border-hairline bg-card p-4 text-[16px] text-ink shadow-warm outline-none placeholder:text-inksoft/70 focus:border-maroon lg:p-5 lg:text-[17px]"
        />

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-inksoft">Try:</span>
          {TRY_CHIPS.map((t) => (
            <button key={t.label} onClick={() => tapTry(t.label, t.scenarioId)}>
              <Chip soft>{t.label}</Chip>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:gap-8">
          <div className="flex items-start gap-2.5">
            <span className="w-[74px] flex-none pt-1.5 text-[13px] font-semibold text-maroon lg:w-auto lg:pr-1">
              Budget
            </span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setBudget(b);
                    logEvent("budget_chip_tap", { b });
                  }}
                >
                  <Chip on={budget === b}>{b}</Chip>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-[74px] flex-none pt-1.5 text-[13px] font-semibold text-maroon lg:w-auto lg:pr-1">
              Language
            </span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l);
                    logEvent("lang_chip_tap", { l });
                  }}
                >
                  <Chip on={lang === l}>{l}</Chip>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-[13px] text-inksoft">
          Tradition &amp; region — we&rsquo;ll read them from your details, or
          set them here
        </p>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:gap-8">
            <div className="flex items-start gap-2.5">
              <span className="w-[74px] flex-none pt-1.5 text-[13px] font-semibold text-maroon lg:w-auto lg:pr-1">
                Tradition
              </span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {TRADITIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTradition(t);
                      logEvent("tradition_chip_tap", { t });
                    }}
                  >
                    <Chip on={tradition === t}>{t}</Chip>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-[74px] flex-none pt-1.5 text-[13px] font-semibold text-maroon lg:w-auto lg:pr-1">
                Region
              </span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRegion(r);
                      logEvent("region_chip_tap", { r });
                    }}
                  >
                    <Chip on={region === r}>{r}</Chip>
                  </button>
                ))}
              </div>
            </div>
          </div>

        <div className="mt-auto flex flex-col gap-3 pt-7 lg:mt-8 lg:flex-row lg:items-center lg:justify-between lg:pt-0">
          <div className="order-2 flex flex-col items-center gap-0.5 lg:order-1 lg:items-start">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-green">
              <Check size={15} />8 ritual templates · reviewed by 2 practicing
              pandits
            </span>
            <span className="hidden text-[12px] text-inksoft lg:inline">
              Built with pandits in Bengaluru &amp; Delhi
            </span>
          </div>
          <button
            onClick={submit}
            className="btn-key order-1 flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-saffron px-5 text-[16px] font-bold text-maroondeep lg:order-2 lg:w-[250px]"
          >
            Find My Puja
            <ArrowRight />
          </button>
        </div>
      </div>

      <FooterNote>
        PujaBot helps you prepare — it does not replace the guidance of a
        qualified pandit.
        <span className="hidden lg:inline">
          {" "}
          All ritual content is reviewed by practicing pandits, never
          AI-generated.
        </span>
      </FooterNote>
    </main>
  );
}
