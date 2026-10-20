import Phaser from "phaser";
import "./style.css";
import "./pixel-theme.css";
import "./progression.css";
import "./survival.css";
import type {
  Run,
  WeaponId,
  InfusionId,
  ConsumableId,
  ClothingId,
} from "./types";
import { SaveStore, finishRun, newRun } from "./game/save";
import { AudioDirector } from "./game/audio";
import { Preload, World } from "./game/world";
import { UI } from "./ui";
import { MEMORIES } from "./data/narrative";
import { project, unproject, walkable } from "./game/procedural";
import { BALANCE } from "./game/config";
import { obscuresActor } from "./game/presentation";
import { learnSkill, resetSkills, skillStats } from "./data/skills";
import { craftWeapon, type CraftAction } from "./game/crafting";
import {
  craftSurvival,
  consumeProvision,
  SURVIVAL_RECIPES,
  CLOTHING,
} from "./game/survival";

export class App {
  store = new SaveStore();
  audio = new AudioDirector(this.store.data.settings);
  ui = new UI(this);
  world!: World;
  run: Run | null = null;
  weapon: WeaponId = this.store.data.equipped;
  game: Phaser.Game;
  constructor() {
    this.game = new Phaser.Game({
      type:
        new URLSearchParams(location.search).get("renderer") === "canvas"
          ? Phaser.CANVAS
          : Phaser.AUTO,
      parent: "game",
      backgroundColor: "#08111d",
      width: 1440,
      height: 900,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
        powerPreference: "high-performance",
      },
      input: { activePointers: 1 },
      scene: [new Preload(this), new World(this)],
      audio: { noAudio: true },
      fps: { target: 60, forceSetTimeOut: false },
    });
    window.addEventListener("pagehide", () => this.saveCheckpoint());
    window.addEventListener("keydown", (e) => {
      if (
        e.code === "KeyI" && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey &&
        !(e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]"))
      ) {
        e.preventDefault();
        this.ui.toggleInventory();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        this.ui.escape();
      }
      if (e.key === "Tab" && this.ui.screen === "play") {
        e.preventDefault();
        this.ui.map();
      }
      if (e.key === "F1") {
        e.preventDefault();
        this.ui.controls();
      }
    });
  }
  remember(id: string): void {
    if (!this.store.data.memories.includes(id))
      this.store.data.memories.push(id);
    this.store.write();
  }
  start(seed: string): void {
    this.audio.start();
    this.remember("first");
    this.run = newRun(
      seed.trim() || `AURORA-${Date.now().toString(36).toUpperCase()}`,
      this.weapon,
      BALANCE.hp + (skillStats(this.store.data).hp ?? 0),
    );
    this.run.charge = skillStats(this.store.data).startingCharge ?? 0;
    this.run.needs = { ...this.store.data.needs };
    this.store.data.run = this.run;
    this.store.write();
    this.ui.screen = "play";
    this.ui.close();
    this.world.enterRoom();
  }
  continueRun(): void {
    if (this.store.data.run) {
      this.run = structuredClone(this.store.data.run);
      this.weapon = this.run.weapon;
      this.ui.screen = "play";
      this.ui.close();
      this.world.enterRoom();
      this.audio.start();
    }
  }
  hub(): void {
    this.run = null;
    this.ui.screen = "play";
    this.world.enterHub();
    this.ui.close();
    this.audio.start();
  }
  returnToHub(): void {
    if (
      !this.run || this.world.isHub || !this.world.cleared ||
      this.world.rewardPending || this.world.health.dead ||
      !["play", "pause", "victory"].includes(this.ui.screen)
    ) return;
    this.saveCheckpoint();
    this.hub();
    this.ui.toast("Expedição preservada. Use o portal para continuar.");
  }
  saveCheckpoint(): void {
    if (this.run && !this.world?.health.dead) {
      this.run.hp = this.world.health.hp;
      this.run.charge = this.world.ultimate;
      this.store.data.needs = { ...this.run.needs };
      this.store.data.run = this.run;
    } else if (!this.run && this.store.data.run)
      this.store.data.run.needs = { ...this.store.data.needs };
    this.store.write();
  }
  nextRoom(id?: number): void {
    if (!this.run) return;
    const node = this.run.nodes[this.run.current];
    if (id === undefined && node.next.length > 1) {
      this.ui.routes(node.next);
      return;
    }
    const next = id ?? node.next[0];
    if (next === undefined) {
      this.ui.endingChoice();
      return;
    }
    if (!node.next.includes(next)) return;
    this.run.hp = this.world.health.hp;
    this.run.charge = this.world.ultimate;
    this.run.current = next;
    this.store.data.run = this.run;
    this.store.write();
    this.ui.close();
    this.ui.screen = "play";
    this.world.enterRoom();
  }
  die(): void {
    if (!this.run) return;
    const run = this.run;
    finishRun(this.store.data, run, "death");
    this.store.write();
    this.ui.death(run);
  }
  ending(choice: "restore" | "preserve"): void {
    if (!this.run) return;
    const run = this.run;
    finishRun(this.store.data, run, "victory");
    if (!this.store.data.endings.includes(choice))
      this.store.data.endings.push(choice);
    if (!this.store.data.achievements.includes("aurora"))
      this.store.data.achievements.push("aurora");
    this.store.write();
    this.ui.victory(choice, run);
  }
  buyTalent(key: string): void {
    if (!this.ui.hasService("skills")) {
      this.ui.toast(
        "Converse com Sálvia no Farol para desenvolver habilidades.",
      );
      return;
    }
    const reason = learnSkill(this.store.data, key);
    if (reason) {
      this.ui.toast(reason);
      return;
    }
    this.store.write();
    if (this.world.isHub) {
      this.world.health.max = this.world.maxHP();
      this.world.health.resurrect();
    }
    this.ui.talents();
    this.audio.play("reward");
  }
  respec(): void {
    if (!this.ui.hasService("skills")) return;
    const refund = resetSkills(this.store.data);
    this.world.health.max = this.world.maxHP();
    this.world.health.resurrect();
    this.store.write();
    this.ui.talents();
    this.ui.toast(`${refund} Ecos devolvidos. Escolha novos caminhos.`);
  }
  craft(
    id: WeaponId,
    action: CraftAction,
    infusion: InfusionId = "none",
  ): void {
    if (!this.ui.hasService("forge")) {
      this.ui.toast("Converse com Orren no Farol para usar a forja.");
      return;
    }
    const reason = craftWeapon(this.store.data, id, action, infusion);
    if (reason) {
      this.ui.toast(reason);
      return;
    }
    this.store.write();
    this.ui.armory();
    this.audio.play("hammer");
    this.ui.toast(
      action === "forge"
        ? "Arma forjada. Ela já pode ser equipada."
        : action === "upgrade"
          ? "Arma aprimorada permanentemente."
          : "Infusão aplicada à arma.",
    );
  }
  unlock(weapon: WeaponId): void {
    if (
      !this.ui.hasService("forge") ||
      !["blade", "hammer", "bow"].includes(weapon)
    )
      return;
    const s = this.store.data;
    if (!s.unlocked.includes(weapon)) {
      this.craft(weapon, "forge");
      return;
    }
    this.weapon = weapon;
    s.equipped = weapon;
    this.store.write();
    this.audio.play("ui");
    this.ui.armory();
  }
  craftProvision(id: string): void {
    const r = SURVIVAL_RECIPES.find((r) => r.id === id);
    if (!r || !this.ui.hasService(r.service)) {
      this.ui.toast("Converse com o responsável por esta receita no Farol.");
      return;
    }
    const reason = craftSurvival(this.store.data, id);
    if (reason) {
      this.ui.toast(reason);
      return;
    }
    this.store.write();
    this.ui.survivalCraft();
    this.audio.play("reward");
    this.ui.toast(
      id === "cloak" || id === "coat"
        ? "Vestimenta confeccionada e equipada."
        : "Provisão preparada e guardada na mochila.",
    );
  }
  wear(id: ClothingId): void {
    const inInventory = this.ui.screen === "inventory" && !this.world.health.dead;
    if (
      (!inInventory && !this.ui.hasService("clothes")) ||
      !this.store.data.wardrobe.includes(id) ||
      !CLOTHING.some((c) => c.id === id)
    )
      return;
    this.store.data.clothing = id;
    this.store.write();
    if (inInventory) this.ui.inventory("clothes", true);
    else this.ui.survivalCraft();
  }
  consume(id: ConsumableId): void {
    if (
      !["play", "provisions", "inventory"].includes(this.ui.screen) ||
      this.world.health.dead
    )
      return;
    const reason = consumeProvision(this.store.data, this.world.needs, id);
    if (reason) {
      this.ui.toast(reason);
      return;
    }
    this.saveCheckpoint();
    this.audio.play("reward");
    if (this.ui.screen === "inventory") this.ui.inventory(this.ui.inventoryTab, true);
    else if (this.ui.screen === "provisions") this.ui.provisions();
    else this.ui.updateHUD();
    this.ui.toast("Provisão consumida.");
  }
}
export const app = new App();
// Opt-in deterministic QA harness. It is absent from ordinary game sessions.
if (new URLSearchParams(location.search).get("test") === "1") {
  Object.assign(window, {
    vesperaTest: {
      snapshot: () => app.world?.testSnapshot(),
      start: (seed = "TEST-AURORA") => app.start(seed),
      prepareCombat: (hp = 18) => {
        const w = app.world;
        w.enemies.forEach((e) => {
          e.visual.destroy();
          e.hpbar.destroy();
        });
        w.enemies = [];
        w.pos = { x: 400, y: 400 };
        w.spawnEnemy("guardian", { x: 440, y: 400 });
        w.enemies[0].health.hp = hp;
        w.enemies[0].health.max = Math.max(hp, 130);
        w.enemies[0].timer = 99;
        w.enemies[0].state = "recover";
        w.pendingWave = 0;
        w.intro = 0;
      },
      portal: () => {
        app.world.pos = { ...app.world.layout.exit };
      },
      aimPoint: () => {
        const w = app.world,
          e = w.enemies.find((e) => !e.health.dead),
          p = project(e?.pos ?? w.pos),
          c = w.cameras.main;
        return {
          x: (p.x - c.scrollX) * c.zoom + (c.width * (1 - c.zoom)) / 2,
          y: (p.y - c.scrollY) * c.zoom + (c.height * (1 - c.zoom)) / 2,
        };
      },
      scenario: (room: number, weapon: WeaponId = "blade") => {
        app.start("QA-CAMPAIGN");
        app.run!.current = room;
        app.run!.weapon = weapon;
        app.world.enterRoom();
        app.world.intro = 0;
      },
      bossPhase: (ratio: number) => {
        const e = app.world.enemies.find((e) => e.boss);
        if (e) e.health.hp = e.health.max * ratio;
      },
      ultimate: () => {
        app.world.ultimate = 100;
        for (const e of app.world.enemies) e.health.hp = 1;
      },
      snapshotFull: () => ({
        screen: app.ui.screen,
        combo: app.world.combo,
        comboHistory: [...app.world.comboHistory],
        buffered: app.world.attackBuffer.remaining,
        playerAnimation: app.world.player?.state,
        playerFrame: app.world.player?.sprite.frame.name,
        playerMaxHP: app.world.health.max,
        needs: { ...app.world.needs },
        needsEffects: app.world.needsEffects,
        npc: app.ui.activeNpc,
        hubNpcs: app.world.npcs.map((n) => ({
          id: n.id,
          pos: { ...n.pos },
          walkable: walkable(app.world.layout, n.pos.x, n.pos.y),
        })),
        combatStats: app.world.stats(),
        targets: app.world.enemies.map((e) => ({
          hp: e.health.hp,
          burn: e.burn,
          slow: e.slow,
        })),
        presentation: {
          playerScale: app.world.player.sprite.scaleX,
          playerHeight: app.world.player.height,
          playerDepth: app.world.player.sprite.depth,
          shadowWidth: app.world.player.shadow.displayWidth,
          occluders: app.world.occluders.map((o) => ({
            x: o.image.x,
            y: o.image.y,
            alpha: o.image.alpha,
            depth: o.image.depth,
            restAlpha: o.restAlpha,
          })),
        },
        ambientFrames: app.world.ambientAnimations.map(
          (a) => a.image.frame.name,
        ),
        activeProjectiles: app.world.shots
          .filter((s) => s.active)
          .map((s) => ({
            friendly: s.friendly,
            pierce: s.pierce,
            damage: s.damage,
          })),
        elapsed: app.world.elapsed,
        clockPaused: app.world.time.paused,
        keyboardEnabled: app.world.input.keyboard!.enabled,
        intro: app.world.intro,
        paused: app.game.isPaused,
        fps: app.game.loop.actualFps,
        bosses: app.store.data.bosses,
        endings: app.store.data.endings,
        phase: app.world.enemies.find((e) => e.boss)?.phase,
        assets: app.game.textures.getTextureKeys(),
        shotCount: app.world.shots.filter((s) => s.active).length,
        dangers: app.world.danger.length,
      }),
      positionObjective: (i: number) => {
        const m = app.world.markers[i];
        if (m) app.world.pos = { x: m.pos.x - 20, y: m.pos.y };
      },
      occlusionProbe: (behind: boolean) => {
        const index = app.world.occluders.findIndex(
          (o) =>
            o.image.frame.name === "column" &&
            app.world.npcs.every(
              (n) =>
                !obscuresActor(
                  {
                    x: o.image.x,
                    y: o.image.y,
                    halfWidth: o.halfWidth,
                    height: o.height,
                  },
                  project(n.pos),
                ),
            ),
        );
        const o = app.world.occluders[index];
        if (o)
          app.world.pos = unproject({
            x: o.image.x,
            y: o.image.y + (behind ? -24 : 24),
          });
        return index;
      },
      lethal: () => {
        app.world.health.immune = 0;
        app.world.takeDamage(9999);
      },
      nearNpc: (id: string) => {
        const n = app.world.npcs.find((n) => n.id === id);
        if (n) app.world.pos = { x: n.pos.x - 34, y: n.pos.y + 14 };
      },
      setNeeds: (hunger: number, thirst: number, cold: number) => {
        Object.assign(app.world.needs, { hunger, thirst, cold, strain: 0 });
      },
      tryService: (service: string, value = "") =>
        app.ui.action(service, value),
      clearEncounter: () => {
        for (const e of app.world.enemies) {
          e.health.dead = true;
          e.state = "dead";
          e.timer = 0;
        }
        app.world.pendingWave = 0;
      },
      step: (seconds: number) => {
        for (let n = 0; n < seconds / 0.04; n++) app.world.update(0, 40);
      },
      objective: (kind: import("./types").ObjectiveKind) => {
        if (app.run) {
          app.run.nodes[app.run.current].objective = kind;
          app.world.enterRoom();
          app.world.intro = 0;
        }
      },
      memories: () => MEMORIES,
    },
  });
}
