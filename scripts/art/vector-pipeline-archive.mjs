import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("public/assets");
await fs.mkdir(path.join(root, "sources"), { recursive: true });
const manifest = [];
const wrap = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const defs = `<defs>
 <linearGradient id="steel" x2=".7" y2="1"><stop stop-color="#c7d7cd"/><stop offset=".38" stop-color="#526d77"/><stop offset="1" stop-color="#172531"/></linearGradient>
 <linearGradient id="gold" x2=".5" y2="1"><stop stop-color="#ffe1a0"/><stop offset=".45" stop-color="#b18d4e"/><stop offset="1" stop-color="#594027"/></linearGradient>
 <linearGradient id="cape" x2="1" y2="1"><stop stop-color="#e79a79"/><stop offset=".35" stop-color="#994e50"/><stop offset="1" stop-color="#402e45"/></linearGradient>
 <linearGradient id="ghost" x2=".3" y2="1"><stop stop-color="#d2fff5"/><stop offset=".4" stop-color="#519d9a"/><stop offset="1" stop-color="#153b54" stop-opacity=".2"/></linearGradient>
 <radialGradient id="glow"><stop stop-color="#a0ffe6" stop-opacity=".8"/><stop offset="1" stop-color="#53dfcc" stop-opacity="0"/></radialGradient>
 <linearGradient id="stone" x2=".9" y2="1"><stop stop-color="#586163"/><stop offset=".5" stop-color="#29383e"/><stop offset="1" stop-color="#15262d"/></linearGradient>
</defs>`;

function eira(state, f, count, dir, weapon = "blade") {
  const t = (f / count) * Math.PI * 2,
    run = state === "run" || state === "walk",
    attack = state.startsWith("attack") || state === "charged",
    dash = state === "dash",
    death = state === "death";
  const dx = Math.cos((dir * Math.PI) / 4) - Math.sin((dir * Math.PI) / 4),
    dy = Math.cos((dir * Math.PI) / 4) + Math.sin((dir * Math.PI) / 4);
  const front = dy > -0.01,
    flip = dx >= 0 ? 1 : -1,
    side = 0.82 + (Math.abs(dx) / Math.SQRT2) * 0.18,
    bob = run ? Math.sin(t * 2) * 1.8 : Math.sin(t) * 0.8;
  const step = run ? Math.sin(t) * 6 : 0,
    wind = run || dash ? 8 : 2,
    swing = attack ? -95 + (f / (count - 1)) * 240 : 18,
    lean = dash ? 14 : run ? 4 : 0;
  return `<g transform="translate(48 77) scale(${flip * side} 1)" opacity="${death ? 1 - f / (count + 2) : 1}">
 <ellipse cy="1" rx="17" ry="5" fill="#050e17" opacity=".45"/>
 <g transform="translate(${lean} ${bob}) rotate(${death ? f * 6 : state === "hurt" ? -8 : 0})">
 <path d="M-12-45 Q-26-30 ${-20 - wind}-4 L-8-11 -15 1 4-11 12-37Z" fill="url(#cape)" stroke="#302235" stroke-width="1.4"/>
 <path d="M-11-37 Q-25-20 ${-18 - wind}-7 M-7-36 Q-11-19 -13-9" fill="none" stroke="#e29a7d" opacity=".5"/>
 <path d="M-8-22 L${-9 + step}-5 ${-15 + step}-2 ${-4 + step}0 -1-20 M4-23 L${7 - step}-6 ${4 - step}-2 ${15 - step}0 13-7 10-25" fill="#233c47" stroke="#101c29" stroke-width="2"/>
 <path d="M-10-29 L-13-22 10-19 14-28" fill="url(#gold)"/>
 <path d="M-12-44 Q-3-51 11-44 L13-27 Q1-23 -11-29Z" fill="url(#steel)" stroke="#11222e" stroke-width="1.8"/>
 <path d="M-3-45 L-3-30 M3-45 4-30 M-10-39 10-35" stroke="#e6c28c" opacity=".7" fill="none"/>
 <path d="M-15-44 Q-23-42 -15-29 L-10-30 -10-42Z" fill="url(#gold)" stroke="#654b34"/>
 <g transform="translate(9 -40) rotate(${swing})"><path d="M0 0 L7 13" stroke="#273d49" stroke-width="7" stroke-linecap="round"/><path d="M6 10 L11 17" stroke="#e6c7a3" stroke-width="5"/>
 ${weapon === "hammer" ? '<path d="M11 13 11 46" stroke="url(#gold)" stroke-width="4"/><path d="M-2 36 23 34 27 50 14 56 -1 50Z" fill="url(#steel)" stroke="url(#gold)" stroke-width="2"/><path d="M3 39 21 38 23 47 7 49Z" fill="#b38259"/><path d="M12 39 17 43 12 48 7 44Z" fill="#ffdd9b"/>' : weapon === "bow" ? '<path d="M10 4 Q-15 31 12 59 M10 4 15 32 12 59" fill="none" stroke="url(#gold)" stroke-width="2.5"/><path d="M-5 30 31 30 37 27 34 34 31 30" fill="#b7fff0" stroke="#a6e7d6" stroke-width="1.5"/>' : '<path d="M4 20 18 15" stroke="url(#gold)" stroke-width="3"/><path d="M11 17 8 49 12 57 16 47 13 17Z" fill="#b7fff0" stroke="#438c8e"/><path d="M12 20 12 49" stroke="white" opacity=".8"/>'}</g>
 <path d="M-7-49 L-7-43 Q0-39 6-45 L5-51" fill="#b68d7b"/>
 <path d="M-10-59 Q1-68 10-57 L7-47 Q2-43 -6-49Z" fill="#e8c9ab" stroke="#413a42"/>
 ${front ? '<path d="M2-54 6-54" stroke="#21353d" stroke-width="1.5"/><path d="M4-49 7-49" stroke="#9c6d68"/>' : ""}
 <path d="M-12-51 Q-18-66 -3-69 Q14-69 13-55 L7-60 1-58 -4-61 -5-49 -12-44Z" fill="#d3d8c8" stroke="#7a9096" stroke-width="1"/>
 <path d="M-7-64 Q-17-49 ${-21 - wind * 0.4}-43 L-12-45 Q-5-51 -6-59" fill="#bac9bf"/><path d="M-8-66 4-65" stroke="#f6ebc7"/>
 <circle cy="-37" r="8" fill="url(#glow)"/><path d="M0-43 4-37 0-31 -4-37Z" fill="#a9ffee" stroke="#faf0ae"/>
 <path d="M-13-44 0-48 10-44" fill="none" stroke="url(#gold)" stroke-width="2"/>
 ${!front ? '<path d="M-11-57 Q-10-68 3-67 Q17-65 11-49 L6-42 -6-45Z" fill="#bdcfc1" stroke="#8ea5a3"/><path d="M-10-44 Q0-48 11-42 L12-21 2-12 -11-29Z" fill="url(#cape)" stroke="#60414b"/><path d="M-3-40 1-33 5-40 M1-33 1-21" fill="none" stroke="url(#gold)"/>' : ""}
 ${state === "resurrect" ? `<ellipse cy="-26" rx="${10 + f * 2}" ry="${30 - f}" fill="none" stroke="#bcffdd" opacity=".5"/>` : ""}
 </g></g>`;
}
function enemy(kind, state, f, count, dir) {
  const t = (f / count) * 6.283,
    bob = Math.sin(t) * 2,
    m = state === "move" ? Math.sin(t) * 5 : 0,
    atk = state === "attack" ? Math.sin((f / (count - 1)) * Math.PI) : 0,
    dying = state === "death";
  const cloak =
    kind === "summoner" ? "#705788" : kind === "wraith" ? "#589ca3" : "#8a5c6b";
  let body = "";
  if (kind === "hound")
    body = `<path d="M-22-14 -17-31 5-35 22-24 26-11 15-14 3-22 -12-14Z" fill="url(#steel)" stroke="#152733" stroke-width="2"/><path d="M-16-22 -24-3 -19-1 -8-19 M9-24 ${18 + m}-4 24-2 17-23" stroke="#75898b" stroke-width="5"/><path d="M12-30 15-42 20-34 26-35 30-24 22-19Z" fill="#acc0a8"/><path d="M19-30 24-28" stroke="#a3ffe3" stroke-width="3"/><path d="M-20-27 -35-35 -26-19" fill="#437876"/>`;
  else if (kind === "automaton")
    body = `<path d="M-12-17 -19 0 -9-2 -3-14 M10-17 20 0 11-1 3-14" fill="url(#gold)" stroke="#4e3c2e" stroke-width="2"/><path d="M-19-40 -14-16 15-16 20-40 11-49 -12-48Z" fill="url(#steel)" stroke="#172c36" stroke-width="2"/><circle cy="-32" r="12" fill="#b17347" stroke="#f8b96c" stroke-width="2"/><circle cy="-32" r="6" fill="#ffca7d"/><path d="M-13-45 -9-55 7-55 13-45" fill="url(#gold)"/><path d="M-19-37 -27-27 -22-15 M20-37 28-25 24-13" fill="none" stroke="#9a8b66" stroke-width="6"/>`;
  else if (kind === "wraith" || kind === "summoner")
    body = `<path d="M-9-49 Q0-61 12-49 L18-16 29-4 10-9 7 2 0-8 -13-2 -11-13 -22-7 -14-33Z" fill="url(#ghost)" stroke="${cloak}" stroke-width="1.5"/><path d="M-11-48 Q-1-65 12-49 L16-38 5-44 -9-37Z" fill="${cloak}"/><path d="M-7-49 8-49 5-37 -3-37Z" fill="#152c3b"/><path d="M-4-44 4-44" stroke="#caffed" stroke-width="2"/><path d="M-14-31 -27-23 -32-29 M13-31 26-24 30-31" fill="none" stroke="${cloak}" stroke-width="7"/><circle cx="30" cy="${-37 - atk * 15}" r="7" fill="#d3adff" opacity=".8"/>${kind === "summoner" ? '<path d="M-30-8 -27-61 -22-66 -18-60 -24-54" fill="none" stroke="url(#gold)" stroke-width="3"/><circle cx="-24" cy="-62" r="5" fill="#c3a1ff"/>' : ""}`;
  else {
    const heavy = kind === "guardian" || kind === "elite";
    body = `<path d="M-9-24 ${-13 + m}-3 -5 0 0-22 M6-23 ${9 - m}-3 18 0 13-24" fill="#1d2d37" stroke="#617b7f" stroke-width="3"/>
 <path d="M-12-46 -19-9 -3-15 10-5 17-43Z" fill="${cloak}"/>
 <path d="M-${heavy ? 19 : 12}-45 -12-23 13-23 ${heavy ? 21 : 14}-45 0-51Z" fill="url(#steel)" stroke="#202e37" stroke-width="2"/>
 <path d="M-17-44 -5-38 0-48 5-38 18-44 M-11-28 11-28" fill="none" stroke="url(#gold)" stroke-width="2"/>
 <path d="M-10-57 0-64 11-56 8-44 -7-44Z" fill="url(#steel)" stroke="#162a31"/><path d="M-6-52 7-52" stroke="${kind === "elite" ? "#ff827b" : "#b9fff0"}" stroke-width="2"/>
 <path d="M0-64 0-71 7-64 4-56" fill="url(#gold)"/>
 ${kind === "guardian" ? '<path d="M-13-40 -31-43 -36-18 -23-9 -12-22Z" fill="url(#steel)" stroke="url(#gold)" stroke-width="3"/><path d="M-24-36 -25-18" stroke="#e0b96f" stroke-width="2"/>' : kind === "archer" ? `<path d="M18-54 Q${39 + atk * 10}-28 17-6 M18-54 22-28 17-6" fill="none" stroke="url(#gold)" stroke-width="2.5"/><path d="M5-31 34-31" stroke="#beffee" stroke-width="2"/>` : `<g transform="translate(16 -36) rotate(${-20 + atk * 135})"><path d="M0 0 3 15" stroke="#7a9298" stroke-width="6"/><path d="M-2 13 12 13 M5 15 5 48" stroke="url(#gold)" stroke-width="3"/><path d="M4 16 1 47 5 56 9 46 6 16Z" fill="#a2d8d5"/></g>`}`;
  }
  const dx = Math.cos((dir * Math.PI) / 4) - Math.sin((dir * Math.PI) / 4),
    dy = Math.cos((dir * Math.PI) / 4) + Math.sin((dir * Math.PI) / 4),
    scale = (dx >= 0 ? 1 : -1) * (0.82 + (Math.abs(dx) / Math.SQRT2) * 0.18);
  return `<g transform="translate(48 ${77 + bob}) scale(${scale} 1)" opacity="${dying ? Math.max(0, 1 - f / (count - 1)) : 1}"><ellipse cy="2" rx="${kind === "hound" ? 24 : 18}" ry="5" fill="#030c12" opacity=".4"/><g transform="rotate(${dying ? f * 9 : 0}) translate(0 ${state === "hurt" ? 3 : 0})">${body}${dy < -0.01 && kind !== "hound" && kind !== "automaton" ? `<path d="M-11-57 Q0-67 11-56 L10-44 17-15 0-9 -17-17 -10-45Z" fill="${cloak}" stroke="#7b8d91"/><path d="M-2-50 0-22" stroke="#b6b895" opacity=".35"/>` : ""}</g></g>`;
}
function boss(kind, state, f, count) {
  const t = (f / count) * 6.283,
    a = state === "attack" ? Math.sin((f / (count - 1)) * Math.PI) : 0;
  let b = "";
  if (kind === 0)
    b = `<path d="M-42-46 -51-8 -41-5 -31-42 M-12-43 -17-4 -7-4 0-44 M17-46 26-7 36-4 29-51" fill="url(#ghost)" stroke="#9fe5dc" stroke-width="2"/><path d="M-48-52 Q-40-88 -3-76 L30-67 48-94 60-88 43-43 20-35 -24-36Z" fill="url(#ghost)" stroke="#87d1c9" stroke-width="2"/><path d="M41-91 38-118 23-139 M37-117 15-119 4-133 M36-121 37-145 28-157 M46-93 65-125 78-137 M65-125 61-145 68-156 M66-122 86-120 97-133" fill="none" stroke="#bdf9e9" stroke-width="4"/><path d="M42-90 53-103 65-91 56-75 40-72Z" fill="#c5eee0" stroke="#669f9f"/><path d="M48-87 55-87" stroke="#efffe4" stroke-width="3"/><path d="M-17-63 -4-79 7-62 -3-45Z" fill="#ccfff0" stroke="#e1d0a1" stroke-width="2"/><circle cx="-4" cy="-62" r="25" fill="url(#glow)"/>`;
  else if (kind === 1)
    b = `<path d="M-30-48 -35-7 -13-3 -5-48 M9-48 11-5 36-3 30-50" fill="url(#steel)" stroke="url(#gold)" stroke-width="5"/><path d="M-42-105 -32-44 33-44 45-104 0-122Z" fill="url(#steel)" stroke="#a7754e" stroke-width="5"/><path d="M-25-103 0-81 25-103 0-55Z" fill="#6e3731" stroke="#f3b66d" stroke-width="3"/><path d="M-20-134 0-148 24-131 17-107 -18-108Z" fill="url(#gold)"/><path d="M-12-123 14-123" stroke="#ffb267" stroke-width="5"/><g transform="rotate(${a * 70})"><path d="M40-101 60-55 76-24" fill="none" stroke="#846c58" stroke-width="15"/><path d="M51-52 91-54 97-27 63-14Z" fill="url(#gold)" stroke="#efd799" stroke-width="3"/></g><path d="M-39-99 -58-65 -46-42" fill="none" stroke="url(#steel)" stroke-width="18"/>`;
  else if (kind === 2)
    b = `<path d="M-29-105 Q-65-66 -49-14 L-31-26 -24-4 -5-20 15-5 20-26 46-15 Q28-54 26-104Z" fill="url(#ghost)" stroke="#a4b9df" stroke-width="2"/><path d="M-23-119 1-137 25-116 12-92 -13-91Z" fill="#303956" stroke="#d1d7e9" stroke-width="3"/><path d="M-9-112 13-112" stroke="#cae8ff" stroke-width="3"/><path d="M-27-100 -68-78 -83-88 M25-100 62-73 82-89" fill="none" stroke="#7c91b9" stroke-width="11"/>${Array.from(
      { length: 9 },
      (_, i) => {
        const x = Math.cos(i * 0.7 + t) * 72,
          y = -65 + Math.sin(i * 0.7 + t) * 38;
        return `<g transform="translate(${x} ${y}) rotate(${i * 30})"><path d="M-10-8 2-5 12-10 12 9 1 13 -11 8Z" fill="#c7cfc3" stroke="#59667f"/><path d="M1-4 1 12 M-8-3 -2-1 M4-1 9-3" stroke="#71829c"/></g>`;
      },
    ).join("")}`;
  else
    b = `<ellipse cy="-89" rx="53" ry="65" fill="none" stroke="url(#gold)" stroke-width="3"/><path d="M-22-114 -41-10 -23-24 -9-4 9-21 37-9 24-116Z" fill="#272331" stroke="#e2be7d" stroke-width="3"/><path d="M-9-112 -7-35 12-24 8-114" fill="#923b4c"/><path d="M-16-128 -9-143 2-138 12-148 21-128 10-111 -9-112Z" fill="#141e2a" stroke="url(#gold)" stroke-width="3"/><path d="M-7-126 12-126" stroke="#ffd7a6" stroke-width="2"/><path d="M-21-105 -53-75 -68-91 M23-105 55-77 70-94" fill="none" stroke="#c3aa89" stroke-width="9"/><path d="M-27-106 -45-115 -36-89 M25-107 43-115 35-88" fill="url(#gold)"/><circle cy="-83" r="11" fill="#ffe5b0"/><circle cy="-83" r="22" fill="url(#glow)"/>`;
  return `<g transform="translate(96 ${179 + Math.sin(t) * 2})" opacity="${state === "death" ? 1 - f / count : 1}"><ellipse rx="52" ry="12" fill="#02060e" opacity=".5"/><g transform="translate(${a * 8} ${a * 5})">${b}</g></g>`;
}

async function atlas(name, size, entries, cols = 16) {
  const rows = Math.ceil(entries.length / cols),
    w = cols * size,
    h = rows * size;
  const frames = {};
  let body = defs;
  for (let i = 0; i < entries.length; i++) {
    const [key, art] = entries[i],
      x = (i % cols) * size,
      y = Math.floor(i / cols) * size;
    body += `<g transform="translate(${x} ${y})">${art}</g>`;
    frames[key] = {
      frame: { x, y, w: size, h: size },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: size, h: size },
      sourceSize: { w: size, h: size },
      pivot: { x: 0.5, y: 0.8 },
    };
  }
  const svg = wrap(w, h, body);
  await fs.writeFile(path.join(root, "sources", `${name}.svg`), svg);
  // Rasterize small, clipped frames: avoids librsvg rendering every gradient against
  // a multi-megapixel surface and also guarantees no neighbouring-frame bleed.
  const tiles = [];
  for (let offset = 0; offset < entries.length; offset += 8) {
    const batch = await Promise.all(
      entries.slice(offset, offset + 8).map(async ([, art], i) => ({
        input: await sharp(Buffer.from(wrap(size, size, defs + art)))
          .png({ compressionLevel: 1 })
          .toBuffer(),
        left: ((offset + i) % cols) * size,
        top: Math.floor((offset + i) / cols) * size,
      })),
    );
    tiles.push(...batch);
  }
  await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(tiles)
    .png()
    .toFile(path.join(root, `${name}.png`));
  await fs.writeFile(
    path.join(root, `${name}.json`),
    JSON.stringify({
      frames,
      meta: {
        app: "Véspera original SVG pipeline",
        version: "1",
        image: `${name}.png`,
        size: { w, h },
        scale: "1",
      },
    }),
  );
  manifest.push({
    name,
    category: name.startsWith("tiles") ? "tileset" : "atlas",
    image: `${name}.png`,
    metadata: `${name}.json`,
    width: w,
    height: h,
    frames: entries.length,
    source: `sources/${name}.svg`,
    method: "Original articulated SVG parts → sharp PNG",
    animations: [...new Set(entries.map((x) => x[0].split("/")[0]))],
  });
  console.log(`${name}: ${entries.length} frames, ${w}×${h}`);
}
const actions = {
  idle: 8,
  walk: 8,
  run: 8,
  dash: 6,
  attack1: 6,
  attack2: 8,
  attack3: 10,
  charged: 12,
  hurt: 4,
  death: 12,
  resurrect: 12,
  interact: 6,
};
for (const weapon of ["blade", "hammer", "bow"]) {
  const e = [];
  for (const [state, n] of Object.entries(actions))
    for (let d = 0; d < 8; d++)
      for (let f = 0; f < n; f++)
        e.push([`${state}/${d}/${f}`, eira(state, f, n, d, weapon)]);
  await atlas(
    weapon === "blade" ? "eira" : `eira-${weapon}`,
    128,
    e.map(([k, s]) => [
      k,
      `<g transform="translate(18.4 29.6) scale(.95)">${s}</g>`,
    ]),
    32,
  );
}
for (const kind of [
  "swordsman",
  "archer",
  "guardian",
  "hound",
  "summoner",
  "automaton",
  "wraith",
  "elite",
]) {
  const entries = [];
  for (const state of ["idle", "move", "attack", "hurt", "death"])
    for (let d = 0; d < 8; d++)
      for (let f = 0; f < 6; f++)
        entries.push([`${state}/${d}/${f}`, enemy(kind, state, f, 6, d)]);
  await atlas(
    kind,
    128,
    entries.map(([k, s]) => [
      k,
      `<g transform="translate(18.4 29.6) scale(.95)">${s}</g>`,
    ]),
  );
}
for (let b = 0; b < 4; b++) {
  const entries = [];
  for (const state of [
    "idle",
    "move",
    "attack",
    "hurt",
    "death",
    "charge",
    "phase",
  ])
    for (let f = 0; f < 8; f++)
      entries.push([
        `${state}/0/${f}`,
        boss(b, state === "charge" ? "attack" : state, f, 8),
      ]);
  await atlas(`boss${b}`, 192, entries, 8);
}

const palettes = [
  ["#213d3e", "#1c3136", "#55726b", "#74b6a0"],
  ["#3e3030", "#2b252b", "#7c6253", "#d8995b"],
  ["#2e334b", "#23293f", "#606b8b", "#a7a8da"],
  ["#3e3942", "#262631", "#837666", "#d9bd83"],
];
for (let b = 0; b < 4; b++) {
  const [top, side, line, glow] = palettes[b];
  const entries = [];
  for (let n = 0; n < 12; n++) {
    let art = `<path d="M1 29 48 5 95 29 95 35 48 59 1 35Z" fill="${side}" stroke="#0c1822"/><path d="M1 29 48 5 95 29 48 53Z" fill="${top}" stroke="${line}" stroke-opacity=".35"/>`;
    for (let k = 0; k < 8; k++) {
      const x = 16 + ((k * 17 + n * 13) % 64),
        y = 20 + ((k * 7 + n * 5) % 17);
      art += `<path d="M${x} ${y} l${5 + (k % 3)} -2" stroke="${line}" stroke-opacity=".17"/>`;
    }
    if (n < 4)
      art += `<path d="M10 29 48 10 86 29 48 48Z M25 29 48 17 71 29 48 41Z" fill="none" stroke="${line}" stroke-opacity="${n === 0 ? 0.3 : 0.15}"/>`;
    if (n >= 4 && n < 8)
      art += `<path d="M${20 + n} 17 42 28 37 33 60 45 M42 28 62 23 73 25" fill="none" stroke="#0c1b24" stroke-width="1.3"/><path d="M10 30 21 26 28 30 18 35Z M65 22 75 23 81 28 72 30Z" fill="${glow}" opacity=".12"/>`;
    if (n >= 8)
      art += `<path d="M3 29 Q26 14 48 7 Q57 19 93 29 L48 51Z" fill="${glow}" opacity=".15"/><path d="M12 30 Q35 18 49 22 T82 28 M22 36 Q42 27 65 34" fill="none" stroke="${glow}" stroke-width="1" opacity=".3"/>`;
    entries.push([`floor/${n}`, `<g transform="translate(0 30)">${art}</g>`]);
  }
  await atlas(`tiles${b}`, 96, entries, 4);
}
function prop(kind, n = 0) {
  let art = "";
  if (kind === "column")
    art = `<path d="M32 166 65 148 99 165 67 183Z" fill="#142b31" stroke="#52676b"/><path d="M40 157 40 46 66 34 91 47 91 159 66 174Z" fill="url(#stone)" stroke="#647174"/><path d="M66 37 66 174 M48 48 48 155 M56 44 56 161 M76 45 76 162 M84 49 84 157" stroke="#a2a791" stroke-opacity=".25"/><path d="M30 44 65 24 103 44 103 56 67 75 30 55Z" fill="url(#stone)" stroke="#819083"/><path d="M34 44 66 28 98 44 66 61Z" fill="#485e5c"/><path d="M39 144 65 158 91 145 M39 151 65 166 91 153 M49 87 55 108 51 123 M76 74 69 97 78 119" stroke="#adac87" stroke-opacity=".4" fill="none"/><path d="M40 147 Q31 126 45 100 Q53 89 46 60 M45 102 Q62 89 67 66" fill="none" stroke="#345f52" stroke-width="5"/>`;
  if (kind === "tree")
    art = `<path d="M62 164 33 180 48 162 16 165 44 154 Q62 125 51 99 Q38 85 24 91 L10 83 35 83 20 64 44 80 55 93 60 62 42 44 36 24 51 43 67 51 71 32 86 16 78 42 81 68 105 51 119 49 104 62 82 87 Q73 118 78 150 L105 167 77 162 89 179Z" fill="url(#stone)" stroke="#56645c" stroke-width="2"/><path d="M59 152 Q70 110 64 78 M70 75 75 48 M54 97 40 88" fill="none" stroke="#84927a" opacity=".5"/><path d="M19 80 Q37 72 44 79 L28 88Z M75 31 88 25 85 37Z M92 61 108 51 115 56 104 67Z" fill="#426f65"/><circle cx="40" cy="82" r="3" fill="#8adfc0"/><circle cx="85" cy="35" r="3" fill="#b4e3c0"/>`;
  if (kind === "crystal")
    art = `<ellipse cx="64" cy="169" rx="31" ry="13" fill="#132b32"/><path d="M43 166 35 139 43 119 53 139 56 168 M54 166 49 110 63 82 77 111 73 167 M73 166 78 126 88 112 94 138 88 163Z" fill="url(#ghost)" stroke="#78c5b6"/><path d="M63 86 65 160 75 111Z" fill="#b7f1d6" opacity=".5"/><ellipse cx="64" cy="148" rx="40" ry="32" fill="url(#glow)"/>`;
  if (kind === "urn")
    art = `<ellipse cx="64" cy="170" rx="20" ry="7" fill="#101f29"/><path d="M51 132 Q35 149 49 165 L76 166 Q89 149 75 132 L78 126 48 126Z" fill="url(#gold)" stroke="#605345"/><path d="M48 126 Q64 117 78 126 L75 132 51 132Z" fill="#314749"/><path d="M50 143 77 143 M48 149 80 149 M51 155 77 155" stroke="#e3bb7a" opacity=".6"/>`;
  if (kind === "rubble")
    art = `<path d="M22 167 36 150 51 149 61 164 79 153 105 167 85 181 52 175 38 179Z" fill="url(#stone)" stroke="#526968"/><path d="M36 151 42 168 23 167 M51 150 42 168 61 164 M79 154 87 168 104 167 M87 168 85 180 M42 168 38 178" fill="none" stroke="#8e9b84" stroke-opacity=".4"/>`;
  if (kind === "flower")
    art = `<path d="M58 169 Q43 140 58 118 M60 156 81 137 M55 147 37 131" fill="none" stroke="#3c766b" stroke-width="3"/><path d="M56 121 Q35 111 44 98 Q61 98 61 114 Q59 90 75 91 Q87 108 66 117 Q88 110 89 126 Q72 140 61 122 Q62 145 48 140 Q35 126 56 121Z" fill="${n ? "#e68d82" : "#92bdb2"}" stroke="#d9bda4"/><circle cx="61" cy="120" r="5" fill="#ffe2ab"/><ellipse cx="61" cy="120" rx="30" ry="29" fill="url(#glow)"/>`;
  if (kind === "mirror")
    art = `<path d="M48 172 53 142 75 141 82 172Z" fill="url(#stone)"/><ellipse cx="65" cy="120" rx="23" ry="35" fill="#274f5b" stroke="url(#gold)" stroke-width="5"/><path d="M51 129 75 98 M56 142 80 112" stroke="#c9ffed" opacity=".4" stroke-width="3"/>`;
  if (kind === "torch")
    art = `<path d="M52 174 55 123 47 118 48 108 79 108 81 119 72 124 76 174Z" fill="url(#stone)" stroke="#7f896e"/><path d="M49 108 63 117 80 108 M55 133 73 133" fill="none" stroke="url(#gold)" stroke-width="3"/><path d="M56 106 Q39 89 59 72 Q54 93 65 85 Q75 66 66 57 Q91 82 73 105Z" fill="#64cdbb"/><path d="M60 105 Q54 95 65 85 Q64 98 72 97 L69 108Z" fill="#ddffe3"/><ellipse cx="65" cy="93" rx="50" ry="57" fill="url(#glow)"/>`;
  if (kind === "obelisk")
    art = `<path d="M30 170 65 151 99 169 65 187Z" fill="url(#stone)" stroke="#b2a275"/><path d="M46 155 48 95 65 67 82 96 84 156 65 169Z" fill="url(#stone)" stroke="url(#gold)" stroke-width="2"/><path d="M65 73 65 164 M53 103 65 110 78 102 M53 115 65 122 78 114" fill="none" stroke="#7cd8c1" stroke-width="2"/><path d="M65 82 71 94 65 105 59 94Z" fill="#bbffdd"/><ellipse cx="65" cy="103" rx="36" ry="55" fill="url(#glow)"/>`;
  if (kind === "portal")
    art = `<path d="M22 176 Q-1 67 63 32 Q132 68 106 175 L93 172 Q114 85 64 52 Q15 84 34 171Z" fill="url(#stone)" stroke="url(#gold)" stroke-width="3"/><path d="M31 171 Q12 85 64 48 Q116 85 98 170" fill="#337675" fill-opacity=".2" stroke="#a2e3c3"/><ellipse cx="65" cy="120" rx="33" ry="59" fill="url(#glow)"/><path d="M42 146 Q80 160 84 117 Q68 82 48 103 Q36 119 64 132" fill="none" stroke="#95ead1" opacity=".7" stroke-width="2"/><path d="M64 67 70 79 64 91 58 79Z" fill="#fff0bb"/>`;
  if (kind === "gear")
    art = `<g transform="translate(64 125)"><circle r="45" fill="none" stroke="url(#gold)" stroke-width="10"/>${Array.from({ length: 12 }, (_, i) => `<path d="M-5-42 -7-55 7-55 5-42 M0-35 0-10" fill="url(#gold)" stroke="#7b694b" stroke-width="2" transform="rotate(${i * 30})"/>`).join("")}<circle r="13" fill="url(#steel)" stroke="url(#gold)" stroke-width="4"/></g>`;
  if (kind === "forge")
    art = `<path d="M25 164 25 81 44 63 44 30 77 30 77 65 104 82 104 164 66 183Z" fill="url(#stone)" stroke="#9a7655" stroke-width="2"/><path d="M39 154 39 112 Q62 69 90 111 V155Z" fill="#362426" stroke="url(#gold)" stroke-width="4"/><path d="M45 148 Q53 111 61 126 Q61 95 75 102 Q90 130 83 151Z" fill="#ed9e59"/><path d="M55 148 Q59 127 69 120 Q72 139 79 148Z" fill="#ffe3a3"/><path d="M34 89 92 89 M49 40 73 40 M48 52 75 52 M28 162 100 162" stroke="#b89560" stroke-width="2"/><ellipse cx="65" cy="137" rx="35" ry="25" fill="url(#glow)"/>`;
  if (kind === "shelf")
    art = `<path d="M22 164 22 40 60 21 106 42 106 163 65 183Z" fill="#222b3f" stroke="#8293ac" stroke-width="2"/><path d="M30 45 61 30 96 47 96 158 65 174 30 157Z" fill="#142635"/><path d="M64 32 64 173 M29 78 64 95 97 80 M29 117 64 134 97 118 M30 153 64 169 97 154" stroke="url(#gold)" stroke-width="3"/>${Array.from(
      { length: 21 },
      (_, i) => {
        const x = 33 + (i % 7) * 9,
          y = 51 + Math.floor(i / 7) * 38;
        return `<path d="M${x} ${y} v24 l5 2 v-23Z" fill="${["#626888", "#879c9d", "#a99681", "#536b88"][i % 4]}" stroke="#acb9b0" stroke-width=".5"/>`;
      },
    ).join("")}`;
  if (kind === "astrolabe")
    art = `<path d="M43 171 57 139 70 140 85 172 65 183Z" fill="url(#stone)" stroke="url(#gold)"/><g transform="translate(64 101)"><ellipse rx="41" ry="57" fill="none" stroke="url(#gold)" stroke-width="4"/><ellipse rx="49" ry="25" transform="rotate(-35)" fill="none" stroke="#b2a17c" stroke-width="3"/><ellipse rx="49" ry="25" transform="rotate(35)" fill="none" stroke="#8e9a95" stroke-width="3"/><path d="M0-54 0 52 M-36 0 36 0" stroke="#aaa488"/><circle r="15" fill="#d3ba83"/><path d="M0-22 5-5 21 0 5 5 0 22 -5 5 -21 0 -5-5Z" fill="#efdda9"/></g>`;
  return art;
}
const props = [];
for (const k of [
  "column",
  "tree",
  "crystal",
  "urn",
  "rubble",
  "flower",
  "mirror",
  "torch",
  "obelisk",
  "portal",
  "gear",
  "forge",
  "shelf",
  "astrolabe",
])
  props.push([k, prop(k)]);
await atlas(
  "props",
  192,
  props.map(([k, s]) => [k, `<g transform="translate(32 0)">${s}</g>`]),
  4,
);

// Original background engraving, kept as editable vector source.
let architecture = "";
for (let i = 0; i < 16; i++) {
  const x = i * 131 - 80,
    y = 400 + (i % 5) * 51;
  architecture += `<g opacity="${0.22 + (i % 3) * 0.09}"><path d="M${x} 1000 V${y + 85} l35-45 18-75 18 75 35 45 V1000Z" fill="#182b35" stroke="#45535a"/><path d="M${x + 25} ${y + 200} v-100 q30-55 60 0 v100 M${x + 35} ${y + 325} v-70 q18-40 37 0 v70" fill="#0b1824" stroke="#43545b"/></g>`;
}
let rings = "";
for (let i = 0; i < 7; i++) {
  const rx = 115 + i * 46;
  rings += `<ellipse cx="1260" cy="420" rx="${rx}" ry="${rx * 0.93}" fill="none" stroke="${i % 2 ? "#a78e5f" : "#4c7373"}" stroke-width="${i === 4 ? 13 : 2}" opacity="${i === 4 ? 0.8 : 0.4}" transform="rotate(${i * 17} 1260 420)"/>`;
}
for (let i = 0; i < 48; i++) {
  const a = (i / 48) * Math.PI * 2,
    x = 1260 + Math.cos(a) * 302,
    y = 420 + Math.sin(a) * 281;
  rings += `<path d="M${x} ${y} l${Math.cos(a) * 17} ${Math.sin(a) * 16}" stroke="#c2a879" stroke-width="${i % 4 === 0 ? 4 : 1}" opacity=".65"/>`;
}
const background = wrap(
  1920,
  1080,
  `<defs><linearGradient id="sky" x2=".75" y2="1"><stop stop-color="#060e1b"/><stop offset=".5" stop-color="#18343c"/><stop offset="1" stop-color="#071018"/></linearGradient><radialGradient id="sun"><stop stop-color="#d9ba79" stop-opacity=".45"/><stop offset=".3" stop-color="#81b7a0" stop-opacity=".13"/><stop offset="1" stop-color="#18323d" stop-opacity="0"/></radialGradient><linearGradient id="light" x2=".3" y2="1"><stop stop-color="#adceb2" stop-opacity=".15"/><stop offset="1" stop-color="#92b9a5" stop-opacity="0"/></linearGradient></defs><path fill="url(#sky)" d="M0 0H1920V1080H0Z"/><ellipse cx="1250" cy="400" rx="640" ry="580" fill="url(#sun)"/>${architecture}<path d="M1270 0 700 1000 1550 1000 1390 0Z" fill="url(#light)"/>${rings}<circle cx="1260" cy="420" r="95" fill="#f2dc9e" opacity=".2"/><circle cx="1260" cy="420" r="75" fill="#efd99b" opacity=".15"/><path d="M1194 383 1231 329 1284 340 1268 399 1315 444 1290 490 1246 467 1229 411Z" fill="#182c35" stroke="#d7b97b" stroke-width="3"/><path d="M1150 418 1104 430 1060 410 M1359 392 1405 365 1442 380 M1250 515 1268 550 1245 583" stroke="#b3a57c" fill="none" opacity=".7"/><path d="M0 965 240 826 460 882 640 742 790 793 970 1008 1150 885 1330 964 1510 831 1670 867 1920 731 V1080H0Z" fill="#08151e"/><path d="M1000 1080 1000 863 1070 794 1070 605 1105 565 1140 605 1140 807 1204 859 1204 1080 M1560 1080 1560 698 1602 649 1602 423 1636 362 1673 423 1673 654 1720 698 1720 1080" fill="#0e2029" stroke="#42534f"/><path d="M-40-20 Q330 10 395 380 M0 170 Q214 117 286 270 M0 549 Q142 421 207 239 M1815-10 Q1732 173 1910 302" fill="none" stroke="#101e26" stroke-width="55"/><path d="M0 1000 Q376 908 588 1080 M1920 950 Q1724 840 1511 1080" fill="none" stroke="#07111a" stroke-width="100"/>`,
);
await fs.writeFile(path.join(root, "sources", "tear.svg"), background);
await sharp(Buffer.from(background)).png().toFile(path.join(root, "tear.png"));
manifest.push({
  name: "tear",
  category: "background",
  image: "tear.png",
  width: 1920,
  height: 1080,
  source: "sources/tear.svg",
  method: "Original vector engraving",
});
await fs.writeFile(
  path.join(root, "manifest.json"),
  JSON.stringify(
    {
      version: "1.0.0",
      license: "Original artwork generated for Véspera; no third-party art.",
      assets: manifest,
    },
    null,
    2,
  ),
);
console.log("Assets reproduzíveis concluídos.");
