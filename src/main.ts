import Phaser from "phaser";
import "./style.css";
import "./pixel-theme.css";
import "./progression.css";
import "./survival.css";
import "./exploration.css";
import "./arsenal.css";
import "./village.css";
import "./polish.css";
import type {
  Run,
  WeaponId,
  InfusionId,
  ConsumableId,
  ClothingId,
} from "./types";
import { SaveStore, finishRun, newRun } from "./game/save";
import { AudioDirector } from "./game/audio";
import { VoiceDirector } from "./game/voices";
import { parseSave } from "./game/save";
import { Preload, World } from "./game/world";
import { UI } from "./ui";
import { MEMORIES } from "./data/narrative";
import { project, unproject, walkable } from "./game/procedural";
import { isWeapon, equipWeapon, WEAPONS } from "./game/weapons";
import { learnMastery } from "./game/mastery";
import { BALANCE, TILE } from "./game/config";
import { phaseState, spendPhaseLoot } from "./game/loot";
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
  voice = new VoiceDirector(this.store.data.settings, speaking => this.audio.setSpeaking(speaking));
  ui = new UI(this);
  world!: World;
  run: Run | null = null;
  campaignActive = false;
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
    window.addEventListener("pagehide", () => { this.saveCheckpoint(); this.voice.stop(); });
    document.addEventListener("visibilitychange", () => { if (document.hidden) { this.saveCheckpoint(); this.voice.stop(); this.ui.autoPause(); } });
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
    this.campaignActive = true;
    this.store.data.recovering = false;
    this.audio.start();
    this.remember("first");
    this.run = newRun(
      seed.trim() || `AURORA-${Date.now().toString(36).toUpperCase()}`,
      this.weapon,
      BALANCE.hp + (skillStats(this.store.data).hp ?? 0),
    );
    this.run.loadout = { ...this.store.data.loadout };
    this.run.charge = skillStats(this.store.data).startingCharge ?? 0;
    this.run.needs = { ...this.store.data.needs };
    this.store.data.run = this.run;
    this.store.write();
    this.ui.screen = "play";
    this.ui.close();
    this.world.enterRoom();
    this.saveCheckpoint();
  }
  continueRun(): void {
    if (this.store.data.run) {
      this.campaignActive = true;
      this.run = structuredClone(this.store.data.run);
      this.weapon = this.run.weapon;
      this.ui.screen = "play";
      this.ui.close();
      this.world.enterRoom(true);
      this.audio.start();
    }
  }
  hub(): void {
    this.campaignActive = true;
    const saved = this.store.data.location?.area === "hub" && !this.store.data.recovering ? this.store.data.location.pos : undefined;
    this.run = null;
    this.ui.screen = "play";
    this.world.enterHub(this.store.data.recovering === true);
    if (saved && walkable(this.world.layout, saved.x, saved.y)) { this.world.pos = { ...saved }; this.world.configureCamera(); }
    this.ui.close();
    this.audio.start();
    this.saveCheckpoint();
  }
  returnToHub(): void {
    if (
      !this.run || this.world.isHub || !this.world.cleared ||
      this.world.rewardPending || this.world.health.dead ||
      !["play", "pause", "victory"].includes(this.ui.screen)
    ) return;
    this.saveCheckpoint();
    phaseState(this.run).atRisk = {};
    this.store.write();
    this.hub();
    this.ui.toast("Expedição preservada. Use o portão da vila para continuar.");
  }
  saveCheckpoint(): void {
    if (!this.campaignActive || !this.world?.ready || ["death", "victory", "loading"].includes(this.ui.screen)) return;
    if (this.run && !this.world.isHub && this.world.health.dead) { this.die(); return; }
    if (this.run && !this.world.isHub && !this.world.health.dead) {
      this.run.hp = this.world.health.hp;
      this.run.charge = this.world.ultimate;
      this.store.data.needs = { ...this.run.needs };
      this.store.data.run = this.run;
      this.run.checkpoint = this.world.captureCheckpoint();
      this.store.data.location = { area: "expedition", pos: { ...this.world.pos } };
    } else if (this.world.isHub) {
      this.store.data.location = { area: "hub", pos: { ...this.world.pos } };
      if (this.store.data.run) this.store.data.run.needs = { ...this.store.data.needs };
    }
    this.store.write();
    this.ui.updateSaveStatus();
  }
  resumeCampaign(): void { if (this.store.data.location?.area === "hub" || !this.store.data.run) this.hub(); else this.continueRun(); }
  async loadCampaign(id: string): Promise<void> {
    const target = this.store.campaigns.find(c => c.id === id); if (!target || this.loadingCampaign) return;
    this.loadingCampaign = true; this.saveCheckpoint(); this.voice.stop();
    try {
      for (const weapon of new Set([target.data.equipped, ...Object.values(target.data.loadout), ...(target.data.run ? [target.data.run.weapon] : [])])) await this.world.ensureWeapon(weapon);
      this.store.selectCampaign(id); this.syncCampaign(); this.resumeCampaign();
    } catch { this.ui.toast("Não foi possível carregar esta campanha. Seu save continua guardado."); }
    finally { this.loadingCampaign = false; }
  }
  loadingCampaign = false;
  private syncCampaign(): void { this.run = null; this.weapon = this.store.data.equipped; this.audio.settings = this.store.data.settings; this.voice.settings = this.store.data.settings; this.audio.apply(); }
  createCampaign(name: string): void {
    this.saveCheckpoint(); this.voice.stop();
    try { this.store.createCampaign(name); this.syncCampaign(); this.hub(); }
    catch (e) { this.ui.toast((e as Error).message); }
  }
  exportCampaign(): void {
    this.saveCheckpoint();
    const campaign = this.store.activeCampaign;
    const blob = new Blob([JSON.stringify({ format: "vespera-campaign", version: 1, name: campaign.name, save: this.store.data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `vespera-${campaign.name.normalize("NFD").replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 40)}.json`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async importCampaign(file: File): Promise<void> {
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("O backup deve ter até 2 MB.");
      const x = JSON.parse(await file.text()), raw = x.format === "vespera-campaign" ? x.save : x;
      if (raw?.version !== 2) throw new Error("Este arquivo não é um save de Véspera.");
      const data = parseSave(JSON.stringify(raw));
      this.saveCheckpoint(); this.store.createCampaign(typeof x.name === "string" ? x.name : "Campanha importada", data);
      this.syncCampaign(); await this.world.ensureWeapon(data.run?.weapon ?? data.equipped); this.resumeCampaign();
      this.ui.toast("Backup importado em uma campanha separada.");
    } catch (e) { this.ui.toast((e as Error).message || "Não foi possível ler o backup."); }
  }
  nextRoom(id?: number): void {
    if (!this.run) return;
    if (!this.world.cleared || this.world.rewardPending || !phaseState(this.run).gateOpened) {
      this.ui.toast("O portão precisa ser aberto com a chave desta fase."); return;
    }
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
    this.run.checkpoint = undefined;
    this.store.data.run = this.run;
    this.store.write();
    this.ui.close();
    this.ui.screen = "play";
    this.world.enterRoom();
    this.saveCheckpoint();
  }
  die(): void {
    if (!this.run) return;
    const run = this.run;
    finishRun(this.store.data, run, "death");
    this.store.write();
    this.ui.death(run);
    this.run = null;
  }
  ending(choice: "restore" | "preserve"): void {
    if (!this.run || !phaseState(this.run).gateOpened) return;
    const run = this.run;
    finishRun(this.store.data, run, "victory");
    if (!this.store.data.endings.includes(choice))
      this.store.data.endings.push(choice);
    if (!this.store.data.achievements.includes("aurora"))
      this.store.data.achievements.push("aurora");
    this.store.write();
    this.ui.victory(choice, run);
    this.run = null;
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
  async unlock(weapon: WeaponId): Promise<void> {
    if (
      !this.ui.hasService("forge") ||
      !isWeapon(weapon)
    )
      return;
    const s = this.store.data;
    if (!s.unlocked.includes(weapon)) {
      this.craft(weapon, "forge");
      return;
    }
    await this.world.ensureWeapon(weapon);
    equipWeapon(s, weapon);
    this.weapon = weapon;
    this.world.showWeapon(weapon);
    this.store.write();
    this.audio.play("ui");
    this.ui.armory();
  }
  async equip(id: WeaponId): Promise<void> {
    if (!isWeapon(id) || !this.store.data.unlocked.includes(id) || this.world.health.dead || !["inventory", "expedition"].includes(this.ui.screen)) return;
    const screen = this.ui.screen;
    await this.world.ensureWeapon(id);
    if (this.ui.screen !== screen) return;
    equipWeapon(this.store.data, id);
    this.weapon = id;
    if (this.run) { this.run.loadout[WEAPONS[id].slot] = id; this.run.weapon = id; }
    this.world.showWeapon(id);
    this.saveCheckpoint();
    if (screen === "inventory") this.ui.inventory("equipment", true);
    else {
      const value = (document.getElementById("seed-input") as HTMLInputElement)?.value ?? "";
      this.ui.expedition();
      (document.getElementById("seed-input") as HTMLInputElement).value = value;
    }
  }
  mastery(id: WeaponId, node: string): void {
    if (!this.ui.hasService("forge")) return;
    const reason = learnMastery(this.store.data, id, node);
    if (reason) { this.ui.toast(reason); return; }
    this.store.write(); this.ui.mastery(id); this.audio.play("hammer");
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
    if (this.run) spendPhaseLoot(this.run, id);
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
        const center = project(w.pos);
        w.cameras.main.centerOn(center.x, center.y);
        w.spawnEnemy("guardian", { x: 440, y: 400 });
        w.enemies[0].health.hp = hp;
        w.enemies[0].health.max = Math.max(hp, 130);
        w.enemies[0].timer = 99;
        w.enemies[0].state = "recover";
        w.arrivals.forEach(a => { a.image.destroy(); a.label.destroy(); }); w.arrivals = [];
        w.pendingWave = 0;
        w.stageZones = w.stage.zones.map((_, i) => i);
        w.relays.forEach(m => { m.done = true; m.label.setText("✓"); });
        w.intro = 0;
      },
      aimKey: () => {
        const w = app.world, p = project(w.stage.keyHiding.pos), c = w.cameras.main;
        return { x: (p.x - c.scrollX) * c.zoom + c.width * (1 - c.zoom) / 2, y: (p.y - c.scrollY) * c.zoom + c.height * (1 - c.zoom) / 2 };
      },
      villageOverview: () => { const c = app.world.cameras.main; c.setZoom(.54); const p = project({ x: 18 * TILE, y: 16 * TILE }); c.centerOn(p.x, p.y); },
      revealKey: () => { if (!app.world.isHub) app.world.breakProp(app.world.stage.keyHiding.prop); },
      nearKey: () => { if (!app.world.isHub) { const p = app.world.stage.keyHiding.pos; app.world.pos = { x: p.x - 35, y: p.y }; const q = project(app.world.pos); app.world.cameras.main.centerOn(q.x, q.y); } },
      unlockGate: () => {
        if (!app.run || app.world.isHub) return;
        Object.assign(phaseState(app.run), { keyRevealed: true, keyFound: true, gateOpened: true });
        app.world.exit.setFrame("gate-open"); app.saveCheckpoint();
      },
      villageRoute: (id: import("./types").NpcId) => app.world.guideToNpc(id),
      finishRoom: () => {
        const w = app.world;
        w.enemies.forEach(e => { e.health.dead = true; e.health.hp = 0; e.state = "dead"; });
        w.relays.forEach(m => { m.done = true; });
        w.objective.state = "completed"; w.objective.progress = w.objective.target;
        w.completeRoom();
      },
      loadWeapon: (id: WeaponId) => app.world.ensureWeapon(id),
      positionHazard: (index = 0) => {
        const w = app.world, c = w.stage.challenge;
        w.pos = { ...c.hazards[index] }; w.elapsed = 3.25 - c.offset - index * 1.1 + c.period;
        w.health.immune = 0;
      },
      queueReinforcement: () => app.world.queueEnemy("hound", app.world.stage.route[0]),
      portal: () => {
        const w = app.world;
        w.pos = { ...(w.isHub ? w.layout.exit : w.stage.gate.approach) };
        const q = project(w.pos); w.cameras.main.centerOn(q.x, q.y);
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
        app.run!.loadout[WEAPONS[weapon].slot] = weapon;
        app.world.enterRoom();
        app.world.showWeapon(weapon);
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
        campaign: { id: app.store.activeId, name: app.store.activeCampaign.name, count: app.store.campaigns.length, available: app.store.available },
        voice: { status: app.voice.status, request: app.voice.lastRequest },
        combo: app.world.combo,
        comboHistory: [...app.world.comboHistory],
        buffered: app.world.attackBuffer.remaining,
        playerAnimation: app.world.player?.state,
        playerFrame: app.world.player?.sprite.frame.name,
        playerTexture: app.world.player?.texture,
        activeWeapon: app.run?.weapon ?? app.weapon,
        loadout: app.run?.loadout ?? app.store.data.loadout,
        weaponXP: app.store.data.weaponXP,
        chestInteraction: app.world.chestInteraction,
        arrivals: app.world.arrivals.map(a => ({ pos: a.pos, remaining: a.remaining })),
        enemies: app.world.enemies.map(e => ({ pos: e.pos, dead: e.health.dead, state: e.state, weapon: e.lastHitWeapon })),
        playerMaxHP: app.world.health.max,
        playerHP: app.world.health.hp,
        playerPosition: { ...app.world.pos },
        environment: app.world.environment && app.world.landscapeGround ? {
          theme: app.world.environment.theme,
          props: app.world.environment.props.length,
          ground: app.world.landscapeGround.getBounds(),
          viewport: { start: app.world.cameras.main.getWorldPoint(0, 0), end: app.world.cameras.main.getWorldPoint(app.world.cameras.main.width, app.world.cameras.main.height) },
          cachedGrounds: app.world.textures.getTextureKeys().filter(key => key.startsWith("landscape-ground-")).length,
        } : null,
        needs: { ...app.world.needs },
        needsEffects: app.world.needsEffects,
        phaseLoot: app.run ? structuredClone(phaseState(app.run)) : null,
        objectiveProgress: app.world.objective.progress,
        objectiveTarget: app.world.objective.target,
        stage: {
          geometry: app.world.layout.cells.map(row => row.map(c => c ? 1 : 0).join("")).join("/"),
          width: app.world.layout.width, height: app.world.layout.height,
          relays: app.world.relays.map(m => ({ pos: m.pos, done: m.done })),
          markers: app.world.markers.map(m => ({ pos: m.pos, done: m.done })),
          props: app.world.props.map((p, i) => ({ index: i, kind: p.data.kind, pos: {x: p.data.x, y: p.data.y}, hp: p.hp, visible: p.image.visible, frame: p.image.frame.name })),
          secretDoor: app.world.stage.secretDoor,
          challenge: app.world.stage.challenge,
          design: app.world.stage.design,
          keyHiding: app.world.stage.keyHiding,
          gateFrame: app.world.exit.frame.name,
          gateOpening: app.world.gateOpening,
          gate: app.world.stage.gate,
          exit: app.world.layout.exit,
          hint: app.world.isHub ? "" : app.world.stageHint(),
          stageRequirement: app.world.isHub ? true : app.world.stageRequirement(),
          entrances: app.world.stage.entrances,
          goal: app.world.isHub ? null : app.world.navigationGoal(),
        },
        village: app.world.isHub ? { houses: app.world.villageHouses.map(h => ({ npc: h.npc, roofAlpha: h.roof.alpha, frame: h.body.frame.name })), target: app.world.villageTarget, pathLength: app.world.villagePath.length } : null,
        npc: app.ui.activeNpc,
        hubNpcs: app.world.npcs.map((n) => ({
          id: n.id,
          pos: { ...n.pos },
          walkable: walkable(app.world.layout, n.pos.x, n.pos.y),
        })),
        combatStats: app.world.stats(),
        terrainSpeed: app.world.terrainSpeed(),
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
            ["column", "lighthouse"].includes(String(o.image.frame.name)) &&
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
      clearEncounter: (skipRelays = true) => {
        for (const e of app.world.enemies) {
          e.health.dead = true;
          e.state = "dead";
          e.timer = 0;
        }
        app.world.pendingWave = 0;
        app.world.waveTimer = 0;
        app.world.stageZones = (app.world.stage.zones ?? []).map((_, i) => i);
        if (skipRelays) app.world.relays.forEach(m => { m.done = true; m.label.setText("✓"); });
      },
      positionRelay: (index: number) => {
        const marker = app.world.relays[index]; if (marker) app.world.pos = { ...marker.pos };
      },
      positionProp: (kind: string, ordinal = 0) => {
        const prop = app.world.props.filter(p => p.data.kind === kind)[ordinal];
        if (prop) app.world.pos = { x: prop.data.x - (kind === "secret-wall" ? 0 : 35), y: prop.data.y - (kind === "secret-wall" ? 50 : 0) };
      },
      aimProp: (kind: string, ordinal = 0) => {
        const prop = app.world.props.filter(p => p.data.kind === kind)[ordinal];
        const p = project(prop?.data ?? app.world.pos), c = app.world.cameras.main;
        return { x: (p.x - c.scrollX) * c.zoom + c.width * (1 - c.zoom) / 2, y: (p.y - c.scrollY) * c.zoom + c.height * (1 - c.zoom) / 2 };
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
