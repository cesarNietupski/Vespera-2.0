import Phaser from "phaser";
import type { EnemyKind, Layout, Prop, Vec, NpcId } from "../types";
import type { App } from "../main";
import { BALANCE, BIOMES, ENEMIES, TILE, WEAPONS } from "./config";
import {
  findPath,
  generateLayout,
  pick,
  project,
  rng,
  unproject,
  walkable,
} from "./procedural";
import { AttackTimeline, Cooldown, distance, inArc, Vitality } from "./combat";
import { ActorVisual, Effects } from "./visual";
import { Objective } from "./objectives";
import { boonStats } from "../data/boons";
import { AuroraPipeline } from "./shaders";
import { ANIMATIONS, HERO_FRAMES, BOSS_PATTERNS, framesFor } from "./animation";
import { AttackBuffer, COMBOS, comboMove } from "./combos";
import { obscuresActor, approachAlpha } from "./presentation";
import { progressionStats, awardRoomSalvage, MATERIALS } from "./crafting";
import { HUB_NPCS } from "../data/npcs";
import { tickNeeds, survivalEffects, grantSurvivalLoot } from "./survival";

type AIState =
  | "idle"
  | "patrol"
  | "investigate"
  | "chase"
  | "reposition"
  | "telegraph"
  | "attack"
  | "recover"
  | "stunned"
  | "retreat"
  | "dead";
interface Enemy {
  id: number;
  kind: EnemyKind;
  pos: Vec;
  health: Vitality;
  visual: ActorVisual;
  state: AIState;
  timer: number;
  angle: number;
  path: Vec[];
  repath: number;
  attackCount: number;
  boss: boolean;
  phase: number;
  burn: number;
  slow: number;
  hpbar: Phaser.GameObjects.Graphics;
  target: Vec;
  attackResolved: boolean;
}
interface Shot {
  active: boolean;
  pos: Vec;
  vel: Vec;
  life: number;
  damage: number;
  friendly: boolean;
  image: Phaser.GameObjects.Image;
  pierce: number;
  hit: Set<number>;
}
interface Marker {
  pos: Vec;
  image: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  progress: number;
  done: boolean;
  hp: number;
}
interface Danger {
  pos: Vec;
  radius: number;
  remaining: number;
  duration: number;
  damage: number;
  fired: boolean;
  source: number;
}

export class Preload extends Phaser.Scene {
  constructor(private app: App) {
    super("Preload");
  }
  preload(): void {
    this.load.on("progress", (p: number) => this.app.ui.loading(p));
    for (const name of [
      "eira",
      "eira-hammer",
      "eira-bow",
      "salvia",
      "orren",
      "nim",
      "lume",
      "caio",
      "iria",
      "swordsman",
      "archer",
      "guardian",
      "hound",
      "summoner",
      "automaton",
      "wraith",
      "elite",
      "boss0",
      "boss1",
      "boss2",
      "boss3",
      "tiles0",
      "tiles1",
      "tiles2",
      "tiles3",
      "props",
    ])
      this.load.atlas(name, `assets/${name}.png`, `assets/${name}.json`);
    this.load.image("tear", "assets/tear.png");
    this.load.on("loaderror", (file: { key: string }) =>
      this.app.ui.error(
        `Não foi possível carregar ${file.key}. Recarregue a página após gerar os assets.`,
      ),
    );
  }
  create(): void {
    this.scene.start("World");
  }
}
export class World extends Phaser.Scene {
  attackBuffer = new AttackBuffer();
  comboHistory: string[] = [];
  ambientAnimations: {
    image: Phaser.GameObjects.Image;
    kind: string;
    phase: number;
  }[] = [];
  npcs: { id: NpcId; visual: ActorVisual; pos: Vec }[] = [];
  survivalSaveTimer = 0;
  get needs() {
    return this.app.run?.needs ?? this.app.store.data.needs;
  }
  get needsEffects() {
    return survivalEffects(
      this.isHub ? { hunger: 0, thirst: 0, cold: 0, strain: 0 } : this.needs,
    );
  }
  pendingActions = new Set<string>();
  actions = new Set<string>();
  layout!: Layout;
  player!: ActorVisual;
  pos: Vec = { x: 147, y: 399 };
  health = new Vitality(120);
  effects!: Effects;
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  markers: Marker[] = [];
  danger: Danger[] = [];
  objective = new Objective("eliminate");
  roomObjects: Phaser.GameObjects.GameObject[] = [];
  props: { data: Prop; image: Phaser.GameObjects.Image; hp: number }[] = [];
  exit!: Phaser.GameObjects.Image;
  ambient!: Phaser.GameObjects.Graphics;
  telegraphs!: Phaser.GameObjects.Graphics;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  attack: AttackTimeline | null = null;
  dash = new Cooldown(BALANCE.dashCooldown);
  special = new Cooldown(4);
  alternate = new Cooldown(7);
  dashTime = 0;
  dashVector: Vec = { x: 1, y: 0 };
  facing = 0;
  combo = 0;
  comboTime = 0;
  hold = 0;
  chargeUsed = false;
  ultimate = 0;
  hitstop = 0;
  elapsed = 0;
  hudTimer = 0;
  isHub = true;
  resurrectTime = 0;
  hurtTime = 0;
  lastDash = 0;
  ready = false;
  cleared = false;
  rewardPending = false;
  pendingWave = 0;
  waveTimer = 0;
  stepTime = 0;
  escort: Vec | null = null;
  roomRng = () => 0.5;
  intro = 0;
  id = 0;
  decorTime = 0;
  foreground: Phaser.GameObjects.Image[] = [];
  occluders: {
    image: Phaser.GameObjects.Image;
    attachments: Phaser.GameObjects.Image[];
    restAlpha: number;
    halfWidth: number;
    height: number;
  }[] = [];
  constructor(public app: App) {
    super("World");
  }
  create(): void {
    this.app.world = this;
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,SPACE,SHIFT,E,Q,R,T,TAB,ESC") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    kb.addCapture(["SPACE", "TAB", "W", "A", "S", "D"]);
    for (const key of ["SPACE", "SHIFT", "E", "Q", "R", "T"])
      this.keys[key].on("down", () => this.pendingActions.add(key));
    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.canAct()) return;
      this.app.audio.start();
      if (p.rightButtonDown()) this.specialAttack();
      else if (p.leftButtonDown()) {
        this.hold = 0.001;
        this.chargeUsed = false;
        this.beginAttack(false);
      }
    });
    this.input.on("pointerup", () => {
      if (this.hold > 0.45 && !this.chargeUsed && this.canAct())
        this.beginAttack(true);
      this.hold = 0;
    });
    this.game.canvas.addEventListener("blur", () => this.app.ui.autoPause());
    window.addEventListener("blur", () => this.app.ui.autoPause());
    if (this.game.renderer.type === Phaser.WEBGL) {
      (
        this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer
      ).pipelines.addPostPipeline("Aurora", AuroraPipeline);
      this.cameras.main.setPostPipeline("Aurora");
    }
    this.effects = new Effects(this, 1);
    this.ready = true;
    this.enterHub();
    this.app.ui.menu();
  }
  canAct(): boolean {
    return (
      this.ready &&
      this.app.ui.screen === "play" &&
      !this.health.dead &&
      this.intro <= 0 &&
      this.resurrectTime <= 0
    );
  }
  consume(key: string): boolean {
    return this.actions.delete(key);
  }
  maxHP(): number {
    return BALANCE.hp + (this.stats().hp ?? 0);
  }
  stats(): Record<string, number> {
    const stats = boonStats(this.app.run?.boons ?? []);
    for (const [key, value] of Object.entries(
      progressionStats(
        this.app.store.data,
        this.app.run?.weapon ?? this.app.weapon,
      ),
    ))
      stats[key] = (stats[key] ?? 0) + value;
    return stats;
  }
  attackTint(fallback: number): number {
    const infusion =
      this.app.store.data.infusions[this.app.run?.weapon ?? this.app.weapon];
    return infusion === "ember"
      ? 0xffad72
      : infusion === "glass"
        ? 0xc4e8ff
        : infusion === "tide"
          ? 0x8fddd2
          : fallback;
  }
  clearRoom(): void {
    this.app.ui.activeNpc = null;
    this.survivalSaveTimer = 0;
    this.attackBuffer.clear();
    this.comboHistory = [];
    this.combo = 0;
    this.comboTime = 0;
    this.ambientAnimations = [];
    this.npcs = [];
    this.pendingActions.clear();
    this.actions.clear();
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.enemies.forEach((e) => {
      e.visual.destroy();
      e.hpbar.destroy();
    });
    this.enemies = [];
    this.shots.forEach((s) => s.image.destroy());
    this.shots = [];
    this.markers = [];
    this.danger = [];
    this.props = [];
    this.foreground = [];
    this.occluders = [];
    this.roomObjects.forEach((o) => o.destroy());
    this.roomObjects = [];
    this.effects?.destroy();
    this.player?.destroy();
    this.attack = null;
    this.dashTime = 0;
    this.hold = 0;
    this.escort = null;
    this.cleared = false;
    this.rewardPending = false;
    this.pendingWave = 0;
    this.hitstop = 0;
    this.resurrectTime = 0;
    this.hurtTime = 0;
    this.lastDash = 0;
    this.special.remaining = 0;
    this.alternate.remaining = 0;
    this.dash.remaining = 0;
    this.input.keyboard?.resetKeys();
  }
  own<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.roomObjects.push(o);
    return o;
  }
  enterHub(): void {
    this.clearRoom();
    this.isHub = true;
    this.app.audio.biome = -1;
    this.app.audio.combat = false;
    this.layout = generateLayout("farol-v1");
    // Open resident pads and connect each to the arrival gallery.
    for (const npc of HUB_NPCS) {
      for (let x = 3; x <= npc.x; x++)
        for (const y of [9, 10]) this.layout.cells[y][x] = 1;
      for (let y = Math.min(9, npc.y); y <= Math.max(9, npc.y); y++)
        for (const x of [npc.x, npc.x + 1]) this.layout.cells[y][x] = 1;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          this.layout.cells[npc.y + dy][npc.x + dx] = 1;
    }
    this.layout.props = this.layout.props.filter(
      (p) =>
        p.kind !== "tree" &&
        p.kind !== "flower" &&
        !HUB_NPCS.some(
          (n) =>
            distance(p, { x: (n.x + 0.5) * TILE, y: (n.y + 0.5) * TILE }) < 70,
        ) &&
        (!p.solid ||
          !this.layout.cells[Math.floor(p.y / TILE)][Math.floor(p.x / TILE)]),
    );
    this.pos = { ...this.layout.spawn };
    this.health = new Vitality(this.maxHP());
    this.resurrectTime = this.app.store.data.deaths > 0 ? 1.2 : 0;
    this.elapsed = 0;
    this.buildEnvironment(0, true);
    this.player = new ActorVisual(
      this,
      this.app.weapon === "blade" ? "eira" : `eira-${this.app.weapon}`,
    );
    this.effects = new Effects(this, this.particleCount());
    this.objective = new Objective("eliminate");
    this.objective.state = "completed";
    for (const npc of HUB_NPCS) {
      this.spawnNPC(npc.id);
      if (npc.station) {
        const p = project({ x: (npc.x + 1.5) * TILE, y: (npc.y - 0.5) * TILE });
        this.own(
          this.add
            .image(p.x, p.y, "props", npc.station)
            .setOrigin(0.5, 0.9)
            .setScale(0.8)
            .setDepth(p.y),
        );
      }
    }
    this.configureCamera();
    this.app.ui.hud();
  }
  spawnNPC(id: NpcId): void {
    const { name, x, y, role } = HUB_NPCS.find((n) => n.id === id)!;
    const pos = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE },
      q = project(pos),
      visual = new ActorVisual(this, id);
    this.own(visual.sprite);
    this.own(visual.shadow);
    this.npcs.push({ id, visual, pos });
    this.own(
      this.add
        .text(q.x, q.y - visual.height - 12, `${name}\n${role}`, {
          fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
          fontSize: "15px",
          align: "center",
          lineSpacing: 3,
          color: "#f8e9bc",
          stroke: "#15202b",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(1750),
    );
  }
  nearNpc(id: NpcId): boolean {
    const npc = this.npcs.find((n) => n.id === id);
    return this.isHub && !!npc && distance(this.pos, npc.pos) < 76;
  }
  enterRoom(): void {
    this.clearRoom();
    const run = this.app.run!;
    const node = run.nodes[run.current];
    this.isHub = false;
    this.roomRng = rng(node.seed);
    this.app.audio.biome = node.biome;
    this.layout = generateLayout(node.seed, node.kind === "boss");
    this.pos = { ...this.layout.spawn };
    this.health = new Vitality(this.maxHP());
    this.health.hp = Math.min(run.hp, this.health.max);
    this.ultimate = run.charge;
    this.elapsed = 0;
    this.buildEnvironment(node.biome, false);
    this.player = new ActorVisual(
      this,
      run.weapon === "blade" ? "eira" : `eira-${run.weapon}`,
    );
    this.effects = new Effects(this, this.particleCount());
    this.objective = new Objective(node.objective);
    this.objective.start();
    const restored = run.visited.includes(node.id);
    const peaceful = ["event", "shop", "explore", "reward", "secret"].includes(
      node.kind,
    );
    if (!restored && node.kind === "boss") {
      this.spawnEnemy("elite", { x: 15 * TILE, y: 9 * TILE }, true);
      this.objective = new Objective("eliminate", 1);
      this.objective.start();
      this.intro = 2.7;
      this.app.ui.announcement(
        BIOMES[node.biome].boss,
        "VIGIA DO FRAGMENTO",
        2600,
      );
    } else if (!restored && !peaceful) {
      this.spawnWave(node.kind === "elite" ? 6 : 3 + node.biome);
      this.pendingWave = node.kind === "elite" ? 1 : 0;
      this.waveTimer =
        node.objective === "seal" || node.objective === "defend" ? 9 : 0;
    }
    if (node.objective !== "eliminate") this.createMarkers(node.objective);
    else if (peaceful) {
      this.objective.target = 0;
      this.objective.progress = 0;
      this.objective.state = "completed";
    }
    if (restored) {
      this.objective.state = "completed";
      this.objective.progress = this.objective.target;
      this.cleared = true;
      for (const m of this.markers) {
        m.done = true;
        m.label.setText("✓");
        m.image.setAlpha(0.45);
      }
      this.exit.setTint(0xcbffcf);
    }
    if (!restored && node.objective === "escort")
      this.escort = { x: 7 * TILE, y: 9.5 * TILE };
    this.app.audio.combat = !peaceful;
    this.configureCamera();
    this.cameras.main.fadeIn(500, 5, 12, 18);
    this.app.ui.screen = "play";
    this.app.ui.hud();
    this.app.ui.announcement(
      node.title,
      `${BIOMES[node.biome].short.toUpperCase()} · CÂMARA ${(run.current % 9) + 1}`,
      2200,
    );
    if (peaceful && !restored)
      this.time.delayedCall(600, () => {
        if (this.app.run !== run || this.app.run.current !== node.id) return;
        if (node.kind === "shop") this.app.ui.shop();
        else if (node.kind === "event") this.app.ui.event();
        else if (node.kind === "reward") this.completeRoom();
        else this.app.ui.toast("Procure a memória junto às runas.");
      });
  }
  particleCount(): number {
    return this.app.store.data.settings.quality === "low"
      ? 65
      : this.app.store.data.settings.quality === "medium"
        ? 130
        : BALANCE.particleCap;
  }
  configureCamera(): void {
    const c = this.cameras.main;
    c.setZoom(0.95);
    c.centerOn(1055, 487);
    c.setBounds(150, -130, 1650, 1270);
  }
  buildEnvironment(biome: number, hub: boolean): void {
    const b = BIOMES[biome],
      color = Phaser.Display.Color.HexStringToColor(b.color).color;
    this.cameras.main.setBackgroundColor(hub ? "#0b1722" : b.dark);
    const bg = this.own(
      this.add
        .image(1050, 430, "tear")
        .setScale(1.2)
        .setAlpha(hub ? 0.32 : 0.11)
        .setDepth(-1000),
    );
    bg.setScrollFactor(0.8);
    // Extrude only exposed tile edges, following the actual room contour.
    const foundation = this.own(this.add.graphics().setDepth(-800));
    for (let y = 0; y < this.layout.height; y++)
      for (let x = 0; x < this.layout.width; x++) {
        if (!this.layout.cells[y][x]) continue;
        const bottom = project({ x: (x + 1) * TILE, y: (y + 1) * TILE });
        for (const [exposed, point, shade] of [
          [
            !this.layout.cells[y + 1]?.[x],
            { x: x * TILE, y: (y + 1) * TILE },
            0x24353c,
          ],
          [
            !this.layout.cells[y]?.[x + 1],
            { x: (x + 1) * TILE, y: y * TILE },
            0x15232d,
          ],
        ] as const) {
          if (!exposed) continue;
          const a = project(point);
          foundation.fillStyle(shade, 1);
          foundation.fillPoints(
            [
              new Phaser.Math.Vector2(a.x, a.y),
              new Phaser.Math.Vector2(bottom.x, bottom.y),
              new Phaser.Math.Vector2(bottom.x, bottom.y + 25),
              new Phaser.Math.Vector2(a.x, a.y + 25),
            ],
            true,
          );
          foundation.lineStyle(1, color, 0.28);
          foundation.lineBetween(a.x, a.y + 8, bottom.x, bottom.y + 8);
          foundation.lineStyle(2, 0x080f1b, 1);
          foundation.lineBetween(a.x, a.y + 25, bottom.x, bottom.y + 25);
        }
      }
    for (let y = 0; y < this.layout.height; y++)
      for (let x = 0; x < this.layout.width; x++)
        if (this.layout.cells[y][x]) {
          const p = project({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE }),
            cell = this.layout.cells[y][x];
          const adjacent = [
            this.layout.cells[y - 1]?.[x],
            this.layout.cells[y + 1]?.[x],
            this.layout.cells[y]?.[x - 1],
            this.layout.cells[y]?.[x + 1],
          ];
          const edge = adjacent.some((v) => !v);
          const variant = edge
            ? 0
            : cell === 1
              ? 1
              : (x * 7 + y * 11 + cell) % 12;
          this.own(
            this.add
              .image(p.x, p.y, `tiles${biome}`, `floor/${variant}`)
              .setOrigin(0.5, 59 / 96)
              .setScale(0.84)
              .setDepth(-500 + (x + y) * 0.01)
              .setTint(hub ? 0xb7bec6 : 0xffffff),
          );
        }
    // Central inlaid astrolabe, engraved onto the floor rather than a floating UI shape.
    const c = project({ x: 11.5 * TILE, y: 9.5 * TILE }),
      ornament = this.own(this.add.graphics().setDepth(-400));
    ornament.lineStyle(
      1,
      Phaser.Display.Color.HexStringToColor(b.accent).color,
      0.28,
    );
    ornament.strokeEllipse(c.x, c.y, 330, 163);
    ornament.strokeEllipse(c.x, c.y, 310, 153);
    ornament.strokeEllipse(c.x, c.y, 205, 101);
    for (let n = 0; n < 16; n++) {
      const a = (n / 16) * Math.PI * 2;
      ornament.lineBetween(
        c.x + Math.cos(a) * 110,
        c.y + Math.sin(a) * 54,
        c.x + Math.cos(a) * 149,
        c.y + Math.sin(a) * 73,
      );
    }
    ornament.lineStyle(1, color, 0.15);
    ornament.strokeTriangle(
      c.x,
      c.y - 48,
      c.x - 85,
      c.y + 24,
      c.x + 85,
      c.y + 24,
    );
    for (const p of this.layout.props) {
      const q = project(p);
      const image = this.own(
        this.add
          .image(
            q.x,
            q.y,
            "props",
            !hub && p.kind === "tree"
              ? ["tree", "forge", "shelf", "astrolabe"][biome]
              : p.kind,
          )
          .setOrigin(0.5, 0.9)
          .setScale(p.kind === "column" ? 1.18 : p.kind === "tree" ? 1.4 : 0.8)
          .setDepth(q.y),
      );
      if (biome === 1) image.setTint(0xe6aa81);
      if (biome === 2) image.setTint(0xa9b9ec);
      if (biome === 3) image.setTint(0xd2bd9d);
      if (["column", "tree", "forge", "shelf", "astrolabe"].includes(p.kind))
        this.trackOccluder(image, p.kind === "column" ? 0.23 : 0.4);
      this.props.push({
        data: p,
        image,
        hp: p.kind === "urn" ? 25 : p.kind === "flower" ? 12 : 999,
      });
    }
    for (const [x, y] of [
      [3, 3],
      [19, 3],
      [3, 15],
      [19, 15],
      [11, 2],
      [11, 16],
    ]) {
      const q = project({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
      const pillar = this.own(
        this.add
          .image(q.x, q.y, "props", "column")
          .setOrigin(0.5, 0.9)
          .setScale(1.22)
          .setDepth(q.y),
      );
      const torch = this.own(
        this.add
          .image(q.x, q.y - 5, "props", "torch")
          .setOrigin(0.5, 0.9)
          .setScale(0.8)
          .setDepth(q.y + 1),
      );
      this.trackOccluder(pillar, 0.23, [torch]);
    }
    const entry = project(this.layout.spawn);
    this.own(
      this.add
        .image(entry.x - 22, entry.y, "props", "portal")
        .setOrigin(0.5, 0.91)
        .setScale(1.1)
        .setAlpha(0.6)
        .setDepth(entry.y),
    );
    const out = project(this.layout.exit);
    this.exit = this.own(
      this.add
        .image(out.x, out.y, "props", "portal")
        .setOrigin(0.5, 0.91)
        .setScale(hub ? 1.55 : 1.2)
        .setDepth(out.y),
    );
    this.tweens.add({
      targets: this.exit,
      alpha: { from: 0.65, to: 1 },
      duration: 1700,
      yoyo: true,
      repeat: -1,
    });
    if (hub) {
      for (const p of [
        { x: 14 * TILE, y: 3 * TILE },
        { x: 18 * TILE, y: 4 * TILE },
      ]) {
        const q = project(p);
        this.own(
          this.add
            .image(q.x, q.y - 30, "props", "gear")
            .setOrigin(0.5, 0.65)
            .setScale(1.2)
            .setDepth(q.y),
        );
      }
    }
    this.ambient = this.own(this.add.graphics().setDepth(1999));
    this.telegraphs = this.own(this.add.graphics().setDepth(8));
    // Front pillars fade whenever Eira is behind them.
    for (const p of [
      { x: 2 * TILE, y: 15 * TILE },
      { x: 19 * TILE, y: 16 * TILE },
    ]) {
      const q = project(p);
      const foreground = this.own(
        this.add
          .image(
            q.x,
            q.y + 40,
            "props",
            hub ? "tree" : ["tree", "forge", "shelf", "astrolabe"][biome],
          )
          .setOrigin(0.5, 0.9)
          .setScale(hub || biome === 0 ? 2.5 : 1.9)
          .setDepth(q.y + 40)
          .setAlpha(0.7),
      );
      this.foreground.push(foreground);
      this.trackOccluder(foreground, 0.4);
    }
    for (const obj of this.roomObjects)
      if (
        obj instanceof Phaser.GameObjects.Image &&
        obj.texture.key === "props"
      ) {
        const kind = String(obj.frame.name);
        if ((ANIMATIONS.props as Record<string, number>)[kind])
          this.ambientAnimations.push({
            image: obj,
            kind,
            phase: this.ambientAnimations.length * 0.43,
          });
      }
    for (let i = 0; i < 70; i++)
      this.shots.push({
        active: false,
        pos: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        life: 0,
        damage: 0,
        friendly: false,
        image: this.own(
          this.add.image(0, 0, "mote").setVisible(false).setDepth(1800),
        ),
        pierce: 0,
        hit: new Set(),
      });
  }
  trackOccluder(
    image: Phaser.GameObjects.Image,
    widthRatio: number,
    attachments: Phaser.GameObjects.Image[] = [],
  ): void {
    this.occluders.push({
      image,
      attachments,
      restAlpha: image.alpha,
      halfWidth: image.displayWidth * widthRatio,
      height: image.displayHeight * 0.78,
    });
  }
  createMarkers(kind: string): void {
    const positions =
      kind === "escort" || kind === "defend"
        ? [{ x: 11.5 * TILE, y: 9.5 * TILE }]
        : this.layout.objectives;
    positions.forEach((p, i) => {
      const q = project(p);
      const image = this.own(
        this.add
          .image(q.x, q.y, "props", kind === "collect" ? "crystal" : "obelisk")
          .setOrigin(0.5, 0.9)
          .setScale(kind === "collect" ? 0.7 : 1.1)
          .setDepth(q.y),
      );
      const label = this.own(
        this.add
          .text(
            q.x,
            q.y - 116,
            kind === "puzzle"
              ? ["I", "II", "III"][i]
              : kind === "chains"
                ? "⛓"
                : kind === "defend"
                  ? "NÚCLEO"
                  : kind === "escort"
                    ? "ECO"
                    : "E",
            {
              fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
              fontSize: "20px",
              color: "#f1d99c",
              stroke: "#0b1722",
              strokeThickness: 4,
            },
          )
          .setOrigin(0.5)
          .setDepth(q.y + 1),
      );
      this.markers.push({
        pos: { ...p },
        image,
        label,
        progress: 0,
        done: false,
        hp: kind === "chains" ? 60 : 100,
      });
    });
  }
  spawnWave(count: number): void {
    const b = this.app.run!.nodes[this.app.run!.current].biome;
    const roster: EnemyKind[][] = [
      ["swordsman", "archer", "hound"],
      ["guardian", "automaton", "swordsman", "archer"],
      ["summoner", "wraith", "archer", "hound"],
      ["elite", "guardian", "wraith", "summoner"],
    ];
    for (let i = 0; i < count; i++)
      if (
        this.enemies.filter((e) => !e.health.dead).length < BALANCE.enemyCap
      ) {
        const p = this.layout.enemies[i % this.layout.enemies.length];
        this.spawnEnemy(pick(this.roomRng, roster[b]), {
          x: p.x + (i > 6 ? 15 : 0),
          y: p.y,
        });
      }
  }
  spawnEnemy(kind: EnemyKind, pos: Vec, boss = false): void {
    const b = this.app.run?.nodes[this.app.run.current].biome ?? 0,
      def = ENEMIES[kind],
      hp = boss ? 500 + b * 150 : def.hp * (1 + b * 0.19);
    const health = new Vitality(hp);
    this.enemies.push({
      id: this.id++,
      kind,
      pos: { ...pos },
      health,
      visual: new ActorVisual(this, boss ? `boss${b}` : kind, boss),
      state: "idle",
      timer: 0.4 + this.roomRng() * 0.8,
      angle: 0,
      path: [],
      repath: 0,
      attackCount: 0,
      boss,
      phase: 1,
      burn: 0,
      slow: 0,
      hpbar: this.add.graphics().setDepth(1700),
      target: { ...this.pos },
      attackResolved: false,
    });
  }
  move(p: Vec, dx: number, dy: number, radius = 14): void {
    const max = Math.max(Math.abs(dx), Math.abs(dy)),
      steps = Math.max(1, Math.ceil(max / 8));
    for (let i = 0; i < steps; i++) {
      if (walkable(this.layout, p.x + dx / steps, p.y, radius))
        p.x += dx / steps;
      if (walkable(this.layout, p.x, p.y + dy / steps, radius))
        p.y += dy / steps;
    }
  }
  aim(): number {
    const pointer = this.input.activePointer,
      p = unproject(this.cameras.main.getWorldPoint(pointer.x, pointer.y));
    return Math.atan2(p.y - this.pos.y, p.x - this.pos.x);
  }
  beginAttack(charged: boolean): void {
    if (this.isHub || !this.canAct() || this.dashTime > 0) return;
    if (this.attack && !this.attack.finished) {
      this.attackBuffer.request(charged);
      return;
    }
    const weapon = this.app.run!.weapon,
      w = WEAPONS[weapon];
    this.facing = this.aim();
    if (this.comboTime <= 0) this.combo = 0;
    if (!charged) this.combo = (this.combo % COMBOS[weapon].length) + 1;
    const move = comboMove(weapon, this.combo || 1),
      style = charged ? "charged" : move.animation,
      n = HERO_FRAMES[style];
    const duration =
      (w.duration * (charged ? 1.8 : move.duration)) /
      ((1 + Math.min(0.5, this.stats().attackSpeed ?? 0)) *
        this.needsEffects.attackRate);
    this.comboTime = duration + 1.1;
    this.attack = new AttackTimeline(
      n,
      duration,
      charged ? Math.floor(n * 0.4) : move.activeStart,
      charged ? Math.floor(n * 0.62) : move.activeEnd,
      this.facing,
      (charged ? 2.2 : move.power) * (this.lastDash > 0 ? 1.3 : 1),
      style,
    );
    this.comboHistory.push(style);
    this.comboHistory = this.comboHistory.slice(-18);
    this.chargeUsed = charged;
    this.player.restart();
    this.app.audio.play(
      weapon === "hammer" ? "hammer" : weapon === "bow" ? "bow" : "slash",
    );
  }
  specialAttack(): void {
    if (this.isHub || !this.canAct() || !this.special.use()) return;
    this.facing = this.aim();
    this.attack = new AttackTimeline(
      HERO_FRAMES.charged,
      0.6 /
        ((1 + Math.min(0.5, this.stats().attackSpeed ?? 0)) *
          this.needsEffects.attackRate),
      Math.floor(HERO_FRAMES.charged * 0.4),
      Math.floor(HERO_FRAMES.charged * 0.62),
      this.facing,
      2.1,
      "charged",
    );
    this.attack.hit.add(-100);
    const stats = this.stats();
    if (stats.reflect)
      for (const s of this.shots)
        if (s.active && !s.friendly && distance(s.pos, this.pos) < 240) {
          s.friendly = true;
          s.vel.x *= -1;
          s.vel.y *= -1;
          s.image.setTint(0xaaffdd);
        }
    this.app.audio.play("magic");
  }
  fire(
    pos: Vec,
    angle: number,
    speed: number,
    amount: number,
    friendly: boolean,
    pierce = 0,
    color?: number,
  ): void {
    const s = this.shots.find((x) => !x.active);
    if (!s) return;
    s.active = true;
    s.pos = { ...pos };
    s.vel = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
    s.life = 3;
    s.damage = amount;
    s.friendly = friendly;
    s.pierce = pierce;
    s.hit.clear();
    s.image
      .setVisible(true)
      .setTint(color ?? (friendly ? this.attackTint(0xc7ffe3) : 0xff997d))
      .setScale(friendly ? 0.9 : 1.05)
      .setBlendMode(Phaser.BlendModes.ADD);
  }
  applyPlayerHit(e: Enemy, amount: number, crit = false): void {
    if (e.health.dead) return;
    const stats = this.stats(),
      actual =
        amount *
        (1 + (stats.echo ?? 0)) *
        (e.health.hp / e.health.max < 0.35 ? 1 + (stats.execution ?? 0) : 1);
    e.health.hp = Math.max(0, e.health.hp - actual);
    e.health.dead = e.health.hp === 0;
    e.burn = stats.burn ? 3 : 0;
    e.slow = stats.slow ? 2 : 0;
    if (!e.boss) {
      e.state = "stunned";
      e.timer = this.app.run!.weapon === "hammer" ? 0.6 : 0.2;
      this.move(e.pos, Math.cos(this.facing) * 15, Math.sin(this.facing) * 15);
    }
    e.visual.sprite.setTintFill(0xf2fff4);
    this.time.delayedCall(75, () => {
      if (e.visual.sprite.active) e.visual.sprite.clearTint();
    });
    this.effects.burst(
      e.pos,
      crit ? 0xffda96 : 0xa4efcd,
      crit ? 12 : 7,
      150,
      this.facing,
    );
    this.number(e.pos, Math.round(actual), crit ? "#ffe4a1" : "#eaffeb", crit);
    this.hitstop = 0.035;
    this.app.audio.play("hit");
    if (this.app.store.data.settings.shake > 0)
      this.cameras.main.shake(70, 0.0015 * this.app.store.data.settings.shake);
    if (e.health.dead) this.killEnemy(e);
  }
  killEnemy(e: Enemy): void {
    if (e.state === "dead") return;
    e.state = "dead";
    e.timer = 0.8;
    e.visual.time = 0;
    this.effects.burst(
      e.pos,
      e.boss ? 0xffdda0 : ENEMIES[e.kind].color,
      e.boss ? 45 : 15,
      180,
    );
    const run = this.app.run!;
    const stats = this.stats();
    run.kills++;
    this.health.heal(stats.killHeal ?? 0);
    run.coins += 5 + (stats.gold ?? 0);
    this.ultimate = Math.min(
      100,
      this.ultimate + 8 * (1 + (stats.charge ?? 0)),
    );
    if (stats.explode)
      for (const other of this.enemies)
        if (
          !other.health.dead &&
          other.id !== e.id &&
          distance(e.pos, other.pos) < 120
        )
          this.applyPlayerHit(other, stats.explode);
    if (e.boss) {
      const b = run.nodes[run.current].biome;
      if (!this.app.store.data.bosses.includes(b))
        this.app.store.data.bosses.push(b);
      this.app.remember(["garden", "forge", "archive", "regent"][b]);
      this.app.store.data.echoes += 15 + b * 5;
      this.app.store.write();
      this.cameras.main.flash(300, 130, 210, 181);
      this.app.ui.announcement("FRAGMENTO RECUPERADO", BIOMES[b].boss, 3000);
    }
  }
  number(p: Vec, n: number, color: string, large = false): void {
    const q = project(p),
      text = this.own(
        this.add
          .text(q.x + Math.random() * 16 - 8, q.y - 65, String(n), {
            fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
            fontSize: large ? "32px" : "24px",
            color,
            stroke: "#13202c",
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(3000),
      );
    this.tweens.add({
      targets: text,
      y: "-=48",
      alpha: 0,
      duration: 700,
      ease: "Cubic.out",
      onComplete: () => text.destroy(),
    });
  }
  takeDamage(amount: number, environment = false): void {
    if (this.isHub || this.health.dead) return;
    const stats = this.stats();
    const value = Math.max(
      1,
      amount * (environment ? 1 : 1 - Math.min(0.7, stats.armor ?? 0)),
    );
    if (!this.health.hit(value, BALANCE.invulnerability, environment)) return;
    this.hurtTime = 0.24;
    this.objective.damageTaken += value;
    this.effects.burst(this.pos, 0xff968b, 12, 130);
    this.number(this.pos, Math.round(value), "#ffac96");
    this.app.audio.play("hurt");
    this.player.sprite.setTintFill(0xffb6a0);
    this.time.delayedCall(100, () => this.player.sprite?.clearTint());
    this.cameras.main.shake(160, 0.003 * this.app.store.data.settings.shake);
    if (this.health.dead) {
      this.player.time = 0;
      this.player.state = "death";
      this.app.audio.play("death");
      this.app.ui.announcement(
        "A LUZ NÃO SE APAGA",
        "O FAROL AINDA SE LEMBRA DE VOCÊ",
        2300,
      );
      this.time.delayedCall(1800, () => this.app.die());
    }
  }
  update(_time: number, ms: number): void {
    if (!this.ready || !this.player) return;
    const raw = Math.min(ms / 1000, 0.04);
    if (this.app.ui.screen !== "play") {
      this.effects.update(raw);
      this.decorTime += raw;
      this.idleDecor(raw);
      return;
    }
    this.intro = Math.max(0, this.intro - raw);
    if (this.hitstop > 0) {
      this.hitstop -= raw;
      return;
    }
    this.actions = new Set(this.pendingActions);
    this.pendingActions.clear();
    const dt = raw;
    this.elapsed += dt;
    this.resurrectTime = Math.max(0, this.resurrectTime - dt);
    this.hurtTime = Math.max(0, this.hurtTime - dt);
    this.lastDash = Math.max(0, this.lastDash - dt);
    this.decorTime += dt;
    this.health.tick(dt);
    this.dash.tick(dt);
    this.special.tick(dt);
    this.alternate.tick(dt);
    this.comboTime -= dt;
    this.attackBuffer.tick(dt);
    const stats = this.stats();
    this.special.duration =
      (this.app.run ? WEAPONS[this.app.run.weapon].special : 4) *
      (1 - Math.min(0.7, stats.cooldown ?? 0));
    this.dash.duration =
      BALANCE.dashCooldown * (1 - Math.min(0.65, stats.dash ?? 0));
    if (this.health.dead) {
      this.app.ui.updateHUD();
      this.player.update(
        this.pos,
        "death",
        this.facing,
        dt,
        Math.min(
          HERO_FRAMES.death - 1,
          Math.floor((this.player.time / 0.8) * HERO_FRAMES.death),
        ),
      );
      this.effects.update(dt);
      return;
    }
    const ppNeeds = project(this.pos),
      nearFire = this.ambientAnimations.some(
        (a) =>
          ["torch", "forge"].includes(a.kind) &&
          Math.hypot(a.image.x - ppNeeds.x, a.image.y - ppNeeds.y) < 85,
      );
    const exposureDamage = tickNeeds(
      this.needs,
      dt,
      this.app.run?.nodes[this.app.run.current].biome ?? 0,
      this.app.store.data.clothing,
      this.isHub,
      nearFire,
    );
    if (exposureDamage) this.takeDamage(exposureDamage, true);
    if (this.health.dead) return;
    if (this.consume("R"))
      this.app.consume(
        this.app.store.data.provisions.ration > 0 ? "ration" : "stew",
      );
    if (this.consume("T"))
      this.app.consume(
        this.app.store.data.provisions.water > 0 ? "water" : "tea",
      );
    this.survivalSaveTimer += dt;
    if (this.survivalSaveTimer >= 5) {
      this.survivalSaveTimer = 0;
      this.app.saveCheckpoint();
    }
    if (this.hold > 0) {
      this.hold += dt;
      if (this.hold > 0.65 && !this.chargeUsed) this.beginAttack(true);
    }
    if (
      this.consume("SPACE") &&
      this.canAct() &&
      (!this.attack || this.attack.cancellable) &&
      this.dash.use()
    ) {
      let dx = (this.keys.D.isDown ? 1 : 0) - (this.keys.A.isDown ? 1 : 0),
        dy = (this.keys.S.isDown ? 1 : 0) - (this.keys.W.isDown ? 1 : 0);
      const p = unproject({ x: 960 + dx, y: 40 + dy });
      if (!dx && !dy) {
        p.x = Math.cos(this.facing);
        p.y = Math.sin(this.facing);
      }
      const l = Math.hypot(p.x, p.y);
      this.dashVector = { x: p.x / l, y: p.y / l };
      this.dashTime = BALANCE.dashDuration;
      this.lastDash = 0.6;
      this.attackBuffer.clear();
      this.health.immune = BALANCE.dashDuration + (stats.iframes ?? 0);
      this.attack = null;
      this.objective.dashes++;
      this.effects.burst(this.pos, 0xb2ffe7, 12, 80);
      this.app.audio.play("dash");
      if (stats.dashFire)
        for (const e of this.enemies)
          if (!e.health.dead && distance(e.pos, this.pos) < 120)
            this.applyPlayerHit(e, stats.dashFire);
    }
    if (
      this.consume("SHIFT") &&
      !this.isHub &&
      this.canAct() &&
      this.alternate.use()
    ) {
      for (const e of this.enemies)
        if (!e.health.dead && distance(e.pos, this.pos) < 210) {
          e.slow = 5;
          this.applyPlayerHit(e, 20 * (1 + (stats.damage ?? 0)));
        }
      this.effects.burst(this.pos, 0xbdb2ff, 35, 220);
      this.app.audio.play("magic");
    }
    if (
      this.consume("Q") &&
      !this.isHub &&
      this.canAct() &&
      this.ultimate >= 100
    ) {
      this.ultimate = 0;
      for (const e of this.enemies)
        if (!e.health.dead) this.applyPlayerHit(e, 135);
      this.cameras.main.flash(280, 151, 224, 209);
      this.effects.burst(this.pos, 0xffedb6, 70, 360);
      this.health.immune = 1;
      this.app.audio.play("reward");
    }
    let moving = false;
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      this.move(
        this.pos,
        this.dashVector.x * BALANCE.dashSpeed * dt,
        this.dashVector.y * BALANCE.dashSpeed * dt,
      );
      this.effects.burst(this.pos, 0x9edcdb, 2, 15);
    } else if (this.canAct()) {
      const sx = (this.keys.D.isDown ? 1 : 0) - (this.keys.A.isDown ? 1 : 0),
        sy = (this.keys.S.isDown ? 1 : 0) - (this.keys.W.isDown ? 1 : 0);
      if (sx || sy) {
        const v = unproject({ x: 960 + sx, y: 40 + sy }),
          len = Math.hypot(v.x, v.y),
          speed =
            BALANCE.speed *
            (1 + (stats.speed ?? 0)) *
            this.needsEffects.speed *
            (this.attack?.active ? 0.5 : 1);
        this.move(this.pos, (v.x / len) * speed * dt, (v.y / len) * speed * dt);
        moving = true;
        if (!this.attack) this.facing = Math.atan2(v.y, v.x);
        this.stepTime += dt;
        if (this.stepTime > 0.3) {
          this.stepTime = 0;
          this.app.audio.play("step");
        }
      }
    }
    this.telegraphs.clear();
    if (this.attack) {
      const a = this.attack;
      const prev = a.frame;
      a.tick(dt);
      if (a.active || (prev < a.activeStart && a.frame > a.activeEnd))
        this.resolveAttack(a, stats);
      if (a.finished) this.attack = null;
      if (
        (!this.attack || a.frame >= Math.min(a.frames - 1, a.activeEnd + 2)) &&
        this.attackBuffer.remaining > 0
      ) {
        const queued = this.attackBuffer.take();
        this.attack = null;
        if (queued !== null) this.beginAttack(queued);
      }
    }
    const interacting =
      this.keys.E.isDown &&
      !moving &&
      this.objective.definition.interact &&
      this.markers.some((m) => !m.done && distance(this.pos, m.pos) < 80);
    const playerState =
      this.resurrectTime > 0
        ? "resurrect"
        : this.hurtTime > 0
          ? "hurt"
          : this.dashTime > 0
            ? "dash"
            : this.attack
              ? this.attack.style
              : interacting
                ? "interact"
                : moving
                  ? "run"
                  : "idle";
    this.player.update(
      this.pos,
      playerState,
      this.attack?.angle ?? this.facing,
      dt,
      playerState === this.attack?.style ? this.attack.frame : undefined,
    );
    this.player.sprite.setAlpha(
      this.health.immune > 0 && this.dashTime <= 0
        ? 0.65 + Math.sin(this.elapsed * 55) * 0.25
        : 1,
    );
    if (!this.isHub && this.intro <= 0) {
      this.updateEnemies(dt);
      this.updateShots(dt);
      this.updateObjectives(dt);
      this.updateDangers(dt);
      if (stats.regen) this.health.heal(stats.regen * dt);
    }
    this.effects.update(dt);
    this.idleDecor(dt);
    if (this.isHub) {
      this.updateHubInteraction();
    } else if (
      this.cleared &&
      distance(this.pos, this.layout.exit) < 95 &&
      this.consume("E")
    )
      this.app.nextRoom();
    const pp = project(this.pos),
      camera = this.cameras.main,
      centerX = 1050 + (pp.x - 1050) * 0.3,
      centerY = 480 + (pp.y - 480) * 0.3;
    camera.scrollX = Phaser.Math.Linear(
      camera.scrollX,
      centerX - camera.width / 2 / camera.zoom,
      0.025,
    );
    camera.scrollY = Phaser.Math.Linear(
      camera.scrollY,
      centerY - camera.height / 2 / camera.zoom,
      0.025,
    );
    this.hudTimer += dt;
    if (this.hudTimer > 0.1) {
      this.hudTimer = 0;
      this.app.ui.updateHUD();
    }
  }
  resolveAttack(a: AttackTimeline, stats: Record<string, number>): void {
    const run = this.app.run!,
      w = WEAPONS[run.weapon],
      isSpecial = a.hit.has(-100),
      move = comboMove(run.weapon, Number(a.style.replace("attack", "")) || 1),
      range =
        w.range *
        (isSpecial || a.style === "charged" ? 1 : move.range) *
        (1 + (stats.area ?? 0));
    const base =
      w.damage *
      this.needsEffects.damage *
      a.power *
      (1 + (stats.damage ?? 0)) *
      (a.style === "charged" ? 1 + (stats.charged ?? 0) : 1) *
      (isSpecial ? 1 + (stats.special ?? 0) : 1);
    if (!a.hit.has(-1)) {
      a.hit.add(-1);
      this.effects.burst(
        this.pos,
        this.attackTint(run.weapon === "hammer" ? 0xffcb88 : 0xb6ffe1),
        8,
        150,
        a.angle,
      );
      if (run.weapon === "bow") {
        for (const offset of isSpecial
          ? [-0.24, 0, 0.24]
          : a.style === "charged"
            ? [0]
            : move.arrows)
          this.fire(
            this.pos,
            a.angle + offset,
            640,
            base,
            true,
            (stats.pierce ?? 0) + (a.style === "charged" ? 2 : move.pierce),
          );
      }
    }
    if (run.weapon !== "bow")
      for (const e of this.enemies)
        if (
          !a.hit.has(e.id) &&
          !e.health.dead &&
          (isSpecial
            ? distance(this.pos, e.pos) < range * 1.5
            : inArc(
                this.pos,
                e.pos,
                a.angle,
                range,
                a.style === "charged"
                  ? run.weapon === "hammer"
                    ? 2
                    : 1.5
                  : move.arc,
              ))
        ) {
          a.hit.add(e.id);
          const crit = Math.random() < BALANCE.crit + (stats.crit ?? 0);
          this.applyPlayerHit(
            e,
            base *
              (crit ? BALANCE.critMultiplier + (stats.critDamage ?? 0) : 1),
            crit,
          );
        }
    for (let i = 0; i < this.markers.length; i++) {
      const m = this.markers[i];
      if (
        this.objective.kind === "chains" &&
        !m.done &&
        !a.hit.has(-10 - i) &&
        inArc(this.pos, m.pos, a.angle, range, 1.5)
      ) {
        a.hit.add(-10 - i);
        m.hp -= base;
        this.effects.burst(m.pos, 0xf6dca0, 10);
        if (m.hp <= 0) this.finishMarker(m);
      }
    }
    for (const p of this.props)
      if (
        p.hp < 999 &&
        p.hp > 0 &&
        inArc(this.pos, p.data, a.angle, range, 1.4)
      ) {
        p.hp = 0;
        p.image.setVisible(false);
        this.effects.burst(
          p.data,
          p.data.kind === "flower" ? 0xf3b391 : 0xcec6a0,
          16,
        );
        run.coins += 3;
        if (p.data.kind === "flower") {
          for (const e of this.enemies)
            if (!e.health.dead && distance(e.pos, p.data) < 150)
              this.applyPlayerHit(e, 42);
        }
      }
    // A luminous arc is drawn only during the same active frames as the hitbox.
    const q = project(this.pos),
      end = project({
        x: this.pos.x + Math.cos(a.angle) * range,
        y: this.pos.y + Math.sin(a.angle) * range,
      });
    if (run.weapon === "bow") return;
    if (a.style === "attack3" && run.weapon === "blade") {
      this.telegraphs.lineStyle(5, this.attackTint(0xc0f3d5), 0.75);
      this.telegraphs.lineBetween(q.x, q.y - 28, end.x, end.y - 28);
      return;
    }
    const trailArc = isSpecial
      ? Math.PI
      : a.style === "charged"
        ? 1.6
        : move.arc;
    this.telegraphs.lineStyle(
      isSpecial ? 10 : 5,
      this.attackTint(run.weapon === "hammer" ? 0xffd598 : 0xbcffe3),
      0.65,
    );
    this.telegraphs.beginPath();
    this.telegraphs.arc(
      q.x,
      q.y - 28,
      Math.min(92, Math.hypot(end.x - q.x, end.y - q.y)),
      Math.atan2(end.y - q.y, end.x - q.x) - trailArc,
      Math.atan2(end.y - q.y, end.x - q.x) + trailArc,
    );
    this.telegraphs.strokePath();
  }
  updateEnemies(dt: number): void {
    for (const e of this.enemies) {
      e.timer -= dt;
      e.repath -= dt;
      e.health.tick(dt);
      e.burn = Math.max(0, e.burn - dt);
      e.slow = Math.max(0, e.slow - dt);
      if (e.state === "dead") {
        e.visual.update(
          e.pos,
          "death",
          e.angle,
          dt,
          Math.min(
            framesFor(
              e.boss
                ? `boss${this.app.run!.nodes[this.app.run!.current].biome}`
                : e.kind,
              "death",
            ) - 1,
            Math.floor(
              ((0.8 - e.timer) / 0.8) *
                framesFor(
                  e.boss
                    ? `boss${this.app.run!.nodes[this.app.run!.current].biome}`
                    : e.kind,
                  "death",
                ),
            ),
          ),
        );
        e.hpbar.clear();
        if (e.timer < 0) {
          e.visual.sprite.setVisible(false);
          e.visual.shadow.setVisible(false);
        }
        continue;
      }
      if (e.burn > 0) {
        if (Math.random() < dt * 8) this.effects.burst(e.pos, 0xffad72, 1, 24);
        e.health.hp -= this.stats().burn * dt;
        if (e.health.hp <= 0) {
          e.health.dead = true;
          this.killEnemy(e);
          continue;
        }
      }
      const d = distance(e.pos, this.pos);
      e.angle = Math.atan2(this.pos.y - e.pos.y, this.pos.x - e.pos.x);
      if (e.boss) {
        this.updateBoss(e, dt);
        continue;
      }
      const def = ENEMIES[e.kind];
      if (e.state === "stunned") {
        if (e.timer <= 0) {
          e.state = "recover";
          e.timer = 0.25;
        }
      } else if (e.state === "telegraph") {
        const p = project(e.pos),
          target = project(e.target);
        this.telegraphs.lineStyle(2, 0xffa186, 0.7);
        this.telegraphs.strokeEllipse(
          p.x,
          p.y,
          def.range < 150 ? def.range * 1.6 : 60,
          def.range < 150 ? def.range * 0.8 : 30,
        );
        this.telegraphs.lineBetween(p.x, p.y - 20, target.x, target.y - 20);
        if (e.timer <= 0) {
          e.state = "attack";
          e.timer = 0.3;
          e.attackCount++;
          e.attackResolved = false;
        }
      } else if (e.state === "attack") {
        if (!e.attackResolved && e.timer <= 0.18) {
          e.attackResolved = true;
          this.enemyAttack(e);
        }
        if (e.timer <= 0) {
          e.state = "recover";
          e.timer = def.cooldown;
        }
      } else if (e.state === "recover") {
        if (e.timer <= 0) e.state = "chase";
      } else {
        const ranged = ["archer", "summoner", "wraith"].includes(e.kind);
        let target = { ...this.pos };
        if (ranged && d < 190) {
          e.state = "retreat";
          target = {
            x: e.pos.x - Math.cos(e.angle) * 100,
            y: e.pos.y - Math.sin(e.angle) * 100,
          };
        } else if (ranged && d < def.range) {
          e.state = "reposition";
          target = {
            x: e.pos.x + Math.cos(e.angle + 1.57) * 50,
            y: e.pos.y + Math.sin(e.angle + 1.57) * 50,
          };
        } else e.state = d > 380 ? "investigate" : "chase";
        if (e.repath <= 0) {
          e.path = findPath(this.layout, e.pos, target);
          e.repath = 0.45 + this.roomRng() * 0.25;
        }
        const path = e.path[0];
        if (path) {
          if (distance(e.pos, path) < 12) e.path.shift();
          else {
            const a = Math.atan2(path.y - e.pos.y, path.x - e.pos.x),
              speed =
                def.speed *
                (e.slow > 0
                  ? 1 - Math.min(0.75, this.stats().slow ?? 0.35)
                  : 1);
            this.move(
              e.pos,
              Math.cos(a) * speed * dt,
              Math.sin(a) * speed * dt,
            );
          }
        }
        for (const other of this.enemies)
          if (
            other.id !== e.id &&
            !other.health.dead &&
            distance(other.pos, e.pos) < 34
          ) {
            const a = Math.atan2(e.pos.y - other.pos.y, e.pos.x - other.pos.x);
            this.move(e.pos, Math.cos(a) * 20 * dt, Math.sin(a) * 20 * dt);
          }
        if (d < def.range && e.timer <= 0) {
          e.state = "telegraph";
          e.target = { ...this.pos };
          e.timer =
            e.kind === "guardian" ? 0.9 : e.kind === "automaton" ? 0.9 : 0.65;
        }
      }
      const state =
        e.state === "telegraph"
          ? "charge"
          : e.state === "attack"
            ? "attack"
            : e.state === "recover"
              ? "recover"
              : e.state === "stunned"
                ? "hurt"
                : ["chase", "retreat", "reposition", "investigate"].includes(
                      e.state,
                    )
                  ? "move"
                  : "idle";
      const phaseFrame =
        e.state === "telegraph"
          ? Math.floor(
              (1 -
                e.timer /
                  (e.kind === "guardian" || e.kind === "automaton"
                    ? 0.9
                    : 0.65)) *
                framesFor(e.kind, "charge"),
            )
          : e.state === "attack"
            ? Math.floor((1 - e.timer / 0.3) * framesFor(e.kind, "attack"))
            : undefined;
      e.visual.update(e.pos, state, e.angle, dt, phaseFrame);
      this.drawEnemyBar(e);
    }
  }
  enemyAttack(e: Enemy): void {
    const def = ENEMIES[e.kind],
      a = Math.atan2(e.target.y - e.pos.y, e.target.x - e.pos.x);
    if (e.kind === "archer" || e.kind === "wraith") {
      for (const offset of e.kind === "wraith" ? [-0.18, 0.18] : [0])
        this.fire(e.pos, a + offset, 240, def.damage, false);
    } else if (e.kind === "summoner") {
      this.addDanger(e.target, 78, 0.9, def.damage, e.id);
      if (this.enemies.filter((x) => !x.health.dead).length < 10)
        this.spawnEnemy("hound", { x: e.pos.x + 22, y: e.pos.y + 22 });
    } else if (e.kind === "automaton") {
      this.addDanger(e.pos, 125, 0.18, def.damage, e.id);
      e.health.dead = true;
      e.health.hp = 0;
      this.killEnemy(e);
    } else {
      if (distance(e.pos, this.pos) < def.range + 20)
        this.takeDamage(def.damage);
      if (
        this.objective.kind === "defend" &&
        this.markers[0] &&
        distance(e.pos, this.markers[0].pos) < 140
      )
        this.objective.integrity -= 12;
    }
  }
  updateBoss(e: Enemy, dt: number): void {
    const b = this.app.run!.nodes[this.app.run!.current].biome;
    const phase =
      e.health.hp < e.health.max * 0.3
        ? 3
        : e.health.hp < e.health.max * 0.62
          ? 2
          : 1;
    if (phase > e.phase) {
      e.phase = phase;
      e.timer = 1.4;
      e.state = "recover";
      this.effects.burst(e.pos, 0xffd391, 50, 250);
      this.cameras.main.flash(180, 90 + b * 20, 50, 60);
      this.app.ui.announcement(
        phase === 2 ? "O TEMPO SE PARTE" : "A ÚLTIMA LEMBRANÇA",
        `FASE ${phase}`,
        1600,
      );
    }
    const d = distance(e.pos, this.pos);
    if (e.state === "telegraph") {
      const q = project(e.pos),
        target = project(e.target);
      this.telegraphs.lineStyle(3, 0xffb88a, 0.7);
      this.telegraphs.strokeEllipse(q.x, q.y, 180, 90);
      this.telegraphs.lineBetween(q.x, q.y, target.x, target.y);
      if (e.timer <= 0) {
        e.state = "attack";
        e.timer = e.attackCount % 4 === 0 ? 0.75 : 0.35;
        e.attackResolved = false;
      }
    } else if (e.state === "attack") {
      const duration = e.attackCount % 4 === 0 ? 0.75 : 0.35;
      if (!e.attackResolved && e.timer <= duration * 0.65) {
        e.attackResolved = true;
        this.bossAttack(e, b);
      }
      if (e.attackCount % 4 === 0) {
        const a = Math.atan2(e.target.y - e.pos.y, e.target.x - e.pos.x);
        this.move(e.pos, Math.cos(a) * 390 * dt, Math.sin(a) * 390 * dt, 22);
        this.effects.burst(e.pos, 0xb1ead6, 2, 40);
        if (distance(e.pos, this.pos) < 85) this.takeDamage(23 + b * 3);
      }
      if (e.timer <= 0) {
        e.state = "recover";
        e.timer = (e.phase === 1 ? 1.8 : 1.15) - (b === 1 ? 0.1 : 0);
      }
    } else if (e.timer <= 0) {
      e.attackCount++;
      e.state = "telegraph";
      e.target = { ...this.pos };
      e.timer = e.phase === 1 ? 1.1 : 0.75;
    } else if (e.state !== "recover" && d > 130) {
      const a = e.angle;
      this.move(e.pos, Math.cos(a) * 65 * dt, Math.sin(a) * 65 * dt, 22);
    }
    e.visual.update(
      e.pos,
      e.state === "telegraph"
        ? "charge"
        : e.state === "attack"
          ? BOSS_PATTERNS[e.attackCount % 4]
          : e.phase > 1
            ? "phase"
            : "idle",
      e.angle,
      dt,
      e.state === "telegraph"
        ? Math.floor(
            (1 - e.timer / (e.phase === 1 ? 1.1 : 0.75)) *
              ANIMATIONS.boss.charge,
          )
        : e.state === "attack"
          ? Math.floor(
              (1 - e.timer / (e.attackCount % 4 === 0 ? 0.75 : 0.35)) *
                ANIMATIONS.boss[BOSS_PATTERNS[e.attackCount % 4]],
            )
          : undefined,
    );
    this.drawEnemyBar(e);
  }
  bossAttack(e: Enemy, b: number): void {
    const pattern = e.attackCount % 4,
      a = Math.atan2(e.target.y - e.pos.y, e.target.x - e.pos.x),
      phase = e.phase;
    this.app.audio.play("magic");
    if (pattern === 0) {
      this.addDanger(e.target, 95, 0.65, 25 + b * 3, e.id);
    } else if (pattern === 1) {
      const count = 5 + b + phase;
      for (let i = 0; i < count; i++)
        this.fire(
          e.pos,
          a + (i - (count - 1) / 2) * 0.21,
          200 + phase * 20,
          14 + b * 2,
          false,
        );
      if (b === 2) this.addDanger(this.pos, 100, 1.4, 18, e.id);
    } else if (pattern === 2) {
      for (let i = 0; i < 3 + phase; i++) {
        const angle = (i / (3 + phase)) * Math.PI * 2;
        const p = {
          x: Math.max(120, Math.min(840, this.pos.x + Math.cos(angle) * 115)),
          y: Math.max(120, Math.min(690, this.pos.y + Math.sin(angle) * 115)),
        };
        this.addDanger(p, 80 + b * 8, 1 + i * 0.1, 18 + b * 2, e.id);
      }
      if (
        b === 0 &&
        phase >= 2 &&
        this.enemies.filter((x) => !x.health.dead).length < 5
      )
        this.spawnEnemy("wraith", this.layout.enemies[0]);
    } else {
      const count = 10 + phase * 3;
      for (let i = 0; i < count; i++)
        this.fire(
          e.pos,
          (i / count) * Math.PI * 2 + e.attackCount * 0.2,
          160 + phase * 15,
          12 + b * 2,
          false,
        );
      if (b === 1 || b === 3)
        this.addDanger({ x: 11.5 * TILE, y: 9.5 * TILE }, 170, 1.5, 24, e.id);
    }
  }
  drawEnemyBar(e: Enemy): void {
    e.hpbar.clear();
    if (e.boss || e.health.hp >= e.health.max) return;
    const q = project(e.pos);
    const y = Math.round(q.y - e.visual.height - 7);
    e.hpbar.fillStyle(0x10252c, 0.9);
    e.hpbar.fillRect(Math.round(q.x) - 18, y, 36, 4);
    e.hpbar.fillStyle(0xc7a782, 1);
    e.hpbar.fillRect(
      Math.round(q.x) - 18,
      y,
      Math.round((36 * e.health.hp) / e.health.max),
      4,
    );
  }
  addDanger(
    pos: Vec,
    radius: number,
    delay: number,
    damage: number,
    source: number,
  ): void {
    this.danger.push({
      pos: { ...pos },
      radius,
      remaining: delay,
      duration: delay,
      damage,
      fired: false,
      source,
    });
  }
  updateDangers(dt: number): void {
    for (const d of this.danger) {
      d.remaining -= dt;
      const q = project(d.pos),
        f = 1 - Math.max(0, d.remaining) / d.duration;
      this.telegraphs.fillStyle(
        d.remaining > 0 ? 0xe18b75 : 0xffd0a0,
        d.remaining > 0 ? 0.1 + f * 0.13 : 0.5,
      );
      this.telegraphs.fillEllipse(q.x, q.y, d.radius * 1.7, d.radius * 0.86);
      this.telegraphs.lineStyle(2, 0xf6ad88, 0.7);
      this.telegraphs.strokeEllipse(
        q.x,
        q.y,
        d.radius * 1.7 * f,
        d.radius * 0.86 * f,
      );
      if (d.remaining <= 0 && !d.fired) {
        d.fired = true;
        if (distance(d.pos, this.pos) < d.radius) this.takeDamage(d.damage);
        if (
          this.objective.kind === "defend" &&
          this.markers[0] &&
          distance(d.pos, this.markers[0].pos) < d.radius
        )
          this.objective.integrity -= 16;
        this.effects.burst(d.pos, 0xffb083, 20, 180);
      }
    }
    this.danger = this.danger.filter((d) => d.remaining > -0.25);
  }
  updateShots(dt: number): void {
    for (const s of this.shots) {
      if (!s.active) continue;
      s.life -= dt;
      s.pos.x += s.vel.x * dt;
      s.pos.y += s.vel.y * dt;
      const q = project(s.pos);
      s.image
        .setPosition(Math.round(q.x), Math.round(q.y) - 29)
        .setDepth(q.y + 0.2)
        .setRotation(
          Math.atan2(
            s.vel.y * 0.48 + s.vel.x * 0.48,
            (s.vel.x - s.vel.y) * 0.94,
          ),
        );
      if (!walkable(this.layout, s.pos.x, s.pos.y, 3) || s.life <= 0) {
        s.active = false;
        s.image.setVisible(false);
        continue;
      }
      // Mirror props reverse hostile projectiles; a short lifetime cap prevents loops.
      if (!s.friendly)
        for (const p of this.props)
          if (p.data.kind === "mirror" && distance(p.data, s.pos) < 26) {
            s.friendly = true;
            s.vel.x *= -1;
            s.vel.y *= -1;
            s.image.setTint(0xb7ffe0);
          }
      if (s.friendly) {
        for (const e of this.enemies)
          if (
            !e.health.dead &&
            !s.hit.has(e.id) &&
            distance(e.pos, s.pos) < (e.boss ? 50 : 24)
          ) {
            s.hit.add(e.id);
            const stats = this.stats(),
              crit = Math.random() < BALANCE.crit + (stats.crit ?? 0);
            this.applyPlayerHit(
              e,
              s.damage *
                (crit ? BALANCE.critMultiplier + (stats.critDamage ?? 0) : 1),
              crit,
            );
            if (s.pierce-- <= 0) {
              s.active = false;
              s.image.setVisible(false);
              break;
            }
          }
        if (this.objective.kind === "chains")
          for (const m of this.markers)
            if (!m.done && distance(m.pos, s.pos) < 28) {
              m.hp -= s.damage;
              if (m.hp <= 0) this.finishMarker(m);
              s.active = false;
              s.image.setVisible(false);
            }
      } else if (distance(this.pos, s.pos) < 20) {
        this.takeDamage(s.damage);
        s.active = false;
        s.image.setVisible(false);
      }
    }
  }
  finishMarker(m: Marker): void {
    if (m.done) return;
    m.done = true;
    m.image.setTint(0xc3ffe0).setAlpha(0.45);
    m.label.setText("✓");
    this.objective.add();
    this.effects.burst(m.pos, 0xe5ffc5, 20, 160);
    this.app.audio.play("reward");
  }
  updateObjectives(dt: number): void {
    const o = this.objective;
    o.tick(dt);
    if (o.state === "failed") return;
    const alive = this.enemies.filter((e) => !e.health.dead).length;
    if (this.pendingWave > 0 && alive === 0) {
      this.pendingWave--;
      this.spawnWave(3 + this.app.run!.nodes[this.app.run!.current].biome);
    }
    if (this.waveTimer > 0 && o.state === "active") {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0 && alive < 5) {
        this.spawnWave(2);
        this.waveTimer = 10;
      }
    }
    if (
      o.kind === "eliminate" &&
      alive === 0 &&
      this.pendingWave === 0 &&
      o.state === "active"
    )
      o.add(o.target);
    if (o.kind === "defend" && o.state === "active") {
      o.add(dt);
      if (this.elapsed % 1 < dt && this.markers[0]) {
        const near = this.enemies.filter(
          (e) => !e.health.dead && distance(e.pos, this.markers[0].pos) < 95,
        ).length;
        o.integrity -= near * 4;
      }
      if (o.integrity <= 0) {
        o.fail();
        this.app.ui.failedObjective();
        return;
      }
      this.markers[0]?.label.setText(`${Math.ceil(o.integrity)}%`);
    }
    if (o.kind === "escort" && o.state === "active" && this.escort) {
      if (distance(this.pos, this.escort) < 160) {
        this.escort.x += dt * 9;
        o.add(dt * 3.5);
        this.effects.burst(this.escort, 0xb4eaff, 1, 10);
      }
      const q = project(this.escort);
      this.markers[0]?.image.setPosition(q.x, q.y);
      this.markers[0]?.label.setPosition(q.x, q.y - 100).setText("ECO");
    }
    for (let i = 0; i < this.markers.length; i++) {
      const m = this.markers[i];
      if (m.done) continue;
      const d = distance(this.pos, m.pos);
      if (o.kind === "collect" && d < 55) this.finishMarker(m);
      if (
        ["purify", "seal"].includes(o.kind) &&
        d < 80 &&
        this.keys.E.isDown &&
        o.state === "active"
      ) {
        m.progress += dt;
        m.label.setText(
          `${Math.min(100, Math.floor((m.progress / 2) * 100))}%`,
        );
        this.effects.burst(m.pos, 0xc7f8cf, 1, 20);
        if (m.progress >= 2) this.finishMarker(m);
      }
      if (o.kind === "puzzle" && d < 80 && this.consume("E")) {
        if (i === o.progress) this.finishMarker(m);
        else {
          this.app.ui.toast("A inscrição começa em I. A ordem foi reiniciada.");
          o.progress = 0;
          for (const mark of this.markers) {
            mark.done = false;
            mark.image.clearTint().setAlpha(1);
            mark.label.setText(["I", "II", "III"][this.markers.indexOf(mark)]);
          }
        }
      }
    }
    if (o.state === "completed" && alive === 0 && !this.cleared)
      this.completeRoom();
    if (this.cleared && distance(this.pos, this.layout.exit) < 135)
      this.app.ui.interaction("E", "ATRAVESSAR O PORTAL");
    else if (!this.cleared) {
      const close = this.markers.some(
        (m) => !m.done && distance(this.pos, m.pos) < 80,
      );
      this.app.ui.interaction(
        close && o.definition.interact ? "E" : "",
        close && o.definition.interact
          ? o.kind === "puzzle"
            ? "ATIVAR RUNA"
            : "SEGURAR PARA CANALIZAR"
          : "",
      );
    } else this.app.ui.interaction("", "");
  }
  completeRoom(): void {
    if (this.cleared) return;
    this.cleared = true;
    const run = this.app.run!,
      node = run.nodes[run.current];
    this.objective.state = "completed";
    const bonus = this.objective.secondary().filter((x) => x.success).length;
    run.coins += 20 + bonus * 8;
    const salvage = awardRoomSalvage(this.app.store.data, node, run.visited);
    if (salvage) grantSurvivalLoot(this.app.store.data, node);
    if (salvage)
      this.app.ui.toast(
        `Materiais preservados: ${MATERIALS.filter((m) => salvage[m.id] > 0)
          .map((m) => `${salvage[m.id]} ${m.name}`)
          .join(" · ")} · +2 Ecos`,
      );
    this.health.heal(this.stats().heal ?? 0);
    run.hp = this.health.hp;
    run.charge = this.ultimate;
    this.app.store.data.run = run;
    this.app.store.write();
    this.exit.setTint(0xcbffcf);
    this.app.audio.combat = false;
    this.app.audio.play("reward");
    this.app.ui.announcement(
      "CÂMARA RESTAURADA",
      `+${20 + bonus * 8} ÓBOLOS · ${bonus} DESAFIOS CONCLUÍDOS`,
      2100,
    );
    if (node.kind === "boss" && node.biome === 3)
      this.time.delayedCall(1500, () => this.app.ui.endingChoice());
    else if (!["event", "shop", "explore", "secret"].includes(node.kind)) {
      this.rewardPending = true;
      this.time.delayedCall(650, () => this.app.ui.rewards());
    }
  }
  updateHubInteraction(): void {
    const npc = this.npcs
      .filter((n) => this.nearNpc(n.id))
      .sort((a, b) => distance(a.pos, this.pos) - distance(b.pos, this.pos))[0];
    if (npc) {
      const def = HUB_NPCS.find((n) => n.id === npc.id)!;
      this.app.ui.interaction(
        "E",
        `CONVERSAR COM ${def.name.toUpperCase()} · ${def.role}`,
      );
      if (this.consume("E")) this.app.ui.dialogue(npc.id);
    } else if (distance(this.pos, this.layout.exit) < 120) {
      this.app.ui.interaction("E", "INICIAR EXPEDIÇÃO");
      if (this.consume("E")) this.app.ui.expedition();
    } else this.app.ui.interaction("", "");
  }
  idleDecor(dt: number): void {
    if (!this.effects) return;
    const actors = [
      project(this.pos),
      ...this.npcs.map((n) => project(n.pos)),
      ...this.enemies.filter((e) => !e.health.dead).map((e) => project(e.pos)),
    ];
    for (const o of this.occluders) {
      const blocked = actors.some((actor) =>
        obscuresActor(
          {
            x: o.image.x,
            y: o.image.y,
            halfWidth: o.halfWidth,
            height: o.height,
          },
          actor,
        ),
      );
      o.image.setAlpha(
        approachAlpha(o.image.alpha, blocked ? 0.22 : o.restAlpha, dt),
      );
      for (const attachment of o.attachments)
        attachment.setAlpha(o.image.alpha);
    }
    for (const actor of this.npcs)
      actor.visual.update(
        actor.pos,
        this.app.ui.activeNpc === actor.id ? "interact" : "idle",
        0,
        dt,
      );
    for (const a of this.ambientAnimations) {
      if (a.image.active && a.image.visible) {
        const n = (ANIMATIONS.props as Record<string, number>)[a.kind];
        a.image.setFrame(
          `${a.kind}/0/${Math.floor((this.decorTime + a.phase) * 8) % n}`,
        );
      }
    }

    const quality = this.app.store.data.settings.quality;
    const rate = quality === "low" ? 10 : quality === "medium" ? 25 : 42;
    if (Math.random() < dt * rate) {
      this.effects.ambient(
        400 + Math.random() * 1350,
        100 + Math.random() * 750,
        this.isHub
          ? 0xa8d1cc
          : Phaser.Display.Color.HexStringToColor(
              BIOMES[this.app.run?.nodes[this.app.run.current].biome ?? 0]
                .color,
            ).color,
      );
    }
    if (this.app.ui.screen !== "play")
      this.player.update(this.pos, "idle", this.facing, dt);
    this.ambient.clear();
    if (quality !== "low") {
      this.ambient.fillStyle(this.isHub ? 0x9eb6be : 0x8bafbd, 0.016);
      for (let i = 0; i < (quality === "high" ? 5 : 2); i++)
        this.ambient.fillEllipse(
          600 + i * 230 + Math.sin(this.decorTime * 0.12 + i) * 90,
          250 + i * 110,
          660,
          100,
        );
    }
  }
  testSnapshot(): object {
    return {
      pos: { ...this.pos },
      hp: this.health.hp,
      room: this.app.run?.current ?? -1,
      alive: this.enemies.filter((e) => !e.health.dead).length,
      objective: this.objective.state,
      cleared: this.cleared,
      attacking: !!this.attack,
      weapon: this.app.run?.weapon,
      runKills: this.app.run?.kills ?? 0,
      hub: this.isHub,
    };
  }
}
