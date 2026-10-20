import { heroFrame, enemyFrame, bossFrame } from "./art/pixel-actors.mjs";
import fs from "node:fs/promises";
const a = JSON.parse(await fs.readFile("src/data/animations.json", "utf8"));
function edge(c) {
  let n = 0;
  for (let x = 0; x < c.width; x++)
    for (const y of [0, c.height - 1])
      if (c.data[(y * c.width + x) * 4 + 3] > 100) n++;
  for (let y = 0; y < c.height; y++)
    for (const x of [0, c.width - 1])
      if (c.data[(y * c.width + x) * 4 + 3] > 100) n++;
  return n;
}
const result = {};
for (const weapon of ["blade", "hammer", "bow"])
  for (const [state, count] of Object.entries(a.hero))
    for (let d = 0; d < 8; d++)
      for (let f = 0; f < count; f++) {
        const n = edge(heroFrame(state, f, count, d, weapon));
        if (n) (result[`eira-${weapon}:${state}`] ??= []).push([d, f, n]);
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
])
  for (const [state, count] of Object.entries(a.enemy))
    for (let d = 0; d < 8; d++)
      for (let f = 0; f < count; f++) {
        const n = edge(enemyFrame(kind, state, f, count, d));
        if (n) (result[`${kind}:${state}`] ??= []).push([d, f, n]);
      }
for (let b = 0; b < 4; b++)
  for (const [state, count] of Object.entries(a.boss))
    for (let f = 0; f < count; f++) {
      const n = edge(bossFrame(b, state, f, count));
      if (n) (result[`boss${b}:${state}`] ??= []).push([0, f, n]);
    }
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(result).map(([k, v]) => [
        k,
        { frames: v.length, sample: v.slice(0, 3) },
      ]),
    ),
    null,
    2,
  ),
);
if (Object.keys(result).length) process.exitCode = 1;
