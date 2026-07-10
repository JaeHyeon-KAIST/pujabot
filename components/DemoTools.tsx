"use client";

import { useEffect, useState } from "react";
import { exportEvents, logEvent, resetDemo } from "@/lib/analytics";

/**
 * Facilitator affordances (05-dev-field-readiness §5):
 *  - ?demo=reset  → clears localStorage app state (keeps SW cache), back to "/"
 *  - ?debug=export → renders the event log as JSON for copy-out (works offline)
 */
export default function DemoTools() {
  const [exported, setExported] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "reset") {
      logEvent("demo_reset");
      resetDemo();
      return;
    }
    if (params.get("debug") === "export") {
      setExported(exportEvents());
    }
  }, []);

  if (exported === null) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-sanctum/90 p-6">
      <div className="mx-auto max-w-[720px] rounded-lg bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="kicker">Event log export</span>
          <button
            className="text-[13px] font-semibold text-maroon"
            onClick={() => setExported(null)}
          >
            Close
          </button>
        </div>
        <pre className="overflow-auto text-[12px] leading-relaxed whitespace-pre-wrap break-all">
          {JSON.stringify(JSON.parse(exported), null, 2)}
        </pre>
      </div>
    </div>
  );
}
