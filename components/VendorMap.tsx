import maps from "@/data/maps.json";
import type { City } from "@/lib/data";

/**
 * Static neighborhood map from pre-downloaded OpenStreetMap tiles
 * (scratch script → public/maps/ + data/maps.json), so it needs no API key
 * and works fully offline. Attribution is required by OSM's ODbL license.
 */
export default function VendorMap({ city }: { city: City }) {
  const m = maps[city];
  return (
    <div
      className="relative overflow-hidden rounded-md border border-[#E3D5B8]"
      style={{ aspectRatio: `${m.width} / ${m.height}` }}
    >
      {m.tiles.map((t) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={t.src}
          src={t.src}
          alt=""
          draggable={false}
          className="absolute max-w-none"
          style={{
            left: `${t.left}%`,
            top: `${t.top}%`,
            width: `${m.tileWPct}%`,
            height: `${m.tileHPct}%`,
          }}
        />
      ))}
      {/* Warm tint so the map sits inside the palette instead of fighting it */}
      <div className="pointer-events-none absolute inset-0 bg-turmeric/15 mix-blend-multiply" />

      {/* Home */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${m.home.xPct}%`, top: `${m.home.yPct}%` }}
      >
        <span className="block h-3.5 w-3.5 rounded-full border-2 border-card bg-green shadow-warm" />
        <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 rounded-sm bg-green px-1.5 py-px text-[10px] font-bold text-card">
          You
        </span>
      </div>

      {/* Vendor pins */}
      {m.pins.map((p, i) => (
        <div
          key={p.name}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-maroon font-disp text-[11px] font-bold text-card shadow-warm">
            {i + 1}
          </span>
          <span
            className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm border border-[#E3D5B8] bg-card px-1.5 py-px text-[10px] font-semibold text-maroon shadow-warm ${
              p.xPct > 55 ? "right-full mr-1.5" : "left-full ml-1.5"
            }`}
          >
            {p.name}
          </span>
        </div>
      ))}

      <span className="absolute bottom-0.5 right-1 text-[9px] text-ink/50">
        © OpenStreetMap
      </span>
    </div>
  );
}
