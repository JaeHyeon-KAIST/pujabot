"use client";

import { useSearchParams } from "next/navigation";

function midShorten(text: string, max = 70): string {
  if (text.length <= max) return text;
  const headEnd = text.lastIndexOf(" ", Math.ceil(max * 0.4));
  const tailStart = text.indexOf(" ", text.length - Math.floor(max * 0.55));
  if (headEnd <= 0 || tailStart < 0 || tailStart <= headEnd) {
    return `${text.slice(0, max)}…`;
  }
  const head = text.slice(0, headEnd).replace(/[.,;:!?]+$/, "");
  return `${head}… ${text.slice(tailStart + 1)}`;
}

/** Echoes the user's actual words from ?q=, falling back to the scripted sample. */
export default function YouSaid({ fallback }: { fallback: string }) {
  const params = useSearchParams();
  const text = params.get("q")?.trim() || fallback;
  return (
    <div className="flex items-center justify-between gap-2.5 rounded-lg bg-cardwarm px-3.5 py-2.5">
      <span className="min-w-0 flex-1 text-[13px]">
        You said: &ldquo;{midShorten(text)}&rdquo;
      </span>
      <span className="flex-none text-[13px] font-semibold text-maroon">Edit</span>
    </div>
  );
}
