import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { heroFrame, enemyFrame, bossFrame, WEAPON_ART_FAMILY } from "./art/pixel-actors.mjs";
import { tileFrame, villageGroundFrame, propFrame, backgroundFrame } from "./art/pixel-world.mjs";
import { villageFrame, VILLAGE_RESIDENTS } from "./art/pixel-village.mjs";
import { sceneryEntries } from "./art/pixel-scenery.mjs";
import { frame, icon, logo } from "./art/pixel-ui.mjs";
const animation = JSON.parse(
  await fs.readFile(
    new URL("../src/data/animations.json", import.meta.url),
    "utf8",
  ),
);
const root = path.resolve("public/assets");
await fs.mkdir(path.join(root, "sources"), { recursive: true });
const manifest = [];
const selectionArg = process.argv.find((arg) => arg.startsWith("--select="))?.slice(9)
  ?? (process.argv.includes("--select") ? process.argv[process.argv.indexOf("--select") + 1] : "");
const selected = selectionArg ? new Set(selectionArg.split(",").filter(Boolean)) : null;
const wanted = (name) => !selected || selected.has(name);

async function atlas(name, nativeSize, entries, cols = 16, nativeHeight = nativeSize) {
  if (!wanted(name)) return;
  const rows = Math.ceil(entries.length / cols),
    nw = cols * nativeSize,
    nh = rows * nativeHeight,
    size = nativeSize * 2,
    frameHeight = nativeHeight * 2,
    w = nw * 2,
    h = nh * 2;
  if (w > 4096 || h > 4096)
    throw new Error(`Atlas ${name} excede 4096: ${w}x${h}`);
  const frames = {},
    layers = [];
  for (let i = 0; i < entries.length; i++) {
    const [key, canvas] = entries[i],
      x = (i % cols) * size,
      y = Math.floor(i / cols) * frameHeight;
    if (canvas.width !== nativeSize || canvas.height !== nativeHeight)
      throw new Error(`Frame ${key}: dimensões inconsistentes`);
    frames[key] = {
      frame: { x, y, w: size, h: frameHeight },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: size, h: frameHeight },
      sourceSize: { w: size, h: frameHeight },
      pivot: { x: 0.5, y: name === "scenery" ? (key.startsWith("ground-") ? 59 / 96 : 86 / 96) : key === "village-road" || key === "village-grass" ? 59 / 96 : name === "village" ? 121 / 176 : name.startsWith("boss") ? 0.932 : 0.802 },
    };
    layers.push({
      input: canvas.data,
      raw: { width: nativeSize, height: nativeHeight, channels: 4 },
      left: (i % cols) * nativeSize,
      top: Math.floor(i / cols) * nativeHeight,
    });
  }
  const native = await sharp({
    create: { width: nw, height: nh, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .png({ palette: false })
    .toBuffer();
  await fs.writeFile(path.join(root, "sources", `${name}.native.png`), native);
  await sharp(native)
    .resize(w, h, { kernel: "nearest" })
    .ensureAlpha()
    .png({ palette: false })
    .toFile(path.join(root, `${name}.png`));
  await fs.writeFile(
    path.join(root, `${name}.json`),
    JSON.stringify({
      frames,
      meta: {
        app: "Véspera · original native pixel art",
        version: animation.version,
        image: `${name}.png`,
        format: "RGBA8888",
        size: { w, h },
        scale: "2",
        nativeFrame: nativeSize,
        ...(nativeHeight !== nativeSize ? { nativeFrameHeight: nativeHeight } : {}),
      },
    }),
  );
  const source = `sources/${name}.pixel.json`;
  await fs.writeFile(
    path.join(root, source),
    JSON.stringify(
      {
        name,
        version: animation.version,
        nativeSize,
        ...(nativeHeight !== nativeSize ? { nativeHeight } : {}),
        outputScale: 2,
        format: "RGBA8888",
        method:
          "Original pixel clusters, articulated joints and authored action keyframes; nearest-neighbour upscale.",
        generator:
          name === "scenery" ? "scripts/art/pixel-scenery.mjs" : name === "village" ? "scripts/art/pixel-village.mjs" : name === "props" || name.startsWith("tiles")
            ? "scripts/art/pixel-world.mjs"
            : "scripts/art/pixel-actors.mjs",
        frames: Object.keys(frames),
      },
      null,
      2,
    ),
  );
  manifest.push({
    name,
    category: name.startsWith("tiles") ? "tileset" : "atlas",
    image: `${name}.png`,
    metadata: `${name}.json`,
    width: w,
    height: h,
    frames: entries.length,
    nativeFrame: nativeSize,
    ...(nativeHeight !== nativeSize ? { nativeFrameHeight: nativeHeight } : {}),
    source,
    editableSource: `sources/${name}.native.png`,
    format: "RGBA8888",
    style: animation.style,
    method: "Native software pixel art → nearest 2× → truecolour RGBA PNG",
    animations: [...new Set(entries.map((e) => e[0].split("/")[0]))],
  });
  console.log(`${name}: ${entries.length} frames · ${w}×${h} · RGBA32`);
}
async function single(name, canvas, scale = 2, category = "ui") {
  if (!wanted(name)) return;
  const native = await sharp(canvas.data, canvas.raw())
    .png({ palette: false })
    .toBuffer();
  const nativeName = `sources/${name}.native.png`;
  await fs.writeFile(path.join(root, nativeName), native);
  await sharp(native)
    .resize(canvas.width * scale, canvas.height * scale, { kernel: "nearest" })
    .ensureAlpha()
    .png({ palette: false })
    .toFile(path.join(root, `${name}.png`));
  manifest.push({
    name,
    category,
    image: `${name}.png`,
    source: nativeName,
    width: canvas.width * scale,
    height: canvas.height * scale,
    format: "RGBA8888",
    style: animation.style,
    method: "Original native pixel art, nearest-neighbour upscale",
  });
}
for (const weapon of Object.keys(WEAPON_ART_FAMILY)) {
  const name = weapon === "blade" ? "eira" : `eira-${weapon}`;
  if (!wanted(name)) continue;
  const entries = [];
  for (const [state, count] of Object.entries(animation.hero))
    for (let d = 0; d < 8; d++)
      for (let f = 0; f < count; f++)
        entries.push([
          `${state}/${d}/${f}`,
          heroFrame(state, f, count, d, weapon),
        ]);
  await atlas(name, 56, entries, 36);
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
  if (!wanted(kind)) continue;
  const entries = [];
  for (const [state, count] of Object.entries(animation.enemy))
    for (let d = 0; d < 8; d++)
      for (let f = 0; f < count; f++)
        entries.push([
          `${state}/${d}/${f}`,
          enemyFrame(kind, state, f, count, d),
        ]);
  await atlas(kind, 56, entries, 16);
}
for (const npc of ["salvia", "orren", "nim", "lume", "caio", "iria"]) {
  if (!wanted(npc)) continue;
  const entries = [];
  for (const [state, count] of Object.entries(animation.npc))
    for (let d = 0; d < 8; d++)
      for (let f = 0; f < count; f++)
        entries.push([
          `${state}/${d}/${f}`,
          heroFrame(state, f, count, d, "blade", npc),
        ]);
  await atlas(npc, 56, entries, 16);
}
for (let b = 0; b < 4; b++) {
  if (!wanted(`boss${b}`)) continue;
  const entries = [];
  for (const [state, count] of Object.entries(animation.boss))
    for (let f = 0; f < count; f++)
      entries.push([`${state}/0/${f}`, bossFrame(b, state, f, count)]);
  await atlas(`boss${b}`, 96, entries, 16);
}
for (let b = 0; b < 4; b++) {
  if (!wanted(`tiles${b}`)) continue;
  const entries = Array.from({ length: 12 }, (_, n) => [`floor/${n}`, tileFrame(b, n)]);
  if (b === 0) entries.push(["village-road", villageGroundFrame("village-road")], ["village-grass", villageGroundFrame("village-grass")]);
  await atlas(
    `tiles${b}`,
    48,
    entries,
    4,
  );
}
if (wanted("scenery")) await atlas("scenery", 96, sceneryEntries(), 7);
if (wanted("village")) {
  const entries = VILLAGE_RESIDENTS.flatMap((id) => [[`house-${id}`, villageFrame(`house-${id}`)], [`roof-${id}`, villageFrame(`roof-${id}`)]]);
  entries.push(["lighthouse", villageFrame("lighthouse")]);
  await atlas("village", 192, entries, 4, 176);
}
if (wanted("props")) {
const entries = [];
for (const kind of [
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
  "cookpot",
  "cistern",
  "loom",
  "chest", "chest-open", "crate", "barrel", "secret-wall", "upgrade-altar",
  "gate-closed", "gate-open", "gate-key", "key-cache", "well", "bench", "planter", "lamp", "sign",
]) {
  entries.push([kind, propFrame(kind)]);
  const count = animation.props[kind];
  if (count)
    for (let f = 0; f < count; f++)
      entries.push([`${kind}/0/${f}`, propFrame(kind, f, count)]);
}
for (let f = 0; f < 8; f++) entries.push([`chest-open-${f}`, propFrame(`chest-open-${f}`)]);
for (let f = 0; f < 8; f++) entries.push([`gate-open-${f}`, propFrame(`gate-open-${f}`)]);
await atlas("props", 96, entries, 12);
}
await single("tear", backgroundFrame(), 3, "background");
for (const kind of ["panel", "menu", "button", "primary"])
  await single(`ui-${kind}`, frame(kind), 1);
for (const kind of [
  "sun",
  "heart",
  "blade",
  "hammer",
  "bow",
  "dagger", "spear", "greatsword", "axe", "scythe", "rapier",
  "crossbow", "staff", "pistol", "chakram",
  "echo",
  "coin",
  "map",
  "pause",
  "gear",
  "flame",
  "tide",
  "glass",
  "dash",
  "star",
  "book",
  "skull",
  "arrow",
  "food",
  "water",
  "leaf",
  "thread",
  "coat",
  "pot",
  "cup",
])
  await single(`icon-${kind}`, icon(kind), 2);
await single("logo", logo(), 2);
// Portraits come from the same original sprites, at a stable native crop.
for (const name of ["eira", "salvia", "orren", "nim", "lume", "caio", "iria"]) {
  if (!wanted(`portrait-${name}`)) continue;
  const source = heroFrame(
    "idle",
    0,
    8,
    0,
    "blade",
    name === "eira" ? "" : name,
  );
  const crop =
    name === "nim"
      ? { left: 16, top: 15, width: 26, height: 30 }
      : { left: 17, top: 1, width: 24, height: 31 };
  await sharp(source.data, source.raw())
    .extract(crop)
    .resize(96, 124, {
      kernel: "nearest",
      fit: "contain",
      background: "#00000000",
    })
    .ensureAlpha()
    .png({ palette: false })
    .toFile(path.join(root, `portrait-${name}.png`));
  manifest.push({
    name: `portrait-${name}`,
    category: "ui",
    image: `portrait-${name}.png`,
    source: `sources/${name}.native.png`,
    width: 96,
    height: 124,
    format: "RGBA8888",
    style: animation.style,
    method: "Native original character portrait",
  });
}
let assets = manifest;
if (selected) {
  if (!manifest.length) throw new Error("Nenhum asset corresponde à seleção --select.");
  const previous = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8"));
  const byName = new Map(previous.assets.map((asset) => [asset.name, asset]));
  for (const asset of manifest) byName.set(asset.name, asset);
  assets = [...byName.values()];
}
await fs.writeFile(
  path.join(root, "manifest.json"),
  JSON.stringify(
    {
      version: animation.version,
      style: animation.style,
      pixelFormat: "RGBA8888",
      license:
        "Original pixel artwork and interface created for Véspera. References inform genre and material only; no reference pixels copied.",
      assets,
    },
    null,
    2,
  ),
);
console.log(
  `Concluído: ${manifest.length} assets gerados; ${assets.length} assets originais no manifesto.`,
);
