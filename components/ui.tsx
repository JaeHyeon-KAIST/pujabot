import Link from "next/link";
import { ChevronLeft } from "./icons";

/** Shared UI primitives — the visual vocabulary from the verified mockups. */

export function TopBar({
  title,
  backHref,
  leading,
}: {
  title: string;
  backHref?: string;
  leading?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-40 bg-ground">
      <div className="mx-auto flex w-full max-w-[1080px] items-center gap-2.5 px-5 pt-4 pb-2.5 font-disp text-[18px] font-bold text-maroon lg:pt-6 lg:text-[20px]">
        {leading ??
          (backHref ? (
            <Link href={backHref} aria-label="Back" className="-m-2 p-2">
              <ChevronLeft className="text-maroon" />
            </Link>
          ) : null)}
        <span>{title}</span>
      </div>
    </div>
  );
}

export function Chip({
  children,
  on = false,
  soft = false,
  className = "",
}: {
  children: React.ReactNode;
  on?: boolean;
  soft?: boolean;
  className?: string;
}) {
  const look = on
    ? "bg-turmeric border-turmeric text-maroondeep font-semibold"
    : soft
      ? "bg-cardwarm border-cardwarm text-maroon"
      : "bg-card border-hairline text-ink";
  return (
    <span
      className={`inline-flex items-center gap-[5px] whitespace-nowrap rounded-[999px] border px-3 py-[5px] text-[13px] font-medium ${look} ${className}`}
    >
      {children}
    </span>
  );
}

export function Tag({
  children,
  kind = "match",
}: {
  children: React.ReactNode;
  kind?: "match" | "budget" | "over";
}) {
  const look =
    kind === "match"
      ? "bg-turmeric text-maroondeep"
      : kind === "budget"
        ? "bg-green/10 text-green"
        : "bg-maroon/8 text-maroon";
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-[2px] text-[12px] font-semibold ${look}`}>
      {children}
    </span>
  );
}

export function BadgeGreen({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[5px] text-[13px] font-semibold text-green">
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  size = 52,
}: {
  initials: string;
  size?: number;
}) {
  return (
    <span
      className="flex flex-none items-center justify-center rounded-[999px] border-[1.5px] border-hairgold bg-cardwarm font-disp font-bold text-maroon"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {initials}
    </span>
  );
}

export function FooterNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-6 pb-5 pt-3.5 text-center text-[12px] leading-[1.45] text-inksoft">
      {children}
    </p>
  );
}

export function Hairline({ className = "" }: { className?: string }) {
  return <hr className={`h-px border-none bg-hairline ${className}`} />;
}

export const DISCLAIMER =
  "PujaBot helps you prepare — it does not replace the guidance of a qualified pandit. All ritual content is reviewed by practicing pandits, never AI-generated.";
