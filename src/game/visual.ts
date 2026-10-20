import Phaser from "phaser";
import type { Vec } from "../types";
import { project } from "./procedural";
import { HERO_FRAMES, animationFrame, framesFor } from "./animation";
import { actorMetrics } from "./presentation";
export const FRAME_COUNTS = HERO_FRAMES;
function shadowTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("pixel-shadow")) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x030b15, 0.5);
  for (let y = 0; y < 10; y++) {
    const half = Math.round(
      15 * Math.sqrt(Math.max(0, 1 - ((y - 4.5) / 5) ** 2)),
    );
    g.fillRect(16 - half, y, half * 2, 1);
  }
  g.generateTexture("pixel-shadow", 32, 10);
  g.destroy();
}
export class ActorVisual {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  state = "idle";
  direction = 0;
  time = 0;
  get height(): number {
    return actorMetrics(this.texture, this.boss).height;
  }
  constructor(
    public scene: Phaser.Scene,
    public texture: string,
    public boss = false,
  ) {
    shadowTexture(scene);
    const metrics = actorMetrics(texture, boss);
    this.shadow = scene.add
      .image(0, 0, "pixel-shadow")
      .setDisplaySize(metrics.shadowWidth, metrics.shadowHeight)
      .setAlpha(0.65);
    this.sprite = scene.add
      .image(0, 0, texture, "idle/0/0")
      .setOrigin(0.5, metrics.origin)
      .setScale(metrics.scale);
  }
  restart(): void {
    this.state = "";
    this.time = 0;
  }
  update(
    p: Vec,
    state: string,
    angle: number,
    dt: number,
    frame?: number,
  ): void {
    if (this.state !== state) {
      this.state = state;
      this.time = 0;
    } else this.time += dt;
    this.direction = this.boss
      ? 0
      : (Math.round(angle / (Math.PI / 4)) + 8) % 8;
    const n = framesFor(this.texture, state),
      index =
        frame === undefined
          ? animationFrame(this.texture, state, this.time)
          : Math.min(n - 1, Math.max(0, frame));
    const key = `${state}/${this.direction}/${index}`;
    if (this.scene.textures.get(this.texture).has(key))
      this.sprite.setFrame(key);
    const q = project(p);
    this.sprite
      .setPosition(Math.round(q.x), Math.round(q.y))
      .setDepth(q.y + 0.1);
    this.shadow
      .setPosition(Math.round(q.x), Math.round(q.y) + 1)
      .setDepth(-350);
  }
  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
interface Mote {
  image: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
}
export class Effects {
  pool: Mote[] = [];
  cursor = 0;
  constructor(
    public scene: Phaser.Scene,
    public capacity: number,
  ) {
    if (!scene.textures.exists("mote")) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 0.25);
      g.fillRect(10, 14, 12, 4);
      g.fillRect(14, 10, 4, 12);
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(12, 14, 8, 4);
      g.fillRect(14, 12, 4, 8);
      g.fillStyle(0xffffff, 1);
      g.fillRect(14, 14, 4, 4);
      g.generateTexture("mote", 32, 32);
      g.destroy();
    }
    for (let i = 0; i < capacity; i++)
      this.pool.push({
        image: scene.add
          .image(0, 0, "mote")
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(2500)
          .setVisible(false),
        vx: 0,
        vy: 0,
        life: 0,
        max: 1,
        size: 1,
      });
  }
  burst(
    p: Vec,
    color: number,
    count: number,
    speed = 100,
    angle?: number,
  ): void {
    const q = project(p);
    for (let i = 0; i < Math.min(count, this.capacity); i++) {
      const m = this.pool[this.cursor++ % this.capacity],
        a =
          angle === undefined
            ? Math.random() * Math.PI * 2
            : angle + (Math.random() - 0.5) * 1.8,
        v = speed * (0.3 + Math.random() * 0.7);
      m.vx = Math.cos(a) * v;
      m.vy = Math.sin(a) * v * 0.6 - 20;
      m.life = m.max = 0.3 + Math.random() * 0.45;
      m.size = 0.3 + Math.random() * 0.7;
      m.image
        .setPosition(q.x, q.y - 22)
        .setTint(color)
        .setScale(m.size)
        .setAlpha(1)
        .setVisible(true);
    }
  }
  ambient(x: number, y: number, color: number): void {
    const m = this.pool[this.cursor++ % this.capacity];
    m.vx = Math.random() * 10 - 5;
    m.vy = -5 - Math.random() * 10;
    m.life = m.max = 3 + Math.random() * 2;
    m.size = 0.13 + Math.random() * 0.2;
    m.image
      .setPosition(x, y)
      .setTint(color)
      .setScale(m.size)
      .setAlpha(0.4)
      .setVisible(true);
  }
  update(dt: number): void {
    for (const m of this.pool) {
      if (m.life <= 0) continue;
      m.life -= dt;
      if (m.life <= 0) {
        m.image.setVisible(false);
        continue;
      }
      m.image.x += m.vx * dt;
      m.image.y += m.vy * dt;
      m.image
        .setAlpha(Math.max(0, m.life / m.max))
        .setScale(m.size * (0.4 + (m.life / m.max) * 0.6));
    }
  }
  destroy(): void {
    for (const m of this.pool) m.image.destroy();
  }
}
