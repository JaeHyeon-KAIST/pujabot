import Link from "next/link";
import { Diya } from "@/components/icons";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-maroon">
        <Diya size={32} />
      </span>
      <h1 className="font-disp text-[20px] font-bold text-maroon">
        You&rsquo;re offline
      </h1>
      <p className="max-w-[340px] text-[14px] text-inksoft">
        The demo flow you&rsquo;ve already opened keeps working offline. This
        page wasn&rsquo;t cached yet — reconnect once to load it.
      </p>
      <Link href="/" className="font-semibold text-maroon underline">
        Back to start →
      </Link>
    </main>
  );
}
