"use client";

import { useSearchParams } from "next/navigation";

/** Echoes the user's actual words from ?q=, falling back to the scripted sample. */
export default function YouSaid({ fallback }: { fallback: string }) {
  const params = useSearchParams();
  const text = params.get("q")?.trim() || fallback;
  return (
    <div className="flex items-center justify-between gap-2.5 rounded-lg bg-cardwarm px-3.5 py-2.5">
      <span className="min-w-0 flex-1 text-[13px]">
        You said: &ldquo;{text}&rdquo;
      </span>
      <span className="flex-none text-[13px] font-semibold text-maroon">Edit</span>
    </div>
  );
}
