import Link from "next/link";
import { Diya } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-maroon">
        <Diya size={32} />
      </span>
      <h1 className="font-disp text-[20px] font-bold text-maroon">
        We don&rsquo;t have a page for that
      </h1>
      <p className="max-w-[340px] text-[14px] text-inksoft">
        If you were looking for a puja we haven&rsquo;t scripted yet, a pandit
        will review your request and reply on WhatsApp — nothing here is
        auto-generated.
      </p>
      <Link href="/" className="font-semibold text-maroon underline">
        Back to start →
      </Link>
    </main>
  );
}
