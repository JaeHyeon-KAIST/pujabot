// Generates static neighborhood maps from OSM tiles for the checklist screen.
// Run: node gen-maps.mjs <webRoot>
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";

const webRoot = process.argv[2];
const vendors = JSON.parse(await readFile(path.join(webRoot, "data/vendors.json"), "utf8"));

const W = 640, H = 360, TILE = 256;
const CITIES = {
  bengaluru: { zoom: 14, home: { lat: 12.9279, lng: 77.6271 }, pinCount: 2 },
  delhi: { zoom: 15, home: { lat: 28.567, lng: 77.2355 }, pinCount: 2 },
};

const UA = "PujaBot-hackathon-prototype/1.0 (student project; jdltogether@gmail.com)";

function worldPx(lat, lng, zoom) {
  const scale = TILE * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const rad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale;
  return { x, y };
}

const out = {};
for (const [city, cfg] of Object.entries(CITIES)) {
  const pins = vendors[city].slice(0, cfg.pinCount);
  const pts = [...pins, cfg.home].map((p) => worldPx(p.lat, p.lng, cfg.zoom));
  const cx = (Math.min(...pts.map((p) => p.x)) + Math.max(...pts.map((p) => p.x))) / 2;
  const cy = (Math.min(...pts.map((p) => p.y)) + Math.max(...pts.map((p) => p.y))) / 2;
  const originX = cx - W / 2, originY = cy - H / 2;

  // tiles covering the canvas
  const tiles = [];
  const dir = path.join(webRoot, "public/maps", city);
  await mkdir(dir, { recursive: true });
  for (let tx = Math.floor(originX / TILE); tx * TILE < originX + W; tx++) {
    for (let ty = Math.floor(originY / TILE); ty * TILE < originY + H; ty++) {
      const file = `${cfg.zoom}-${tx}-${ty}.png`;
      const fp = path.join(dir, file);
      const exists = await access(fp).then(() => true, () => false);
      if (!exists) {
        const url = `https://tile.openstreetmap.org/${cfg.zoom}/${tx}/${ty}.png`;
        const res = await fetch(url, { headers: { "User-Agent": UA } });
        if (!res.ok) throw new Error(`${url} -> ${res.status}`);
        await writeFile(fp, Buffer.from(await res.arrayBuffer()));
        await new Promise((r) => setTimeout(r, 300));
      }
      tiles.push({
        src: `/maps/${city}/${file}`,
        left: +(((tx * TILE - originX) / W) * 100).toFixed(3),
        top: +(((ty * TILE - originY) / H) * 100).toFixed(3),
      });
    }
  }

  const pct = (p) => {
    const { x, y } = worldPx(p.lat, p.lng, cfg.zoom);
    return { xPct: +(((x - originX) / W) * 100).toFixed(2), yPct: +(((y - originY) / H) * 100).toFixed(2) };
  };
  out[city] = {
    width: W,
    height: H,
    tileWPct: +((TILE / W) * 100).toFixed(3),
    tileHPct: +((TILE / H) * 100).toFixed(3),
    tiles,
    pins: pins.map((v) => ({ name: v.name, ...pct(v) })),
    home: pct(cfg.home),
  };
  console.log(city, "tiles:", tiles.length, "pins:", JSON.stringify(out[city].pins));
}

await writeFile(path.join(webRoot, "data/maps.json"), JSON.stringify(out, null, 2) + "\n");
console.log("wrote data/maps.json");
