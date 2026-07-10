/**
 * Per-step scene illustrations, matched by the step's Sanskrit name.
 * Hand-drawn two-tone SVG (maroon line + saffron accent, same recipe as the
 * Diya logo) — never AI-generated raster imagery, and no deity depictions
 * (etiquette: objects and gestures only).
 */
import type { ReactNode } from "react";

const SAFFRON = "#F0A030";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* Sankalpa — joined palms, words rising */
const hands = (
  <Svg>
    <path d="M24 10c-4.2 5.2-6.4 10.8-6.4 16.1 0 6.4 2.6 10.9 6.4 12.7 3.8-1.8 6.4-6.3 6.4-12.7C30.4 20.8 28.2 15.2 24 10z" />
    <path d="M24 17v13.5" strokeWidth={1.5} />
    <path d="M12.5 14 9.5 11M35.5 14l3-3M24 6.5v-4" stroke={SAFFRON} />
  </Svg>
);

/* Invocation — ॐ */
const om = (
  <span className="font-scrip text-[26px] leading-none" aria-hidden>
    ॐ
  </span>
);

/* Kalash — pot, mango leaves, coconut */
const kalash = (
  <Svg>
    <circle cx="24" cy="13" r="4.2" fill={SAFFRON} />
    <path d="M17.5 22 12.5 14.5M30.5 22l5-7.5M20.5 22l-2.6-9M27.5 22l2.6-9" strokeWidth={1.7} />
    <path d="M13.5 22h21" />
    <path d="M15.2 22c-1.9 2.6-2.9 5.3-2.9 7.9 0 6.6 5.2 11.6 11.7 11.6s11.7-5 11.7-11.6c0-2.6-1-5.3-2.9-7.9" />
  </Svg>
);

/* Abhishekam / Snana — lota pouring, water falling */
const pouring = (
  <Svg>
    <path d="M10.8 14.9l15.8-4.8a5.8 5.8 0 0 1 3.4 9.4L19.4 29.8 10.8 14.9z" />
    <path d="M31.5 27.5v.02M35.5 33.5v.02M28.5 36.5v.02" stroke={SAFFRON} strokeWidth={4.5} />
    <path d="M17 43c2.3-1.8 4.7-1.8 7 0s4.7 1.8 7 0" strokeWidth={1.7} />
  </Svg>
);

/* Katha — open book with bookmark */
const book = (
  <Svg>
    <path d="M24 12.5c-3.6-2.4-8.3-3.4-14.2-2.9v27c5.9-.5 10.6.5 14.2 2.9 3.6-2.4 8.3-3.4 14.2-2.9v-27c-5.9-.5-10.6.5-14.2 2.9z" />
    <path d="M24 12.5v27" strokeWidth={1.5} />
    <path d="M14 18.5c2.9-.2 5.3.1 7 .9M14 23.5c2.9-.2 5.3.1 7 .9M34 18.5c-2.9-.2-5.3.1-7 .9M34 23.5c-2.9-.2-5.3.1-7 .9" strokeWidth={1.4} />
    <path d="M29.5 10.7v8l2.75-2.2L35 18.7v-8.4" fill={SAFFRON} stroke="none" />
  </Svg>
);

/* Prasad / Naivedya — bowl of sheera, steam */
const bowl = (
  <Svg>
    <path d="M15.5 25c1.5-4.2 4.6-6.6 8.5-6.6s7 2.4 8.5 6.6z" fill={SAFFRON} />
    <path d="M11 25h26c0 6.6-5.8 11-13 11s-13-4.4-13-11z" />
    <path d="M19.5 11c-1.2 1.6-1.2 3.2 0 4.8M28.5 11c-1.2 1.6-1.2 3.2 0 4.8M24 8c-1.2 1.6-1.2 3.2 0 4.8" strokeWidth={1.5} />
  </Svg>
);

/* Dwara — doorway with toran garland */
const door = (
  <Svg>
    <path d="M12 41V21.5C12 14.6 17.4 9 24 9s12 5.6 12 12.5V41" />
    <path d="M8 41h32" />
    <path d="M14 22c1.7 2.7 3.5 2.7 5.2 0s3.5-2.7 5.1 0 3.5 2.7 5.2 0 3.5-2.7 4.5 0" strokeWidth={1.5} />
    <circle cx="19.2" cy="26" r="1.7" fill={SAFFRON} stroke="none" />
    <circle cx="29.3" cy="26" r="1.7" fill={SAFFRON} stroke="none" />
  </Svg>
);

/* Vastu — house, morning sun */
const house = (
  <Svg>
    <path d="M8.5 25 24 11l15.5 14" />
    <path d="M13 22V41h22V22" />
    <path d="M21 41v-8c0-1.8 1.3-3.1 3-3.1s3 1.3 3 3.1v8" />
    <circle cx="40" cy="10" r="3.4" fill={SAFFRON} stroke="none" />
  </Svg>
);

/* Navagraha — nine planets, Surya at centre */
const nineDots = (
  <Svg>
    {[
      [13, 13], [24, 13], [35, 13],
      [13, 24], [35, 24],
      [13, 35], [24, 35], [35, 35],
    ].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="2.8" strokeWidth={1.7} />
    ))}
    <circle cx="24" cy="24" r="4.4" fill={SAFFRON} />
  </Svg>
);

/* Milk-boiling — pot overflowing on a flame */
const overflow = (
  <Svg>
    <path d="M12.5 20h23" />
    <path d="M14 20c0 9.5 4 16 10 16s10-6.5 10-16" />
    <path d="M15.2 16c1.9-2 3.9-2 5.8 0s3.9 2 5.9 0 3.9-2 5.9 0" strokeWidth={1.7} />
    <path d="M13.5 20c-1 2-1.5 3.7-1.5 5.2M34.5 20c1 2 1.5 3.7 1.5 5.2" strokeWidth={1.5} />
    <path d="M24 38.5c1.7 1.8 2.9 3.1 2.9 4.7a2.9 2.9 0 1 1-5.8 0c0-1.6 1.2-2.9 2.9-4.7z" fill={SAFFRON} stroke="none" />
  </Svg>
);

/* Havan — fire in the kund */
const fire = (
  <Svg>
    <path d="M24 10c2.8 3.6 6 6.7 6 10.5a6 6 0 1 1-12 0c0-1.8.6-3.5 1.7-5.1.8 1.4 1.9 2.3 2.7 2.6-.3-2.7.3-5.6 1.6-8z" fill={SAFFRON} />
    <path d="M11.5 32.5h25" />
    <path d="M13.5 32.5 17 42h14l3.5-9.5" />
  </Svg>
);

/* Chandan & Akshat — tilak strokes over the paste bowl, rice grains */
const chandan = (
  <Svg>
    <path d="M18 21.5c-.5-3.6.2-7 2-10M24 21V10.5M30 21.5c.5-3.6-.2-7-2-10" strokeWidth={1.7} />
    <path d="M14 28h20c0 5.2-4.5 8.6-10 8.6S14 33.2 14 28z" />
    <circle cx="11" cy="20" r="1.7" fill={SAFFRON} stroke="none" />
    <circle cx="37" cy="20" r="1.7" fill={SAFFRON} stroke="none" />
  </Svg>
);

/* Pushpanjali — blossom and durva */
const flower = (
  <Svg>
    <circle cx="24" cy="20" r="3.2" fill={SAFFRON} />
    {[0, 72, 144, 216, 288].map((a) => {
      const r = ((a - 90) * Math.PI) / 180;
      return (
        <circle key={a} cx={24 + 8.6 * Math.cos(r)} cy={20 + 8.6 * Math.sin(r)} r="4.4" strokeWidth={1.7} />
      );
    })}
    <path d="M17 42c1-4.5 3.2-7.3 7-9.2M31 42c-1-4.5-3.2-7.3-7-9.2" strokeWidth={1.5} />
  </Svg>
);

/* Jaap — rudraksha mala with guru bead */
const mala = (
  <Svg>
    <circle cx="24" cy="21" r="13" strokeDasharray="0.1 6.75" strokeWidth={4} />
    <circle cx="24" cy="37" r="3" fill={SAFFRON} />
    <path d="M24 40v4.5M20.8 40l-1.6 4M27.2 40l1.6 4" strokeWidth={1.4} />
  </Svg>
);

/* Purification — water */
const drops = (
  <Svg>
    <path d="M24 7c3.8 5 6.2 8.7 6.2 12.3a6.2 6.2 0 1 1-12.4 0C17.8 15.7 20.2 12 24 7z" />
    <circle cx="12.5" cy="26" r="2" fill={SAFFRON} stroke="none" />
    <circle cx="35.5" cy="26" r="2" fill={SAFFRON} stroke="none" />
    <path d="M12 38.5c2.7-2.6 5.3-2.6 8 0s5.3 2.6 8 0 5.3-2.6 8 0" strokeWidth={1.7} />
  </Svg>
);

/* Aarti — diya on the thali */
const aarti = (
  <Svg>
    <path d="M24 27.5c1.6-1.8 2.3-3.2 2.3-4.6 0-1.6-1-3.1-2.3-4.2-1.3 1.1-2.3 2.6-2.3 4.2 0 1.4.7 2.8 2.3 4.6z" fill={SAFFRON} strokeWidth={1.5} />
    <path d="M17.5 30.5h13c0 3.1-2.9 5.2-6.5 5.2s-6.5-2.1-6.5-5.2z" />
    <ellipse cx="24" cy="39.5" rx="14" ry="3.6" />
    <path d="M33 23c-1.3-1.6-1.3-3.2 0-4.8" strokeWidth={1.4} />
    <circle cx="14.5" cy="38" r="1.5" fill={SAFFRON} stroke="none" />
  </Svg>
);

/** Ordered patterns — first match wins. */
const RULES: [RegExp, ReactNode][] = [
  [/sankalpa/i, hands],
  [/kalash/i, kalash],
  [/abhishek|snana/i, pouring],
  [/katha/i, book],
  [/prasad|naivedya/i, bowl],
  [/dwara/i, door],
  [/vastu/i, house],
  [/navagraha/i, nineDots],
  [/milk/i, overflow],
  [/havan|purnahuti/i, fire],
  [/chandan|akshat/i, chandan],
  [/pushpanjali/i, flower],
  [/jaap/i, mala],
  [/purification/i, drops],
  [/aarti|diya/i, aarti],
  [/ganesh|avahana|sthapana/i, om],
];

export default function StepIcon({ name }: { name: string }) {
  const icon = RULES.find(([re]) => re.test(name))?.[1] ?? aarti;
  return (
    <span className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-cardwarm text-maroon">
      {icon}
    </span>
  );
}
