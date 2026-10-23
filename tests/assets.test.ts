import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import animation from "../src/data/animations.json";
import { createHash } from "node:crypto";
interface Asset {
  name: string;
  image: string;
  metadata?: string;
  width: number;
  height: number;
  frames?: number;
  source: string;
}
const root = path.resolve("public/assets");
const manifest = JSON.parse(
  readFileSync(path.join(root, "manifest.json"), "utf8"),
) as { assets: Asset[] };
describe("Assets produzidos e atlas carregáveis", () => {
  for (const a of manifest.assets)
    it(`${a.name}: PNG real, fonte preservada e frames dentro do atlas`, () => {
      expect(existsSync(path.join(root, a.source))).toBe(true);
      const png = readFileSync(path.join(root, a.image));
      expect(png.toString("hex", 0, 8)).toBe("89504e470d0a1a0a");
      expect(png.readUInt32BE(16)).toBe(a.width);
      expect(png.readUInt32BE(20)).toBe(a.height);
      expect(png[24]).toBe(8);
      expect(png[25]).toBe(6); // 8 bits × 4 RGBA channels, never indexed PNG.
      if (a.metadata) {
        const atlas = JSON.parse(
          readFileSync(path.join(root, a.metadata), "utf8"),
        );
        expect(Object.keys(atlas.frames)).toHaveLength(a.frames!);
        const occupied = new Set<string>();
        for (const entry of Object.values(atlas.frames) as {
          frame: { x: number; y: number; w: number; h: number };
        }[]) {
          const f = entry.frame;
          expect(f.x + f.w).toBeLessThanOrEqual(a.width);
          expect(f.y + f.h).toBeLessThanOrEqual(a.height);
          expect(f.x).toBeGreaterThanOrEqual(0);
          expect(f.y).toBeGreaterThanOrEqual(0);
          const k = `${f.x},${f.y}`;
          expect(occupied.has(k)).toBe(false);
          occupied.add(k);
        }
      }
    });
  it("Eira tem 15 ações e oito direções em cada equipamento, incluindo seis ataques M1", () => {
    for (const name of ["eira", "eira-hammer", "eira-bow", "eira-dagger", "eira-spear", "eira-greatsword", "eira-axe", "eira-scythe", "eira-rapier", "eira-crossbow", "eira-staff", "eira-pistol", "eira-chakram"]) {
      const frames = JSON.parse(
        readFileSync(path.join(root, `${name}.json`), "utf8"),
      ).frames;
      for (const [state, count] of Object.entries(animation.hero)) {
        for (let d = 0; d < 8; d++)
          for (let f = 0; f < count; f++)
            expect(frames[`${state}/${d}/${f}`]).toBeDefined();
      }
    }
  });
  it("pixels nativos são ampliados por vizinho mais próximo e os seis golpes têm poses diferentes", async () => {
    const metadata = JSON.parse(
      readFileSync(path.join(root, "eira.json"), "utf8"),
    );
    const hashes = [];
    for (let i = 1; i <= 6; i++) {
      const frame =
        metadata.frames[
          `attack${i}/0/${Math.floor((animation.hero as Record<string, number>)[`attack${i}`] * 0.5)}`
        ].frame;
      const { data, info } = await sharp(path.join(root, "eira.png"))
        .extract({
          left: frame.x,
          top: frame.y,
          width: frame.w,
          height: frame.h,
        })
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect(info.channels).toBe(4);
      for (let y = 0; y < info.height; y += 2)
        for (let x = 0; x < info.width; x += 2) {
          const index = (y * info.width + x) * 4;
          for (const delta of [4, info.width * 4, info.width * 4 + 4])
            expect(data.subarray(index, index + 4)).toEqual(
              data.subarray(index + delta, index + delta + 4),
            );
        }
      hashes.push(createHash("sha256").update(data).digest("hex"));
    }
    expect(new Set(hashes).size).toBe(6);
  });
});
