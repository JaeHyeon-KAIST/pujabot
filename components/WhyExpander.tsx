"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "./icons";
import { logEvent } from "@/lib/analytics";

/** "Why this?" explainability expander — pass defaultOpen so the reasoning is never hidden. */
export default function WhyExpander({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-hairline bg-card px-4 py-3.5">
      <button
        className="flex w-full items-center justify-between"
        onClick={() => {
          setOpen(!open);
          logEvent("why_toggled", { title, open: !open });
        }}
      >
        <span className="font-semibold text-maroon">{title}</span>
        <span className="text-maroon">{open ? <ChevronUp /> : <ChevronDown />}</span>
      </button>
      {open && <div className="mt-2 text-[13px] leading-relaxed">{children}</div>}
    </div>
  );
}
