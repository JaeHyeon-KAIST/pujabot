"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "./icons";

/** History-aware back button — for screens reachable from multiple flows (e.g., checklist). */
export default function BackChevron() {
  const router = useRouter();
  return (
    <button
      aria-label="Back"
      className="-m-2 p-2 text-maroon"
      onClick={() => router.back()}
    >
      <ChevronLeft />
    </button>
  );
}
