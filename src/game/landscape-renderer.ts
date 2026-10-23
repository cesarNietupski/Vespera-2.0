import Phaser from "phaser";
import type { Layout } from "../types";
import { TILE } from "./config";
import { project, rng } from "./procedural";
import { LANDSCAPES, type EnvironmentPlan, type EnvironmentTheme } from "./environment";

type Own = <T extends Phaser.GameObjects.GameObject>(object: T) => T;

function groundTexture(scene: Phaser.Scene, theme: EnvironmentTheme): string {
  const key = `landscape-ground-${theme}`;
  if (scene.textures.exists(key)) return key;
  const texture = scene.textures.createCanvas(key, 1024, 512)!;
  const context = texture.context, r = rng(key);
  context.imageSmoothingEnabled = false;
  context.fillStyle = LANDSCAPES[theme].ground; context.fillRect(0, 0, 1024, 512);
  // An opaque, cached carpet of flat native tiles, rather than a giant scene-sized canvas.
  for (let row = -1; row <= 27; row++) for (let col = -1; col <= 14; col++) {
    const frame = scene.textures.getFrame("scenery", `ground-${theme}-${Math.floor(r() * 3)}`);
    const x = col * 80 + (row % 2) * 40, y = row * 20;
    context.drawImage(frame.source.image as HTMLImageElement, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, x - 81, y - 99, 162, 162);
  }
  texture.refresh(); texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

export function paintLandscape(scene: Phaser.Scene, layout: Layout, plan: EnvironmentPlan, own: Own, occlude: (image: Phaser.GameObjects.Image) => void): Phaser.GameObjects.TileSprite {
  const palette = LANDSCAPES[plan.theme];
  scene.cameras.main.setBackgroundColor(palette.ground);
  const ground = own(scene.add.tileSprite(0, 0, 1600, 1100, groundTexture(scene, plan.theme)).setOrigin(0).setDepth(-2000));
  updateLandscapeGround(ground, scene.cameras.main);

  // Low soil banks and embankments join the paving to its surroundings.
  // There is no exposed underside or deep vertical extrusion into a void.
  const banks = own(scene.add.graphics().setDepth(-650));
  for (let y = 0; y < layout.height; y++) for (let x = 0; x < layout.width; x++) {
    if (!layout.cells[y][x]) continue;
    const bottom = project({ x: (x + 1) * TILE, y: (y + 1) * TILE });
    for (const [outside, p] of [
      [!layout.cells[y + 1]?.[x], { x: x * TILE, y: (y + 1) * TILE }],
      [!layout.cells[y]?.[x + 1], { x: (x + 1) * TILE, y: y * TILE }],
    ] as const) {
      if (!outside) continue;
      const a = project(p), drop = plan.theme === "archive" ? 7 : 3;
      banks.fillStyle(palette.bank, 1);
      banks.fillPoints([new Phaser.Math.Vector2(a.x, a.y), new Phaser.Math.Vector2(bottom.x, bottom.y), new Phaser.Math.Vector2(bottom.x, bottom.y + drop), new Phaser.Math.Vector2(a.x, a.y + drop)], true);
      banks.lineStyle(2, palette.edge, .5); banks.lineBetween(a.x, a.y, bottom.x, bottom.y);
      if (plan.theme === "archive") {
        banks.lineStyle(1, 0x9ac7c5, .45); banks.lineBetween(a.x - 4, a.y + 10, bottom.x - 4, bottom.y + 10);
      }
    }
  }
  for (const prop of plan.props) {
    const q = project(prop.pos);
    own(scene.add.ellipse(q.x, q.y + 2, 56 * prop.scale, 19 * prop.scale, palette.bank, .5).setDepth(-620));
    const image = own(scene.add.image(q.x, q.y, "scenery", prop.frame).setOrigin(.5, 86 / 96).setScale(prop.scale).setFlipX(prop.flip).setDepth(q.y));
    occlude(image);
  }
  return ground;
}

export function updateLandscapeGround(ground: Phaser.GameObjects.TileSprite, camera: Phaser.Cameras.Scene2D.Camera): void {
  const width = Math.ceil(camera.width / camera.zoom) + 64, height = Math.ceil(camera.height / camera.zoom) + 64;
  const x = Math.floor(camera.scrollX + (camera.width - camera.width / camera.zoom) / 2) - 32;
  const y = Math.floor(camera.scrollY + (camera.height - camera.height / camera.zoom) / 2) - 32;
  if (ground.width !== width || ground.height !== height) ground.setSize(width, height);
  ground.setPosition(x, y).setTilePosition(x, y);
}
