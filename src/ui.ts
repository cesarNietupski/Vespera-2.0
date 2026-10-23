import type { App } from "./main";
import type {
  Run,
  WeaponId,
  InfusionId,
  NpcId,
  NpcService,
  ConsumableId,
  ClothingId,
  Loot,
} from "./types";
import { BALANCE, BIOMES, WEAPONS } from "./game/config";
import { BOONS, SCHOOL_COLORS, boonStats } from "./data/boons";
import { dialogue, MEMORIES, CONVERSATIONS } from "./data/narrative";
import { CHARACTER_VOICES } from "./game/voices";
import { rng } from "./game/procedural";
import { navigationPath } from "./game/exploration";
import { phaseState, LOOT_ITEMS } from "./game/loot";
import type { VillageLayout } from "./game/village";
import { TILE } from "./game/config";
import { WEAPON_IDS, isWeapon } from "./game/weapons";
import { masteryTree, masteryBlock, UPGRADE_XP } from "./game/mastery";
import { comboMove } from "./game/combos";
import { OBJECTIVES } from "./game/objectives";
import { HUB_NPCS, hubNpc } from "./data/npcs";
import {
  CONSUMABLES,
  CLOTHING,
  SURVIVAL_MATERIALS,
  SURVIVAL_RECIPES,
  survivalCraftBlock,
  consumableBlock,
} from "./game/survival";
import {
  SKILLS,
  SKILL_BRANCHES,
  skillRank,
  skillCost,
  skillBlock,
  skillStats,
  skillRefund,
  type SkillBranch,
} from "./data/skills";
import {
  MATERIALS,
  INFUSIONS,
  recipe,
  craftBlock,
  progressionStats,
  weaponName,
  type Recipe,
  type CraftAction,
} from "./game/crafting";

export type Screen =
  | "loading"
  | "menu"
  | "play"
  | "pause"
  | "dialogue"
  | "rewards"
  | "settings"
  | "armory"
  | "mastery"
  | "talents"
  | "gallery"
  | "map"
  | "expedition"
  | "death"
  | "victory"
  | "shop"
  | "event"
  | "routes"
  | "controls"
  | "credits"
  | "survivalCraft"
  | "provisions"
  | "inventory"
  | "campaigns"
  | "newCampaign"
  | "campaignDelete";
type InventoryTab = "provisions" | "resources" | "clothes" | "equipment";
const escape = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const icons = { diamond: "◇", sun: "☼", echo: "◈", blade: "⟋", map: "⌘" };
export class UI {
  activeNpc: NpcId | null = null;
  screen: Screen = "loading";
  root = document.getElementById("ui")!;
  overlay: HTMLElement;
  hudEl: HTMLElement;
  toastTimer = 0;
  announcementTimer = 0;
  previous: Screen = "menu";
  skillBranch: SkillBranch = "vigor";
  forgeMode: CraftAction = "forge";
  infusionChoice: InfusionId = "glass";
  inventoryTab: InventoryTab = "provisions";
  xpTimer = 0;
  lootTimers = new Map<string, number>();
  managementReturn: Screen = "menu";
  currentLine = "";
  private markupCache = new WeakMap<HTMLElement, string>();
  constructor(public app: App) {
    this.root.innerHTML =
      '<div id="hud"></div><div id="overlay"></div><div id="announcement" aria-live="polite"></div><div id="toast" role="status"></div><div id="interaction"></div>';
    this.overlay = document.getElementById("overlay")!;
    this.hudEl = document.getElementById("hud")!;
    this.root.insertAdjacentHTML("beforeend", '<aside id="loot-feed" aria-live="polite" aria-label="Recursos coletados na fase"></aside>');
    this.root.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
      if (b) {
        this.app.audio.play("ui");
        this.action(b.dataset.action!, b.dataset.value ?? "");
      }
    });
    this.root.addEventListener("input", (e) => {
      const el = e.target as HTMLInputElement;
      if (el.dataset.setting) {
        const settings = this.app.store.data.settings;
        const k = el.dataset.setting as "sfx" | "music" | "shake" | "voice";
        settings[k] = Number(el.value) / 100;
        this.app.audio.apply();
        if (k === "voice") this.app.voice.stop();
        this.app.store.write();
        el.parentElement!.querySelector("output")!.textContent = `${el.value}%`;
      }
    });
    this.root.addEventListener("change", e => {
      const el = e.target as HTMLInputElement;
      if (el.dataset.campaignImport !== undefined && el.files?.[0]) void this.app.importCampaign(el.files[0]);
      if (el.dataset.voiceAuto !== undefined) { this.app.store.data.settings.voiceAuto = el.checked; this.app.store.write(); this.app.voice.stop(); }
    });
    this.root.addEventListener("keydown", e => {
      if (e.key === "Enter" && (e.target as HTMLElement).id === "campaign-name") { e.preventDefault(); this.action("createCampaign", ""); }
      if (e.key !== "Tab" || !this.overlay.querySelector('[role="dialog"]')) return;
      const controls = Array.from(this.overlay.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]'));
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    });
    this.app.voice.onStatus = status => {
      const el = document.getElementById("voice-status");
      if (el) el.textContent = status === "speaking" ? "Falando em português" : status === "unavailable" ? "Voz local em português indisponível · legendas ativas" : status === "muted" ? "Leitura automática desativada" : "Voz pronta";
    };
  }
  button(
    label: string,
    action: string,
    value = "",
    cls = "",
    blocked = "",
  ): string {
    return `<button class="${cls}" data-action="${action}" data-value="${escape(value)}"${blocked ? ` disabled aria-disabled="true" title="${escape(blocked)}"` : ""}>${label}</button>`;
  }
  px(name: string, cls = ""): string {
    return `<img class="px-icon ${cls}" src="assets/icon-${name}.png" alt="" aria-hidden="true">`;
  }
  skill(id: string, label: string, icon: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    const html = label || this.px(icon);
    if (el.innerHTML !== html) el.innerHTML = html;
  }
  loading(p: number): void {
    if (this.screen !== "loading") return;
    this.overlay.innerHTML = `<div class="loader"><div class="sigil">☼</div><span class="eyebrow">REUNINDO AS MEMÓRIAS</span><div class="loading-track"><i style="width:${p * 100}%"></i></div><small>${Math.floor(p * 100)}%</small></div>`;
  }
  error(s: string): void {
    this.overlay.innerHTML = `<div class="panel"><h2>A luz encontrou um obstáculo.</h2><p>${escape(s)}</p></div>`;
  }
  menu(): void {
    this.app.campaignActive = false;
    this.app.voice.stop(); this.clearLoot(); this.interaction("", "");
    clearTimeout(this.announcementTimer); clearTimeout(this.toastTimer);
    document.getElementById("announcement")?.classList.remove("show");
    document.getElementById("toast")?.classList.remove("show");
    this.activeNpc = null;
    if (this.app.world) {
      this.app.world.time.paused = true;
      this.app.world.input.keyboard!.enabled = false;
    }
    this.screen = "menu";
    this.hudEl.innerHTML = "";
    this.overlay.className = "main-menu";
    const s = this.app.store.data;
    this.overlay.innerHTML = `<div class="menu-atmosphere" aria-hidden="true"></div><div class="title-sparks" aria-hidden="true"></div><header class="menu-title"><h1><img src="assets/logo.png" alt="Véspera"></h1><p>AS ENGRENAGENS DA ÚLTIMA AURORA</p><div class="title-flourish">${this.px("sun")}</div></header><section class="menu-panel" aria-label="Menu principal"><div class="menu-panel-title">O FAROL DOS ECOS</div><nav class="main-nav">${this.button(`${this.px("arrow", "menu-arrow")}<strong>Jogar</strong><small>Entrar no Farol</small>`, "hub", "", "primary")}${s.run ? this.button(`${this.px("book")}<strong>Continuar expedição</strong>`, "continue") : ""}${this.button(`${this.px("gear")}<strong>Configurações</strong>`, "settings")}${this.button(`${this.px("echo")}<strong>Créditos</strong>`, "credits")}</nav><p class="menu-motto">Enquanto uma memória brilhar,<br>a noite não será eterna.</p></section><aside class="menu-character"><img src="assets/portrait-eira.png" alt="Eira, Tecelã da Última Luz"><div><b>EIRA</b><span>Tecelã da Última Luz</span><div class="menu-life"><i></i></div><small>${s.deaths} retornos ao Farol</small></div></aside><div class="menu-key-guide"><kbd>W A S D</kbd> Mover <kbd>ESPAÇO</kbd> Esquivar ${this.button("F1 · Controles", "controls")}</div><footer class="menu-footer"><span>EDIÇÃO 32 BITS</span><span>UMA ÚLTIMA LUZ PARA O AMANHÃ</span><span>JOGUE SEM INTERNET</span></footer>`;
    const nav = this.overlay.querySelector(".main-nav")!;
    nav.querySelector('[data-action="settings"]')!.insertAdjacentHTML("beforebegin", this.button(`${this.px("sun")}<strong>Nova campanha</strong>`, "campaignNew") + this.button(`${this.px("book")}<strong>Campanhas salvas</strong>`, "campaigns"));
    if (!s.run && s.location) nav.querySelector('[data-action="hub"]')!.insertAdjacentHTML("afterend", this.button(`${this.px("book")}<strong>Continuar na vila</strong>`, "continue"));
    if (s.run && s.location?.area === "hub") nav.querySelector('[data-action="continue"]')!.innerHTML = `${this.px("book")}<strong>Continuar na vila</strong>`;
    this.overlay.querySelector(".menu-motto")!.insertAdjacentHTML("beforebegin", `<p class="active-campaign">${escape(this.app.store.activeCampaign.name)}</p>`);
  }
  modal(
    title: string,
    eyebrow: string,
    content: string,
    screen: Screen,
    wide = false,
  ): void {
    this.app.voice.stop();
    this.screen = screen;
    this.overlay.className = "modal-backdrop";
    this.overlay.innerHTML = `<section class="panel ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${escape(title)}"><header class="panel-head"><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2></div>${screen === "death" || screen === "victory" ? "" : this.button("×", "back", "", "close-button")}</header>${content}</section>`;
    this.app.world?.input.keyboard?.resetKeys();
    if (this.app.world) {
      this.app.world.hold = 0;
      this.app.world.attackBuffer.clear();
      this.app.world.pendingActions.clear();
      this.app.world.actions.clear();
      this.app.world.input.keyboard!.enabled = false;
      this.app.world.time.paused = true;
    }
    this.interaction("", "");
    window.setTimeout(
      () =>
        this.overlay
          .querySelector<HTMLElement>("button")
          ?.focus({ preventScroll: true }),
      10,
    );
  }
  close(): void {
    this.app.voice.stop();
    this.activeNpc = null;
    this.overlay.innerHTML = "";
    this.overlay.className = "";
    this.screen = "play";
    if (this.app.world) {
      this.app.world.input.keyboard!.enabled = true;
      this.app.world.input.keyboard!.resetKeys();
      this.app.world.time.paused = false;
    }
    this.hud();
  }
  hud(): void {
    if (this.screen === "menu" || this.screen === "loading") return;
    const world = this.app.world;
    if (!world) return;
    const run = this.app.run,
      b = run ? BIOMES[run.nodes[run.current].biome] : null;
    this.hudEl.innerHTML = `<header class="game-top"><div class="region">${this.px("sun", "mini-logo")}<div><div class="eyebrow">${world.isHub ? "UM LUGAR ENTRE OS INSTANTES" : b!.eyebrow}</div><h3>${world.isHub ? "Farol dos Ecos" : b!.name}</h3></div></div><div class="top-actions"><span class="currency">${this.px("echo")} <span id="echoes">${this.app.store.data.echoes}</span> <small>ECOS</small></span>${run ? '<span class="currency gold"><img class="px-icon" src="assets/icon-coin.png" alt="Óbolos"> <span id="coins">0</span></span>' : ""}${this.button(`${this.px("map")}<small>TAB</small>`, "map", "", "icon-button")}${this.button(`${this.px("pause")}<small>ESC</small>`, "pause", "", "icon-button")}</div></header><aside id="objective-panel" class="objective-panel"></aside><div id="boss-hud"></div><footer class="game-bottom"><div class="health-block"><img class="hud-portrait" src="assets/portrait-eira.png" alt=""><div class="health-content"><div class="player-id"><b>EIRA</b><small>TECELÃ DA ÚLTIMA LUZ</small><span id="health-number"></span></div><div class="health-track"><i id="health-fill"></i></div><div class="energy-track"><i id="energy-fill"></i></div><div class="weapon-name">${weaponName(this.app.store.data, run?.weapon ?? this.app.weapon, WEAPONS[run?.weapon ?? this.app.weapon].name)} <span>· ${WEAPONS[run?.weapon ?? this.app.weapon].subtitle}</span></div><div id="combo-status" class="combo-status"></div></div></div><div class="weapon-switch-hud">${this.loadoutMarkup(true)}</div><div id="skillbar" class="skillbar"><div><kbd>ESPAÇO</kbd><b id="dash-state">⟡</b><small>ESQUIVA</small></div><div><kbd>M2</kbd><b id="special-state">✦</b><small>ESPECIAL</small></div><div><kbd>SHIFT</kbd><b id="alt-state">⌁</b><small>RUPTURA</small></div><div><kbd>Q</kbd><b id="ult-state">☼</b><small>AURORA</small></div></div><div id="boon-strip" class="boon-strip"></div></footer>${world.isHub ? `<aside class="hub-hint"><b>O Farol é um abrigo.</b> Siga as ruas até as casas e pressione <kbd>E</kbd> para conversar. <kbd>TAB</kbd> abre o mapa da vila. O portão leste leva à expedição.</aside>` : ""}`;
    this.hudEl.insertAdjacentHTML("beforeend", this.needsMarkup());
    const context = document.createElement("div"); context.className = "stage-context";
    const objective = document.getElementById("objective-panel")!; objective.before(context); context.append(objective);
    if (run) context.insertAdjacentHTML("beforeend", '<aside id="phase-route" class="phase-route"></aside><aside id="gate-status" class="gate-status" aria-live="polite"></aside>');
    this.hudEl.insertAdjacentHTML("beforeend", '<div id="save-status" class="save-status"></div>');
    this.updateSaveStatus();
    if (run)
      this.hudEl.insertAdjacentHTML("beforeend", `<aside id="room-return" class="room-return" hidden><b>✓ Câmara restaurada</b><p>Você pode se abastecer e continuar esta expedição depois.</p>${this.button("Voltar ao Farol", "returnToHub")}</aside>`);
    this.updateHUD();
  }
  text(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el && el.textContent !== value) el.textContent = value;
  }
  markup(el: HTMLElement, value: string): void {
    if (this.markupCache.get(el) === value) return;
    el.innerHTML = value; this.markupCache.set(el, value);
  }
  updateHUD(): void {
    const w = this.app.world;
    if (!w || this.screen === "menu") return;
    const run = this.app.run;
    if (!run && !w.isHub) return;
    if (run && !w.isHub) {
      const done = w.relays.filter((m) => m.done).length;
      const phase = phaseState(run);
      this.text("gate-status", phase.gateOpened ? "Portão aberto" : phase.keyFound ? "Chave da fase na mochila" : phase.keyRevealed ? "Chave revelada · recolha com E" : "Chave escondida · TAB mostra a pista");
      this.text("phase-route", `${w.relays.length ? `Marcos: ${done}/${w.relays.length} · ` : ""}${w.navigationGoal().label} · ${w.stage.design.rule === "treasure" ? w.stageHint() + " · " : ""}TAB: mapa`);
    }
    const retreat = document.getElementById("room-return");
    if (retreat) retreat.hidden = !run || !w.cleared || w.rewardPending;
    this.updateNeeds();
    this.text("health-number", `${Math.ceil(w.health.hp)} / ${w.health.max}`);
    const h = document.getElementById("health-fill");
    if (h)
      h.style.width = `${Math.max(0, (w.health.hp / w.health.max) * 100)}%`;
    const energy = document.getElementById("energy-fill");
    if (energy) energy.style.width = `${run ? w.ultimate : 100}%`;
    this.text("coins", String(run?.coins ?? 0));
    this.text("echoes", String(this.app.store.data.echoes));
    this.skill(
      "dash-state",
      w.dash.remaining > 0 ? w.dash.remaining.toFixed(1) : "",
      "dash",
    );
    this.skill(
      "special-state",
      w.special.remaining > 0 ? w.special.remaining.toFixed(1) : "",
      "blade",
    );
    this.skill(
      "alt-state",
      w.alternate.remaining > 0 ? w.alternate.remaining.toFixed(1) : "",
      "tide",
    );
    this.skill(
      "ult-state",
      w.ultimate >= 100 ? "" : `${Math.floor(w.ultimate)}%`,
      "sun",
    );
    this.text(
      "combo-status",
      run && w.comboTime > 0 && w.combo > 0
        ? `COMBO ${w.combo}/6 · ${w.attack?.style === "charged" ? "Ataque carregado" : this.comboName()}`
        : "M1 · Combo de 6 golpes",
    );
    const op = document.getElementById("objective-panel");
    if (op && !w.isHub) {
      const o = w.objective,
        kind = run!.nodes[run!.current].kind;
      const progress =
        o.kind === "escort"
          ? `${Math.floor(o.progress)}%`
          : o.kind === "defend"
            ? `${Math.floor(o.progress)} / ${o.target}s · Núcleo ${Math.max(0, Math.ceil(o.integrity))}%`
            : `${Math.floor(o.progress)} / ${o.target}`;
      if (!op.firstElementChild) op.innerHTML = '<div id="objective-kind" class="eyebrow"></div><h4 id="objective-title"></h4><p id="objective-instruction"></p><div class="objective-progress"><i id="objective-fill"></i></div><small id="objective-value"></small><div class="secondary"><span id="objective-damage"></span><br><span id="objective-time"></span></div>';
      this.text("objective-kind", w.cleared ? "✓ CÂMARA RESTAURADA" : `${run!.current % 9 >= 7 ? "DESVIO OPCIONAL" : `CÂMARA ${(run!.current % 9) + 1} / 7`} · ${kind === "boss" ? "VIGIA" : "OBJETIVO"}`);
      this.text("objective-title", o.definition.title);
      this.text("objective-instruction", w.cleared ? (phaseState(run!).keyFound ? "Leve a chave ao portão ou volte à vila para se abastecer." : "Encontre a chave escondida para abrir o portão.") : o.definition.instruction);
      const fill = document.getElementById("objective-fill")!, width = `${o.target ? Math.min(100, (o.progress / o.target) * 100) : 100}%`;
      if (fill.style.width !== width) fill.style.width = width;
      this.text("objective-value", w.cleared ? (phaseState(run!).gateOpened ? "O portão está aberto" : "Portão trancado") : progress);
      this.text("objective-damage", `◇ ${o.damageTaken === 0 ? "Sem sofrer dano" : "Uma cicatriz permanece"}`);
      this.text("objective-time", `◇ ${Math.max(0, Math.ceil(90 - o.elapsed))}s para o desafio de tempo`);
    }
    const boss = w.enemies.find((e) => e.boss && !e.health.dead),
      bh = document.getElementById("boss-hud");
    if (bh) {
      if (boss) {
        this.markup(bh, `<div class="boss-bar"><span>VIGIA DO FRAGMENTO · FASE ${boss.phase}</span><h3>${BIOMES[run!.nodes[run!.current].biome].boss}</h3><div><i style="width:${(boss.health.hp / boss.health.max) * 100}%"></i></div></div>`);
      } else this.markup(bh, "");
    }
    const strip = document.getElementById("boon-strip");
    if (strip && run) {
      this.markup(strip,
        run.boons
          .slice(-8)
          .map((id) => {
            const b = BOONS.find((x) => x.id === id)!;
            return b
              ? `<span title="${b.name}: ${b.description}" style="color:${SCHOOL_COLORS[b.school]}">◇</span>`
              : "";
          })
          .join("") + `<small>${run.boons.length} JURAMENTOS</small>`);
    }
  }
  comboName(): string {
    return this.app.run
      ? comboMove(this.app.run.weapon, this.app.world.combo).name
      : "";
  }
  hasService(service: NpcService): boolean {
    const npc = this.activeNpc ? hubNpc(this.activeNpc) : undefined;
    return (
      !!npc && npc.service === service && !!this.app.world?.nearNpc(npc.id)
    );
  }
  openNpcService(id: string): void {
    const npc = hubNpc(id);
    if (!npc || this.activeNpc !== npc.id || !this.hasService(npc.service))
      return;
    if (npc.service === "forge") {
      this.forgeMode = "forge";
      this.armory(false);
    } else if (npc.service === "skills") this.talents(false);
    else if (npc.service === "memories") this.gallery();
    else this.survivalCraft();
  }
  needsMarkup(): string {
    return `<aside class="survival-hud" aria-label="Necessidades de Eira"><div class="needs-meters">${(
      [
        ["hunger", "Fome", "food"],
        ["thirst", "Sede", "water"],
        ["cold", "Frio", "coat"],
      ] as const
    )
      .map(
        ([id, name, icon]) =>
          `<div class="needs-meter" id="need-${id}" role="meter" aria-label="${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span>${this.px(icon)}${name}<b id="need-value-${id}">0%</b></span><div><i id="need-fill-${id}"></i></div></div>`,
      )
      .join(
        "",
      )}</div><div class="supply-actions">${this.button("R · Comer", "quickEat")}${this.button("T · Beber", "quickDrink")}${this.button("I · Inventário", "provisions")}</div></aside>`;
  }
  updateNeeds(): void {
    const n = this.app.world.needs,
      s = this.app.store.data;
    for (const id of ["hunger", "thirst", "cold"] as const) {
      const el = document.getElementById(`need-${id}`),
        fill = document.getElementById(`need-fill-${id}`);
      this.text(`need-value-${id}`, `${Math.round(n[id])}%`);
      el?.setAttribute("aria-valuenow", String(Math.round(n[id])));
      el?.classList.toggle("critical", n[id] >= 85);
      el?.classList.toggle("warning", n[id] >= 60 && n[id] < 85);
      if (fill) fill.style.width = `${n[id]}%`;
    }
    const eat = document.querySelector<HTMLButtonElement>(
        '[data-action="quickEat"]',
      ),
      drink = document.querySelector<HTMLButtonElement>(
        '[data-action="quickDrink"]',
      );
    if (eat) {
      const label = `R · Comer (${s.provisions.ration + s.provisions.stew})`; if (eat.textContent !== label) eat.textContent = label;
      eat.disabled = !!consumableBlock(
        s,
        n,
        s.provisions.ration > 0 ? "ration" : "stew",
      );
    }
    if (drink) {
      const label = `T · Beber (${s.provisions.water + s.provisions.tea})`; if (drink.textContent !== label) drink.textContent = label;
      drink.disabled = !!consumableBlock(
        s,
        n,
        s.provisions.water > 0 ? "water" : "tea",
      );
    }
  }
  survivalCraft(): void {
    const npc = this.activeNpc ? hubNpc(this.activeNpc) : undefined;
    if (
      !npc ||
      !["food", "drink", "clothes"].includes(npc.service) ||
      !this.hasService(npc.service)
    )
      return;
    const scroll =
        this.screen === "survivalCraft"
          ? (this.overlay.querySelector(".panel")?.scrollTop ?? 0)
          : 0,
      s = this.app.store.data;
    const materialBar = `<div class="resource-bar">${SURVIVAL_MATERIALS.map((m) => `<span>${this.px(m.icon)}<b>${s.survivalMaterials[m.id]}</b> ${m.name}</span>`).join("")}</div>`;
    this.modal(
      npc.service === "food"
        ? "Calor que alimenta"
        : npc.service === "drink"
          ? "Água para o caminho"
          : "Um abrigo sobre os ombros",
      `${npc.name.toUpperCase()} · ${npc.role.toUpperCase()}`,
      `<p>Recursos encontrados nas câmaras ficam guardados no Farol. Prepare a próxima travessia conversando com seus moradores.</p>${materialBar}<div class="cards survival-recipes">${SURVIVAL_RECIPES.filter(
        (r) => r.service === npc.service,
      )
        .map((r) => {
          const item = CONSUMABLES.find((i) => i.id === r.id),
            outfit = CLOTHING.find((c) => c.id === r.id),
            reason = survivalCraftBlock(s, r.id),
            owned = !!outfit && s.wardrobe.includes(outfit.id);
          return `<article class="card survival-recipe" data-recipe="${r.id}"><div class="weapon-glyph">${this.px(item?.icon ?? "coat")}</div><h3>${item?.name ?? outfit!.name}</h3><p>${item?.description ?? outfit!.description}</p><strong>${item ? `Na mochila: ${s.provisions[item.id]}` : s.clothing === outfit!.id ? "Vestimenta equipada" : owned ? "Vestimenta confeccionada" : "Ainda não confeccionada"}</strong><div class="recipe-cost">${SURVIVAL_MATERIALS.filter(
            (m) => r.cost[m.id],
          )
            .map(
              (m) =>
                `<span class="${s.survivalMaterials[m.id] < (r.cost[m.id] ?? 0) ? "missing" : ""}">${this.px(m.icon)}${r.cost[m.id]} ${m.name}</span>`,
            )
            .join(
              "",
            )}</div><p class="recipe-reason">${reason || "Ingredientes disponíveis"}</p>${this.button(owned ? (s.clothing === outfit!.id ? "Equipada" : "Vestir") : `Preparar ${item?.name ?? outfit!.name}`, owned ? "wear" : "craftProvision", r.id, "primary", owned ? (s.clothing === outfit!.id ? "Vestimenta já equipada" : "") : reason)}</article>`;
        })
        .join(
          "",
        )}</div>${npc.service === "clothes" ? `<div class="wardrobe"><h3>Guarda-roupa</h3><div>${CLOTHING.map((c) => this.button(c.name, "wear", c.id, s.clothing === c.id ? "primary" : "", !s.wardrobe.includes(c.id) ? "Ainda não confeccionada" : s.clothing === c.id ? "Já equipada" : "")).join("")}</div></div>` : '<p class="fine-print">Leve as provisões na mochila. Durante a expedição, use R para comer e T para beber; escolha chá ou ensopado pela tela de Provisões.</p>'}`,
      "survivalCraft",
      true,
    );
    this.overlay.querySelector(".panel")!.scrollTop = scroll;
  }
  provisions(): void {
    this.inventory("provisions");
  }
  interaction(key: string, label: string): void {
    const el = document.getElementById("interaction")!;
    const html = key ? `<kbd>${key}</kbd><span>${label}</span>` : "";
    if (el.innerHTML !== html) el.innerHTML = html;
  }
  toast(message: string): void {
    const el = document.getElementById("toast")!;
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(
      () => el.classList.remove("visible"),
      3400,
    );
  }
  lootNotice(loot: Loot): void {
    const phase = this.app.run ? phaseState(this.app.run) : null;
    if (!phase) return;
    const feed = document.getElementById("loot-feed")!;
    for (const item of LOOT_ITEMS) {
      const amount = loot[item.id];
      if (!amount) continue;
      let row = document.getElementById(`loot-${item.id}`);
      if (!row) { row = document.createElement("div"); row.id = `loot-${item.id}`; row.className = "loot-row"; feed.append(row); }
      row.innerHTML = `${this.px(item.icon)}<span><b>+${amount} ${item.name}</b><small>Total na fase: ${phase.collected[item.id]}</small></span>`;
      clearTimeout(this.lootTimers.get(item.id));
      this.lootTimers.set(item.id, window.setTimeout(() => { row?.remove(); this.lootTimers.delete(item.id); }, 2700));
    }
  }
  clearLoot(): void {
    for (const timer of this.lootTimers.values()) clearTimeout(timer);
    this.lootTimers.clear();
    document.getElementById("loot-feed")?.replaceChildren();
  }
  announcement(title: string, sub: string, duration = 2200): void {
    const el = document.getElementById("announcement")!;
    el.innerHTML = `<span>${escape(sub)}</span><strong>${escape(title)}</strong><i>◇</i>`;
    el.classList.add("visible");
    clearTimeout(this.announcementTimer);
    this.announcementTimer = window.setTimeout(
      () => el.classList.remove("visible"),
      duration,
    );
  }
  expedition(): void {
    this.modal(
      "O que você levará para a noite?",
      "UMA NOVA EXPEDIÇÃO",
      `<p>Sete câmaras separam cada fragmento do próximo. Escolha uma arma para cada espaço e uma semente. Pressione F para alternar durante a travessia.</p>${this.loadoutMarkup()}<div class="weapon-options">${(Object.keys(WEAPONS) as WeaponId[]).map((id) => this.button(`<b>${this.px(id)}</b><strong>${WEAPONS[id].name}</strong><small>${this.app.store.data.unlocked.includes(id) ? (id === this.app.weapon ? "EQUIPADA" : "DISPONÍVEL") : "BLOQUEADA · OFICINA"}</small>`, "selectWeapon", id, this.app.weapon === id ? "selected" : "")).join("")}</div><label class="seed-label">SEMENTE DA EXPEDIÇÃO<input id="seed-input" maxlength="48" placeholder="Deixe o destino escolher" autocomplete="off"></label><p class="fine-print">A mesma semente recria as salas e os objetivos. Uma expedição anterior será substituída ao partir.</p><div class="panel-footer">${this.button("Voltar", "back")}${this.button("Atravessar o portão →", "start", "", "primary")}</div>`,
      "expedition",
      true,
    );
    if (this.app.store.data.run)
      this.overlay.querySelector(".panel-head")!.insertAdjacentHTML("afterend", `<div class="resume-expedition"><p>Sua expedição está guardada na câmara ${this.app.store.data.run.current + 1}. Vida, óbolos e Juramentos foram preservados.</p>${this.button("Continuar expedição salva →", "continue", "", "primary")}</div>`);
  }
  armory(preserve = true): void {
    if (!this.hasService("forge")) {
      this.toast("Aproxime-se de Orren e converse com ele.");
      return;
    }
    const scroll =
      preserve && this.screen === "armory"
        ? (this.overlay.querySelector(".panel")?.scrollTop ?? 0)
        : 0;
    const s = this.app.store.data,
      mode = this.forgeMode;
    this.modal(
      "Metal que ainda se lembra",
      "OFICINA DE ORREN",
      `<p>Forje até 13 armas e equipe uma de cada tipo. Aprimoramentos e árvores próprias exigem XP obtida ao derrotar inimigos com aquela arma.</p>${this.resourceBar()}<nav class="progression-tabs" aria-label="Operação da oficina">${(
        [
          ["forge", "Armas & receitas"],
          ["upgrade", "Aprimorar"],
          ["infuse", "Infusões"],
        ] as const
      )
        .map(([id, name]) =>
          this.button(
            name,
            "forgeMode",
            id,
            mode === id ? "primary selected" : "",
          ),
        )
        .join(
          "",
        )}</nav>${mode === "infuse" ? `<div class="infusion-options" aria-label="Infusão escolhida">${INFUSIONS.map((i) => this.button(`${this.px(i.icon)} ${i.name}`, "infusionChoice", i.id, this.infusionChoice === i.id ? "primary" : "")).join("")}</div><p class="forge-hint">${INFUSIONS.find((i) => i.id === this.infusionChoice)!.description} Cada arma aceita uma infusão. Substituir consome uma nova receita.</p>` : mode === "upgrade" ? '<p class="forge-hint">Cada nível concede +12% de dano e +3% de velocidade de ataque. Requer 60 / 180 / 360 XP com a própria arma. Os aprimoramentos são permanentes.</p>' : ""}<div class="cards weapons forge-cards">${(
        Object.keys(WEAPONS) as WeaponId[]
      )
        .map((id) => {
          const w = WEAPONS[id],
            locked = !s.unlocked.includes(id),
            stats = progressionStats(s, id),
            level = s.weaponLevels[id],
            cost = recipe(s, id, mode, this.infusionChoice),
            reason = craftBlock(s, id, mode, this.infusionChoice),
            infusion = INFUSIONS.find((i) => i.id === s.infusions[id])!;
          const label =
            mode === "forge"
              ? "Forjar arma"
              : mode === "upgrade"
                ? `Aprimorar para +${Math.min(3, level + 1)}`
                : this.infusionChoice === "none"
                  ? "Remover infusão"
                  : `Infundir ${INFUSIONS.find((i) => i.id === this.infusionChoice)!.name}`;
          const owned = mode === "forge" && !locked;
          return `<article class="card forge-card ${this.app.weapon === id && !locked ? "selected" : ""}" data-weapon="${id}"><span class="equipment-status">${locked ? "RECEITA NÃO FORJADA" : this.app.weapon === id ? "EQUIPADA" : "FORJADA"} · ${level}/3</span><div class="weapon-glyph">${this.px(id)}</div><div class="eyebrow">${w.subtitle}</div><h3>${weaponName(s, id, w.name)}</h3><p>${w.description}</p><dl><dt>Dano base${mode === "upgrade" && level < 3 ? " → próximo" : ""}</dt><dd>${Math.round(w.damage * (1 + (stats.damage ?? 0)))}${mode === "upgrade" && level < 3 ? ` → ${Math.round(w.damage * (1 + (stats.damage ?? 0) + 0.12))}` : ""}</dd><dt>Cadência</dt><dd>${(w.duration / (1 + Math.min(0.5, stats.attackSpeed ?? 0))).toFixed(2)}s</dd><dt>Infusão</dt><dd>${infusion.name}</dd></dl>${this.button("Árvore de domínio", "mastery", id, "mastery-link") }<small class="weapon-xp">${s.weaponXP[id]} XP · ${w.slot === "melee" ? "CORPO A CORPO" : "DISTÂNCIA"}</small>${owned ? this.button(this.app.weapon === id ? "Equipada" : "Equipar", "unlock", id, "primary", this.app.weapon === id ? "Arma já equipada" : "") : `${this.costMarkup(cost)}${reason ? `<p class="recipe-reason">${reason}</p>` : '<p class="recipe-reason ready">Receita disponível</p>'}${this.button(label, "craft", `${id}:${mode}:${this.infusionChoice}`, "primary", reason)}`}</article>`;
        })
        .join(
          "",
        )}</div><details class="material-guide"><summary>Onde encontrar materiais?</summary>${MATERIALS.map((m) => `<p>${this.px(m.icon)} <b>${m.name}:</b> ${m.source}</p>`).join("")}<p>Restaurar uma câmara também concede 2 Ecos. Materiais e aprimoramentos sobrevivem à morte; câmaras já restauradas não repetem a recompensa.</p></details>`,
      "armory",
      true,
    );
    this.overlay.querySelector(".panel")!.scrollTop = scroll;
  }
  loadoutMarkup(compact = false): string {
    const s = this.app.store.data, run = this.app.run, loadout = run?.loadout ?? s.loadout, active = run?.weapon ?? this.app.weapon;
    return `<div class="weapon-loadout ${compact ? "compact" : ""}" aria-label="Armas equipadas">${(["melee", "ranged"] as const).map(slot => { const id = loadout[slot]; return `<div class="loadout-slot ${active === id ? "active" : ""}" data-slot="${slot}">${this.px(id)}<span><small>${slot === "melee" ? "CORPO A CORPO" : "DISTÂNCIA"}</small><b>${WEAPONS[id].name}</b></span>${active === id ? '<em>EM USO</em>' : '<kbd>F</kbd>'}</div>`; }).join("")}</div>`;
  }
  mastery(id: WeaponId): void {
    if (!this.hasService("forge")) return;
    const s = this.app.store.data, w = WEAPONS[id], nodes = masteryTree(id);
    const render = (n: typeof nodes[number]) => { const reason = masteryBlock(s, id, n.id), learned = s.weaponMastery[id].includes(n.id); return `<article class="mastery-node ${learned ? "learned" : ""}" data-mastery="${n.id}"><small>${n.branch} · ${n.xp} XP</small><h3>${n.name}</h3><p>${n.description}</p><span>${n.iron} Ferro de memória</span>${this.button(learned ? "Aprendida" : "Aprender", "learnMastery", `${id}:${n.id}`, "primary", reason)}${reason && !learned ? `<small class="skill-block">${reason}</small>` : ""}</article>`; };
    this.modal(w.name, "ORREN · DOMÍNIO DA ARMA", `<div class="mastery-heading">${this.px(id)}<div><h3>${w.subtitle}</h3><p><b data-mastery-xp>${s.weaponXP[id]} XP</b> com esta arma · ${s.weaponMastery[id].length}/7 técnicas aprendidas</p><p>Ganhe XP derrotando inimigos com esta arma. A XP é permanente e não é gasta ao aprender. Materiais pagam o trabalho de Orren.</p></div></div>${this.resourceBar()}<div class="mastery-root">${render(nodes[0])}</div><div class="mastery-branches">${["Técnica", "Disciplina"].map(branch => `<section><h3>${branch}</h3>${nodes.filter(n => n.branch === branch).map(render).join('<span class="mastery-arrow" aria-hidden="true">↓</span>')}</section>`).join("")}</div><p>Forja +1: ${UPGRADE_XP[1]} XP · +2: ${UPGRADE_XP[2]} XP · +3: ${UPGRADE_XP[3]} XP. Cada arma mantém sua própria experiência e seus upgrades.</p><div class="panel-footer">${this.button("Voltar à oficina", "armory", "", "primary")}</div>`, "mastery", true);
  }
  weaponExperience(id: WeaponId, amount: number): void {
    let el = document.getElementById("weapon-xp-notice");
    if (!el) { el = document.createElement("aside"); el.id = "weapon-xp-notice"; el.setAttribute("aria-live", "polite"); this.root.append(el); }
    el.innerHTML = `${this.px(id)}<span>+${amount} XP · ${WEAPONS[id].name}<small>Domínio da arma: ${this.app.store.data.weaponXP[id]} XP</small></span>`;
    el.classList.add("visible"); window.clearTimeout(this.xpTimer);
    this.xpTimer = window.setTimeout(() => el?.classList.remove("visible"), 2700);
  }
  resourceBar(): string {
    const s = this.app.store.data;
    return `<div class="resource-bar" aria-label="Recursos permanentes"><span>${this.px("echo")}<b>${s.echoes}</b> Ecos</span>${MATERIALS.map((m) => `<span title="${m.source}">${this.px(m.icon)}<b data-material="${m.id}">${s.materials[m.id]}</b> ${m.name}</span>`).join("")}</div>`;
  }
  costMarkup(cost: Recipe): string {
    const s = this.app.store.data;
    return `<div class="recipe-cost"><span class="${s.echoes < cost.echoes ? "missing" : ""}">${this.px("echo")} ${cost.echoes} Ecos</span>${MATERIALS.filter(
      (m) => cost.materials[m.id],
    )
      .map(
        (m) =>
          `<span class="${s.materials[m.id] < (cost.materials[m.id] ?? 0) ? "missing" : ""}">${this.px(m.icon)} ${cost.materials[m.id]} ${m.name}</span>`,
      )
      .join("")}</div>`;
  }
  talents(preserve = true): void {
    if (!this.hasService("skills")) {
      this.toast("Aproxime-se de Sálvia e converse com ela.");
      return;
    }
    const scroll =
      preserve && this.screen === "talents"
        ? (this.overlay.querySelector(".panel")?.scrollTop ?? 0)
        : 0;
    const s = this.app.store.data,
      branch = SKILL_BRANCHES.find((b) => b.id === this.skillBranch)!,
      stats = skillStats(s),
      refund = skillRefund(s);
    this.modal(
      "Tudo o que sobrevive",
      "ALTAR DA CENTELHA · ÁRVORE DE HABILIDADES",
      `<div class="skill-tree-intro"><p>Escolha seus caminhos. Gaste Ecos para aprender habilidades permanentes e cumpra os requisitos para alcançar os talentos finais.</p><strong>${SKILLS.filter((n) => skillRank(s, n.id) > 0).length}/18 habilidades aprendidas</strong></div><div class="skill-wallet">${this.px("echo")} <b>${s.echoes} Ecos</b><span>+${stats.hp ?? 0} vida · +${Math.round((stats.damage ?? 0) * 100)}% dano · −${Math.round((stats.dash ?? 0) * 100)}% recarga de esquiva</span></div><nav class="progression-tabs" aria-label="Caminhos da árvore">${SKILL_BRANCHES.map((b) => this.button(`${this.px(b.icon)} ${b.name}`, "skillBranch", b.id, this.skillBranch === b.id ? "primary selected" : "")).join("")}</nav><div class="skill-branch-heading"><h3>${branch.name}</h3><p>${branch.description}</p></div><div class="skill-tree" data-branch="${this.skillBranch}">${[
        0, 1, 2, 3,
      ]
        .map(
          (tier) =>
            `<div class="skill-tier ${tier === 0 || tier === 3 ? "single" : "fork"}">${SKILLS.filter(
              (n) => n.branch === this.skillBranch && n.tier === tier,
            )
              .map((n) => {
                const rank = skillRank(s, n.id),
                  reason = skillBlock(s, n),
                  requirements = n.requires
                    .map(
                      ([id, r]) =>
                        `${SKILLS.find((p) => p.id === id)!.name} ${r}`,
                    )
                    .join(" + ");
                return `<article class="skill-node ${rank ? "learned" : ""} ${rank === n.max ? "mastered" : ""}" data-skill="${n.id}"><div class="skill-node-head">${this.px(n.icon)}<span>${tier === 3 ? "TALENTO FINAL" : tier === 0 ? "ORIGEM" : "RAMIFICAÇÃO"}<b>${rank}/${n.max}</b></span></div><h3>${n.name}</h3><p>${n.description}</p><div class="skill-ranks" aria-label="Nível ${rank} de ${n.max}">${Array.from({ length: n.max }, (_, i) => `<i class="${i < rank ? "filled" : ""}"></i>`).join("")}</div><small class="skill-requirement">${requirements ? `Requer ${requirements}` : "Disponível desde o início"}</small>${this.button(rank === n.max ? "Aperfeiçoada" : `${rank ? "Aprimorar" : "Aprender"} · ${skillCost(s, n)} Ecos`, "talent", n.id, "primary", reason)}${reason && rank < n.max ? `<small class="skill-block">${reason}</small>` : ""}</article>`;
              })
              .join("")}</div>`,
        )
        .join(
          "",
        )}</div><div class="skill-respec"><p>Redistribua livremente no Farol. Todos os Ecos investidos voltam para você.</p>${this.button(`Redistribuir · recuperar ${refund} Ecos`, "respec", "", "", refund ? "" : "Nenhuma habilidade aprendida")}</div>`,
      "talents",
      true,
    );
    this.overlay.querySelector(".panel")!.scrollTop = scroll;
  }
  gallery(): void {
    if (!this.hasService("memories")) {
      this.toast("Converse com Nim para rever as memórias.");
      return;
    }
    const s = this.app.store.data;
    this.modal(
      "O mundo que o Tear esqueceu",
      "GALERIA DE MEMÓRIAS",
      `<div class="stats"><div><b>${s.deaths}</b><span>RETORNOS</span></div><div><b>${s.bosses.length}/4</b><span>VIGIAS VENCIDOS</span></div><div><b>${s.memories.length}/5</b><span>MEMÓRIAS</span></div><div><b>${s.endings.length}/2</b><span>DESFECHOS</span></div></div><div class="memory-list">${MEMORIES.map((m) => `<article class="memory ${s.memories.includes(m.id) ? "unlocked" : ""}"><span>◇</span><div><h3>${s.memories.includes(m.id) ? m.title : "Uma página sem nome"}</h3><p>${s.memories.includes(m.id) ? m.text : "Ainda não recuperada. Procure os fragmentos do Tear."}</p></div></article>`).join("")}</div><div class="achievement"><b>${s.victories ? "☼ Portadora do amanhã" : "◇ O amanhã aguarda"}</b><span>${s.victories ? "Conquista: concluir a travessia do Tear." : "Conclua a campanha para acender esta conquista."}</span></div>${
        s.history.length
          ? `<details><summary>Últimas expedições</summary>${s.history
              .slice(-5)
              .reverse()
              .map(
                (h) =>
                  `<p class="fine-print">${escape(h.seed)} · ${h.rooms} câmaras · ${h.result === "death" ? "Retorno ao Farol" : "Aurora alcançada"}</p>`,
              )
              .join("")}</details>`
          : ""
      }`,
      "gallery",
      true,
    );
  }
  dialogue(who: string, topic = ""): void {
    const npc = hubNpc(who);
    if (!npc || !this.app.world.nearNpc(npc.id)) return;
    this.activeNpc = npc.id;
    if (npc.id === "salvia") { this.app.store.data.recovering = false; this.app.store.write(); }
    const d = dialogue(npc.name, this.app.store.data), branch = CONVERSATIONS[npc.id].find(t => t.id === topic);
    if (branch) d.lines = branch.lines;
    let page = 0;
    const draw = () => {
      this.modal(
        d.speaker,
        npc.role,
        `<div class="dialogue-content" data-speaker="${npc.id}"><div class="portrait"><img src="assets/portrait-${npc.id}.png" alt="${npc.name}"></div><div><p class="dialogue-text">“${d.lines[page]}”</p><span class="dialogue-page">${page + 1} / ${d.lines.length}${branch ? ` · ${branch.label}` : ""}</span><div class="voice-controls">${this.button("Ouvir novamente", "voiceReplay")} ${this.button("Parar voz", "voiceStop")}<small id="voice-status" role="status">${CHARACTER_VOICES[npc.id].style} · português</small></div></div></div><div class="dialogue-topics">${CONVERSATIONS[npc.id].map(t => this.button(t.label, "dialogueTopic", t.id)).join("")}</div><div class="npc-service">${this.button(npc.action, "npcService", npc.id, "primary")}</div><div class="panel-footer">${this.button("Encerrar", "back")}${this.button(page < d.lines.length - 1 ? "Ouvir →" : "Até o próximo instante", "dialogueNext")}</div>`,
        "dialogue",
      );
      this.currentLine = d.lines[page]; this.app.voice.say(npc.id, this.currentLine);
    };
    draw();
    const advance = () => {
      if (page < d.lines.length - 1) {
        page++;
        draw();
      } else this.close();
    };
    this.dialogueNext = advance;
  }
  dialogueNext: () => void = () => {};
  rewards(): void {
    if (!this.app.run || this.screen === "death" || this.screen === "victory")
      return;
    const run = this.app.run,
      r = rng(`${run.seed}:boon:${run.current}`),
      available = BOONS.filter((b) => !run.boons.includes(b.id));
    if (!available.length) {
      this.app.world.collectLoot({ coins: 30 });
      this.app.world.rewardPending = false;
      this.app.saveCheckpoint();
      return;
    }
    const choices = [];
    for (let i = 0; i < 3 && available.length; i++)
      choices.push(available.splice(Math.floor(r() * available.length), 1)[0]);
    this.modal(
      "Uma promessa atravessa o tempo",
      "ESCOLHA UM JURAMENTO",
      `<p>A luz de quem veio antes ainda pode acompanhar você. Escolha uma bênção para esta expedição.</p><div class="cards boons">${choices.map((b) => `<button class="card boon-card" style="--school:${SCHOOL_COLORS[b.school]}" data-action="boon" data-value="${b.id}"><div class="boon-symbol">${this.px(b.school === "Vidro" ? "glass" : b.school === "Cinza" ? "flame" : b.school === "Maré" ? "tide" : "echo")}</div><div class="eyebrow">JURAMENTO DE ${b.school.toUpperCase()}</div><h3>${b.name}</h3><p>${b.description}</p><span class="card-choose">ACEITAR JURAMENTO <b>↗</b></span></button>`).join("")}</div><div class="panel-footer">${this.button("Guardar 15 óbolos", "skipReward")}</div>`,
      "rewards",
      true,
    );
  }
  acceptBoon(id: string): void {
    const run = this.app.run,
      b = BOONS.find((x) => x.id === id);
    if (!run || !b || run.boons.includes(id)) return;
    run.boons.push(id);
    this.app.world.rewardPending = false;
    if (b.stat === "hp") {
      this.app.world.health.max += b.value;
      this.app.world.health.heal(b.value);
    }
    this.app.saveCheckpoint();
    this.app.audio.play("reward");
    this.close();
    this.toast(`${b.name} acompanha sua jornada.`);
  }
  map(): void {
    if (this.app.world.isHub) { this.villageMap(); return; }
    if (!this.app.run) { this.toast("O mapa da fase desperta durante a expedição."); return; }
    const w = this.app.world, run = this.app.run, layout = w.layout, phase = phaseState(run), goal = w.navigationGoal();
    const size = 12, at = (p: {x: number; y: number}) => ({ x: p.x / TILE * size, y: p.y / TILE * size });
    const known = new Set(phase.explored);
    let floor = "";
    for (let y = 0; y < layout.height; y++) for (let x = 0; x < layout.width; x++)
      if (layout.cells[y][x]) floor += `<rect x="${x * size}" y="${y * size}" width="11" height="11" rx="1" fill="${known.has(y * layout.width + x) ? "#bca878" : "#48565a"}"/>`;
    const point = (p: {x: number; y: number}, label: string, cls: string) => { const q = at(p); return `<g class="${cls}"><circle cx="${q.x}" cy="${q.y}" r="6"/><text x="${q.x}" y="${q.y + 3}">${label}</text></g>`; };
    const path = navigationPath(layout, w.pos, goal.pos).map(p => { const q = at(p); return `${q.x},${q.y}`; }).join(" ");
    const position = at(w.pos);
    const icons = w.stage.challenge.hazards.map(p => point(p, "⚠", "map-hazard")).join("") + w.stage.entrances.map(p => point(p, "R", "map-reinforcement")).join("") + w.relays.map((m, i) => point(m.pos, m.done ? "✓" : String(i + 1), m.done ? "map-done" : "map-goal")).join("") + w.markers.map(m => point(m.pos, m.done ? "✓" : "!", m.done ? "map-done" : "map-quest")).join("") + w.props.flatMap((p, i) => p.data.kind === "chest" && p.image.visible ? [point(p.data, phase.claimed.includes(`prop:${i}`) ? "✓" : "B", "map-chest")] : []).join("");
    this.modal(BIOMES[run.nodes[run.current].biome].name, "MAPA DA FASE · TAB", `<div class="map-direction"><b>${run.nodes[run.current].title} · ${w.stage.challenge.name}</b><span>Próximo destino: ${goal.label}</span></div><svg class="stage-map" role="img" aria-label="Mapa da fase com posição de Eira, caminho, objetivos, baús e saída" viewBox="0 0 ${layout.width * size} ${layout.height * size}">${floor}<polyline class="map-route-line" points="${path}"/>${icons}${point(layout.spawn, "E", "map-entry")}${point(layout.exit, phase.gateOpened ? "S" : "P", phase.gateOpened ? "map-done" : "map-exit")}${phase.keyRevealed && !phase.keyFound ? point(w.stage.keyHiding.pos, "C", "map-key") : ""}<g class="map-player"><circle cx="${position.x}" cy="${position.y}" r="7"/><text x="${position.x}" y="${position.y - 11}">EIRA · VOCÊ ESTÁ AQUI</text></g></svg><div class="map-legend"><span>● Eira</span><span>— Caminho até o objetivo</span><span>1–4 Marcos · segure E</span><span>! Objetivo da fase</span><span>B Baú</span><span>E Entrada · P Portão · R Reforços</span><span>C Chave revelada</span><span>⚠ Perigo cíclico</span><span>Claro: explorado · Escuro: não visitado</span></div><p class="key-clue">${phase.keyFound ? "⚿ Chave da fase guardada na mochila." : phase.keyRevealed ? "A chave foi revelada e aparece no mapa. Aproxime-se e pressione E." : `⚿ ${w.stage.keyHiding.hint}`}</p><p class="inventory-note"><b>${w.stage.challenge.name}:</b> ${w.stage.challenge.instruction}</p><p class="inventory-note">${phase.secretOpened ? "Passagem secreta descoberta e incluída no mapa." : "Procure paredes rachadas para revelar passagens que ainda não aparecem no mapa."}</p><div class="panel-footer">${this.button("Rota da região", "campaignMap")}${this.button("Voltar à fase", "back", "", "primary")}</div>`, "map", true);
  }
  villageMap(): void {
    const w = this.app.world, village = w.layout as VillageLayout, size = 12, roads = new Set(village.paths);
    let floor = "";
    for (let y = 0; y < village.height; y++) for (let x = 0; x < village.width; x++) if (village.cells[y][x]) floor += `<rect x="${x * size}" y="${y * size}" width="11" height="11" fill="${roads.has(y * village.width + x) ? "#c7b88d" : "#426750"}"/>`;
    const dots = village.houses.map(h => { const n = HUB_NPCS.find(n => n.id === h.npc)!; return `<g class="village-map-house" data-house-map="${h.npc}"><rect x="${h.center.x / TILE * size - 22}" y="${h.center.y / TILE * size - 18}" width="44" height="36" rx="3"/><text x="${h.center.x / TILE * size}" y="${h.center.y / TILE * size + 4}">${n.name}</text></g>`; }).join("");
    const p = w.pos;
    this.modal("Vila do Farol dos Ecos", "MAPA DA VILA · TAB", `<p>Seis casas ligadas pela praça e pelas ruas. Escolha um destino para caminhar até ele; use WASD para interromper e E para conversar ao chegar.</p><svg class="stage-map village-map" viewBox="0 0 ${village.width * size} ${village.height * size}" role="img" aria-label="Mapa da vila com casas, ruas, portão e posição de Eira">${floor}${dots}<g class="map-player"><circle cx="${p.x / TILE * size}" cy="${p.y / TILE * size}" r="7"/><text x="${p.x / TILE * size}" y="${p.y / TILE * size - 11}">EIRA</text></g><text class="village-gate-map" x="${village.exit.x / TILE * size}" y="${village.exit.y / TILE * size}">PORTÃO</text></svg><div class="village-directory">${village.houses.map(h => { const n = HUB_NPCS.find(n => n.id === h.npc)!; return `<article data-village-house="${n.id}"><b>${n.name} · ${h.name}</b><p>${n.action}</p>${this.button(`Ir até ${n.name}`, "villageGuide", n.id)}</article>`; }).join("")}</div><div class="panel-footer">${this.button("Ir ao portão da vila", "villageGate", "", "primary")}</div>`, "map", true);
  }
  campaignMap(): void {
    if (!this.app.run) {
      this.toast("O mapa desperta durante uma expedição.");
      return;
    }
    const run = this.app.run,
      biome = run.nodes[run.current].biome;
    const nodes = run.nodes.filter((n) => n.biome === biome);
    const names: Record<string, string> = {
      combat: "Combate",
      elite: "Elite",
      objective: "Mecanismo",
      explore: "Exploração",
      event: "Memória",
      reward: "Santuário",
      shop: "Mercador",
      secret: "Rota secreta",
      challenge: "Desafio",
      boss: "Vigia",
    };
    this.modal(
      BIOMES[biome].name,
      "CARTOGRAFIA DA EXPEDIÇÃO",
      `<div class="biome-route">${BIOMES.map((b, i) => `<span class="${i === biome ? "active" : ""}">${i + 1}. ${b.short}</span>`).join("")}</div><div class="run-map">${nodes.map((n) => `<div class="map-node ${run.current === n.id ? "current" : ""} ${run.visited.includes(n.id) ? "visited" : ""} ${n.id % 9 >= 7 ? "branch" : ""}"><span>${run.visited.includes(n.id) ? "✓" : n.kind === "boss" ? "☼" : n.id % 9 >= 7 ? "◇" : "◈"}</span><b>${names[n.kind]}</b><small>${run.current === n.id ? "VOCÊ ESTÁ AQUI" : n.id % 9 >= 7 ? `DESVIO · RETORNO À CÂMARA ${(n.next[0] % 9) + 1}` : n.title}</small><i>→</i></div>`).join("")}</div><p class="fine-print">Os desvios partem das câmaras 2 e 4 e retornam à rota principal. Semente: ${escape(run.seed)} · Conteúdo 1.0.0</p><div class="panel-footer">${this.button("Voltar à travessia", "back", "", "primary")}</div>`,
      "map",
      true,
    );
  }
  routes(ids: number[]): void {
    const run = this.app.run!;
    this.modal(
      "Cada caminho lembra algo",
      "UMA BIFURCAÇÃO NO TEMPO",
      `<div class="cards route-cards">${ids
        .map((id) => {
          const n = run.nodes[id];
          return `<button class="card" data-action="route" data-value="${id}"><span class="boon-symbol">${n.kind === "secret" ? "◇" : n.kind === "challenge" ? "⟋" : "◈"}</span><div class="eyebrow">${n.kind === "secret" ? "ROTA OPCIONAL · EXPLORAR" : n.kind === "challenge" ? "ROTA OPCIONAL · COMBATER" : "ROTA PRINCIPAL"}</div><h3>${n.title}</h3><p>${n.kind === "secret" ? "Recupere lembranças ocultas e recursos." : n.kind === "challenge" ? "Um desafio adicional e outro Juramento." : `A travessia continua. ${n.kind === "shop" ? "Há um mercador adiante." : ""}`}</p><span class="card-choose">ATRAVESSAR →</span></button>`;
        })
        .join("")}</div>`,
      "routes",
      true,
    );
  }
  shop(): void {
    this.modal(
      "Trocas com o esquecimento",
      "NIM · MERCADOR DE ECOS",
      `<p>“Eu aceito óbolos. As lembranças verdadeiras você pode guardar.”</p><div class="shop-items"><article><span>♡</span><div><h3>Gota da aurora</h3><p>Recupera 45 de vida.</p></div>${this.button("30 óbolos", "buy", "heal")}</article><article><span>◇</span><div><h3>Promessa esquecida</h3><p>Escolha um Juramento extra.</p></div>${this.button("55 óbolos", "buy", "boon")}</article><article><span>◈</span><div><h3>Memória preservada</h3><p>Receba 8 Ecos permanentes.</p></div>${this.button("40 óbolos", "buy", "echoes")}</article></div><div class="panel-footer"><small>${this.app.run!.coins} ÓBOLOS NA BOLSA</small>${this.button("Continuar a jornada", "back", "", "primary")}</div>`,
      "shop",
    );
  }
  event(): void {
    this.modal(
      "Uma voz de antes",
      "UM ECO ENTRE AS RUÍNAS",
      `<p class="dialogue-text">“Eles nos pediram uma lembrança pequena. Depois outra. Até que esquecemos o nome de quem amávamos.”</p><p>Um fragmento pulsa dentro de uma fonte. Você reconhece a própria caligrafia na pedra.</p><div class="event-options">${this.button("Preservar a lembrança <small>+8 Ecos permanentes</small>", "eventChoice", "preserve")}${this.button("Oferecer luz à fonte <small>−20 de vida · escolha um Juramento</small>", "eventChoice", "offer")}</div>`,
      "event",
    );
  }
  updateSaveStatus(): void {
    const el = document.getElementById("save-status"); if (!el) return;
    const store = this.app.store;
    el.textContent = store.available ? `Salvo · ${store.savedAt ? new Date(store.savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : store.activeCampaign.name}` : "Save indisponível · exporte um backup";
    el.dataset.failed = String(!store.available);
  }
  campaigns(): void {
    if (!["campaigns", "newCampaign", "campaignDelete"].includes(this.screen)) this.managementReturn = this.screen;
    const store = this.app.store;
    this.modal("Suas campanhas", "MEMÓRIAS GUARDADAS", `<p>Cada campanha tem seu próprio progresso, inventário e expedição. Seu save anterior está preservado em <b>Campanha 1</b>.</p><div class="campaign-grid">${store.campaigns.map(c => `<article class="campaign-card ${c.id === store.activeId ? "active" : ""}" data-campaign="${c.id}"><div class="eyebrow">${c.id === store.activeId ? "CAMPANHA ATIVA" : "CAMPANHA SALVA"}</div><h3>${escape(c.name)}</h3><p>${c.data.location?.area === "hub" || !c.data.run ? "Vila do Farol dos Ecos" : BIOMES[c.data.run.nodes[c.data.run.current].biome].name + " · câmara " + (c.data.run.current % 9 + 1)}</p><small>${c.data.echoes} Ecos · ${c.data.deaths} retornos · ${c.updatedAt ? new Date(c.updatedAt).toLocaleString("pt-BR") : "Ainda não iniciada"}</small><div class="campaign-actions">${this.button("Continuar campanha", "loadCampaign", c.id, "primary")}${c.id !== store.activeId ? this.button("Excluir", "campaignDelete", c.id) : ""}</div></article>`).join("")}</div><div class="panel-footer">${this.button("Nova campanha", "campaignNew", "", "primary", store.campaigns.length >= 6 ? "Os seis espaços estão ocupados" : "")}${this.button("Exportar backup da ativa", "exportCampaign")}<label class="backup-import">Importar backup<input type="file" accept="application/json,.json" data-campaign-import aria-label="Importar backup de campanha"></label></div><p class="fine-print">Saves locais neste navegador. Exporte um backup para guardar uma cópia em arquivo ou levar a outro computador.</p>`, "campaigns", true);
  }
  newCampaign(): void {
    if (!["campaigns", "newCampaign"].includes(this.screen)) this.managementReturn = this.screen;
    this.modal("Uma nova aurora", "NOVA CAMPANHA", `<p>Comece outra história com inventário e progressão novos. As campanhas anteriores continuam disponíveis.</p><label class="seed-label">NOME DA CAMPANHA<input id="campaign-name" maxlength="40" placeholder="Ex.: A travessia de Eira" value="Campanha ${this.app.store.campaigns.length + 1}" autocomplete="off"></label><div class="panel-footer">${this.button("Voltar", "back")}${this.button("Criar campanha", "createCampaign", "", "primary")}</div>`, "newCampaign");
    window.setTimeout(() => document.getElementById("campaign-name")?.focus(), 20);
  }
  pause(): void {
    if (this.screen !== "play") return;
    this.app.saveCheckpoint();
    this.modal(
      "Entre dois instantes",
      "TRAVESSIA PAUSADA",
      `<nav class="pause-nav">${this.button("Retomar a jornada →", "back", "", "primary")}${this.button("Salvar agora", "saveNow")}${this.button("Inventário · comidas, roupas e recursos", "inventory")}${this.button("Campanhas e backups", "campaigns")}${this.button("Controles", "controls")}${this.button("Configurações", "settings")}${this.button("Salvar e sair para o menu", "menu")}</nav><p class="fine-print">Sua posição, vida, inimigos e objetivos são salvos automaticamente a cada cinco segundos e ao sair. ${this.app.store.available ? "Você pode continuar deste ponto." : "O navegador bloqueou o armazenamento. Exporte um backup antes de fechar."}</p>`,
      "pause",
    );
    if (this.app.run && this.app.world.cleared && !this.app.world.rewardPending)
      this.overlay.querySelector(".pause-nav")!.insertAdjacentHTML("beforeend", this.button("Voltar ao Farol", "returnToHub"));
  }
  settings(): void {
    this.previous = this.screen === "settings" ? this.previous : this.screen;
    const s = this.app.store.data.settings;
    this.modal(
      "Ajuste a sua aurora",
      "CONFIGURAÇÕES",
      `<div class="settings">${[
        ["music", "Música ambiente", s.music],
        ["sfx", "Efeitos sonoros", s.sfx],
        ["voice", "Vozes dos personagens", s.voice],
        ["shake", "Impacto da câmera", s.shake],
      ]
        .map(
          ([k, label, v]) =>
            `<label><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(Number(v) * 100)}" data-setting="${k}" aria-label="${label}"><output>${Math.round(Number(v) * 100)}%</output></label>`,
        )
        .join(
          "",
        )}<div class="quality"><span>QUALIDADE VISUAL</span><div>${(["low", "medium", "high"] as const).map((q, i) => this.button(["Baixa", "Média", "Alta"][i], "quality", q, s.quality === q ? "selected" : "")).join("")}</div></div><p class="fine-print">Partículas e névoa se adaptam à qualidade. Aplicada ao entrar na próxima câmara. Renderização: ${this.app.game?.renderer.type === 2 ? "WebGL" : "Canvas (fallback)"}.<br>O áudio começa após sua primeira interação.</p></div><div class="panel-footer">${this.button("Salvar e voltar", "settingsBack", "", "primary")}</div>`,
      "settings",
    );
    this.overlay.querySelector(".settings")!.insertAdjacentHTML("beforeend", `<label class="voice-auto"><input type="checkbox" data-voice-auto ${s.voiceAuto ? "checked" : ""}> Ouvir diálogos automaticamente</label><p class="fine-print">Falas em português incluídas no jogo, com ritmo e timbre próprios por personagem. Vozes sintetizadas, com legendas sempre ativas. Falas variáveis usam a voz em português do sistema quando disponível.</p>`);
  }
  controls(): void {
    if (!["menu", "play", "pause"].includes(this.screen)) { this.toast("Feche a tela atual para consultar os controles."); return; }
    const prev = this.screen;
    this.modal(
      "A linguagem da centelha",
      "CONTROLES",
      `<div class="controls-grid">${[
        ["W A S D", "Mover em oito direções"],
        ["MOUSE", "Mirar"],
        ["M1", "Combo de 6 golpes (cliques encadeados)"],
        ["SEGURAR M1", "Ataque carregado"],
        ["M2", "Especial da arma"],
        ["F", "Alternar corpo a corpo / distância"],
        ["ESPAÇO", "Esquiva com invulnerabilidade"],
        ["SHIFT", "Ruptura · onda que desacelera"],
        ["Q", "Aurora · requer 100% de energia"],
        ["E", "Interagir / canalizar"],
        ["R", "Comer uma provisão da mochila"],
        ["T", "Beber uma provisão da mochila"],
        ["I", "Abrir / fechar o inventário completo"],
        ["TAB", "Mapa da região"],
        ["ESC", "Pausar / voltar"],
      ]
        .map(
          ([key, desc]) => `<div><kbd>${key}</kbd><span>${desc}</span></div>`,
        )
        .join(
          "",
        )}</div><p class="fine-print">Esquivas cancelam a recuperação de um golpe. Círculos alaranjados antecipam ataques. Restaure a fase e encontre a chave escondida para abrir o portão.</p>`,
      "controls",
    );
    this.previous = prev;
  }
  toggleInventory(): void {
    if (this.screen === "inventory") this.close();
    else this.inventory();
  }
  inventory(tab: InventoryTab = "provisions", preserve = false): void {
    if (!["play", "pause", "provisions", "inventory"].includes(this.screen) || this.app.world.health.dead) return;
    const scroll = preserve ? (this.overlay.querySelector(".panel")?.scrollTop ?? 0) : 0;
    const focus = preserve ? (document.activeElement as HTMLElement | null)?.dataset : undefined;
    const s = this.app.store.data, run = this.app.run, n = this.app.world.needs;
    const outfit = CLOTHING.find((c) => c.id === s.clothing)!;
    this.inventoryTab = tab;
    this.activeNpc = null;
    const tabs: [InventoryTab, string][] = [["provisions", "Comidas e bebidas"], ["resources", "Recursos"], ["clothes", "Vestimentas"], ["equipment", "Equipamento"]];
    let content = "";
    if (tab === "provisions") {
      content = `<div class="needs-summary"><span>Fome <b>${Math.round(n.hunger)}%</b></span><span>Sede <b>${Math.round(n.thirst)}%</b></span><span>Frio <b>${Math.round(n.cold)}%</b></span></div><p class="inventory-note">Quanto menores as barras, melhor. Escolha uma provisão para consumir. O tempo fica pausado neste menu.</p><div class="inventory-grid">${CONSUMABLES.map((i) => {
        const reason = consumableBlock(s, n, i.id);
        return `<article class="inventory-item" data-provision="${i.id}"><h3>${this.px(i.icon)} ${i.name}<span class="item-count" aria-label="Quantidade">${s.provisions[i.id]}</span></h3><p>${i.description}</p>${this.button("Consumir", "consume", i.id, "primary", reason)}${reason ? `<small>${reason}</small>` : ""}</article>`;
      }).join("")}</div>`;
    } else if (tab === "resources") {
      const sources: Record<string, string> = { grain: "Câmaras restauradas; mais abundante nos Jardins. Usado por Lume.", herb: "Câmaras restauradas; mais abundante nos Arquivos. Usado por Lume e Caio.", rawWater: "Câmaras restauradas; mais rara nas Forjas. Usada por Caio e Lume.", fiber: "Todas as câmaras restauradas. Usada por Íria.", hide: "Elites, desafios, chefes e algumas câmaras. Usado por Íria." };
      content = `<p class="inventory-note">Todos os ingredientes e materiais guardados, incluindo os que estão em falta. Os serviços de criação ficam com os moradores do Farol.</p><h3 class="inventory-section">Ingredientes e tecidos</h3><div class="inventory-grid resource-grid">${SURVIVAL_MATERIALS.map((m) => `<article class="inventory-item" data-stock="${m.id}"><h3>${this.px(m.icon)} ${m.name}<span class="item-count">${s.survivalMaterials[m.id]}</span></h3><p>${sources[m.id]}</p></article>`).join("")}</div><h3 class="inventory-section">Materiais da forja</h3><div class="inventory-grid resource-grid">${MATERIALS.map((m) => `<article class="inventory-item" data-stock="${m.id}"><h3>${this.px(m.icon)} ${m.name}<span class="item-count">${s.materials[m.id]}</span></h3><p>${m.source} Usado por Orren.</p></article>`).join("")}</div>`;
    } else if (tab === "clothes") {
      content = `<p class="inventory-note">Em uso: <b>${outfit.name}</b> · ${outfit.description} Troque aqui as roupas que já possui; converse com Íria para confeccionar novas peças.</p><div class="inventory-grid">${CLOTHING.map((c) => {
        const owned = s.wardrobe.includes(c.id), equipped = c.id === s.clothing;
        return `<article class="inventory-item ${equipped ? "equipped" : ""}" data-outfit="${c.id}"><h3>${this.px("coat")} ${c.name}</h3><p>${c.description}</p><strong>${owned ? "Quantidade: 1" : "Quantidade: 0 · Ainda não confeccionada"}</strong>${this.button(equipped ? "Equipada" : "Vestir", "wear", c.id, equipped ? "" : "primary", !owned ? "Confeccione esta vestimenta com Íria" : equipped ? "Vestimenta já equipada" : "")}</article>`;
      }).join("")}</div>`;
    } else {
      const active = run?.weapon ?? this.app.weapon;
      const expedition = run ?? s.run;
      content = `<p class="inventory-note">${SKILLS.filter((node) => skillRank(s, node.id) > 0).length} habilidades permanentes aprendidas. Converse com Orren para forjar e aprimorar. Equipe uma arma de cada tipo aqui e alterne entre elas com F.</p>${this.loadoutMarkup()}<div class="inventory-grid">${(Object.keys(WEAPONS) as WeaponId[]).map((id) => `<article class="inventory-item ${id === active ? "equipped" : ""}" data-owned-weapon="${id}"><h3>${this.px(id)} ${weaponName(s, id, WEAPONS[id].name)}</h3><strong>${s.unlocked.includes(id) ? (id === active ? "Em uso · Quantidade: 1" : "Quantidade: 1") : "Quantidade: 0 · Ainda não forjada"}</strong><p>${WEAPONS[id].description}</p><small>${s.weaponXP[id]} XP · ${WEAPONS[id].slot === "melee" ? "Corpo a corpo" : "Distância"} · ${s.weaponMastery[id].length}/7 técnicas</small>${s.unlocked.includes(id) ? this.button(id === active ? "Em uso" : "Equipar neste espaço", "equipWeapon", id, "primary", id === active ? "Arma já em uso" : "") : ""}<small>Forja +${s.weaponLevels[id]} · Infusão: ${INFUSIONS.find((i) => i.id === s.infusions[id])!.name}</small></article>`).join("")}</div><h3 class="inventory-section">Juramentos ${run ? "da expedição" : expedition ? "da expedição salva" : ""}</h3><div class="inventory-list">${expedition?.boons.length ? expedition.boons.map((id) => { const b = BOONS.find((b) => b.id === id)!; return `<article style="border-color:${SCHOOL_COLORS[b.school]}"><b>${b.name}</b><small>${b.school}</small><p>${b.description}</p></article>`; }).join("") : "<p>Nenhum Juramento guardado nesta expedição.</p>"}</div>`;
    }
    this.modal("Inventário de Eira", "MOCHILA & EQUIPAMENTOS", `${(run ?? s.run) ? `<div class="inventory-key" data-key-stock><b>⚿ Chave da fase ${(run ?? s.run)!.current % 9 + 1}</b><span>${phaseState((run ?? s.run)!).keyFound ? "Quantidade: 1 · Abre o portão desta fase" : "Quantidade: 0 · Procure o nicho escondido"}</span></div>` : ""}<div class="inventory-wallet"><span>${this.px("echo")} <b data-wallet="echoes">${s.echoes}</b> Ecos</span><span>${this.px("coin")} <b data-wallet="coins">${run?.coins ?? s.run?.coins ?? 0}</b> Óbolos${!run && s.run ? " da expedição salva" : ""}</span><span>${this.px("coat")} ${outfit.name}</span></div><nav class="inventory-tabs" aria-label="Categorias do inventário">${tabs.map(([id, label]) => this.button(label, "inventoryTab", id, id === tab ? "primary" : "").replace("<button ", `<button aria-pressed="${id === tab}" `)).join("")}</nav><section class="inventory-content" aria-label="${tabs.find(([id]) => id === tab)![1]}">${content}</section><p class="inventory-note inventory-footer">I ou Esc para fechar · Crie itens conversando com os moradores do Farol.</p>`, "inventory", true);
    this.overlay.querySelector(".panel")!.scrollTop = scroll;
    if (focus?.action && focus?.value)
      window.setTimeout(() => this.overlay.querySelector<HTMLButtonElement>(`[data-action="${focus.action}"][data-value="${focus.value}"]`)?.focus({ preventScroll: true }), 20);
  }
  failedObjective(): void {
    this.modal(
      "O mecanismo se calou",
      "OBJETIVO FALHOU",
      `<p>O núcleo perdeu sua integridade. A câmara não pode ser restaurada nesta tentativa.</p><div class="panel-footer">${this.button("Tentar a câmara novamente", "retry", "", "primary")}${this.button("Retornar ao Farol", "abandon")}</div>`,
      "death",
    );
  }
  endingChoice(): void {
    if (this.screen === "victory") return;
    this.modal(
      "O amanhã espera por sua mão",
      "O TEAR DO AMANHECER",
      `<p class="dialogue-text">“Você o partiu, Eira. Mas pode escolher o que nasce das peças.”</p><p>A centelha pode reconstruir o Tear sem sacrifícios, aceitando um amanhã incerto. Ou pode fechar o ciclo e preservar cada lembrança para sempre.</p><div class="event-options">${this.button("Devolver o movimento ao mundo <small>Reconstruir a aurora sem apagar memórias</small>", "ending", "restore")}${this.button("Guardar o último crepúsculo <small>Preservar as lembranças e suspender o tempo</small>", "ending", "preserve")}</div>`,
      "victory",
    );
    this.overlay.querySelector(".panel")!.insertAdjacentHTML("beforeend", `<div class="panel-footer">${this.button("Voltar ao Farol antes de decidir", "returnToHub")}</div>`);
  }
  death(run: Run): void {
    this.modal(
      "O Farol se lembra de você",
      "A TRAVESSIA TERMINOU",
      `<div class="end-sigil">◈</div><p class="dialogue-text">“Morrer não é esquecer. Ainda não.”</p><div class="stats"><div><b>${run.visited.length}</b><span>CÂMARAS</span></div><div><b>${run.kills}</b><span>ECOS LIBERTADOS</span></div><div><b>+${Math.max(4, Math.floor(run.kills / 2) + run.visited.length * 3)}</b><span>ECOS GUARDADOS</span></div></div><p>Armas, talentos e memórias permanecem. Óbolos e Juramentos ficam com a noite.</p><div class="panel-footer">${this.button("Ressurgir no Farol →", "hub", "", "primary")}</div>`,
      "death",
    );
    const loss = this.app.store.data.lastLoss ?? {};
    this.overlay.querySelector('.panel-footer')!.insertAdjacentHTML('beforebegin', `<div class="death-loss"><b>30% dos recursos em risco nesta fase foram perdidos.</b><div>${LOOT_ITEMS.filter(i => loss[i.id]).map(i => `<span>−${loss[i.id]} ${i.name}</span>`).join('') || '<span>Nenhum recurso novo estava em risco.</span>'}</div><p>O estoque anterior e os recursos guardados ao voltar ao Farol permanecem. Você retorna ao Refúgio da Centelha, junto de Sálvia, para investir em upgrades.</p></div>`);
  }
  victory(choice: string, run: Run): void {
    this.modal(
      choice === "restore"
        ? "Um sol que não exige esquecimento"
        : "A beleza de um instante eterno",
      choice === "restore"
        ? "DESFECHO I · A AURORA LIVRE"
        : "DESFECHO II · O CREPÚSCULO PRESERVADO",
      `<div class="end-sigil">☼</div><p class="dialogue-text">${choice === "restore" ? "Pela primeira vez em milênios, a luz não cobra uma lembrança. Eira deixa seus mapas para trás. O amanhã não terá caminhos prontos." : "O vento para entre duas folhas. Nenhuma criança esquecerá o rosto de sua mãe. E ninguém verá essas crianças crescerem. Eira vigia o último instante."}</p><div class="stats"><div><b>${run.kills}</b><span>ECOS LIBERTADOS</span></div><div><b>${run.visited.length}</b><span>CÂMARAS RESTAURADAS</span></div><div><b>${run.boons.length}</b><span>JURAMENTOS</span></div></div><div class="panel-footer">${this.button("Voltar ao Farol →", "hub", "", "primary")}</div>`,
      "victory",
      true,
    );
  }
  credits(): void {
    this.previous = this.screen;
    this.modal(
      "Véspera",
      "AS ENGRENAGENS DA ÚLTIMA AURORA",
      `<p>Um jogo original sobre luz, memória e o preço de continuar.</p><p>Desenvolvido em TypeScript com Phaser 3 e Vite. Pixel art original da era 32 bits, com sprites articulados, cenários e interface em PNG RGBA. Música e efeitos compostos por síntese Web Audio.</p><p>Hades é uma referência de gênero. Nenhum personagem, arte, música ou diálogo dessa obra é utilizado.</p><p class="fine-print">Identidade 2.0 · Implementação independente, de escopo compacto. Consulte o README para limitações de arte, sistemas e desempenho.</p>`,
      "credits",
    );
  }
  autoPause(): void {
    if (this.screen === "play" && !this.app.world?.isHub) this.pause();
  }
  escape(): void {
    if (this.screen === "play") this.pause();
    else if (["menu", "loading", "death", "victory"].includes(this.screen))
      return;
    else this.back();
  }
  back(): void {
    if (["campaigns", "newCampaign", "campaignDelete"].includes(this.screen)) {
      if (this.screen !== "campaigns") { this.campaigns(); return; }
      if (this.managementReturn === "menu") this.menu(); else { this.close(); this.pause(); }
      return;
    }
    if (["settings", "controls", "credits"].includes(this.screen) && this.previous === "pause") { this.close(); this.pause(); return; }
    if (
      ["settings", "controls", "credits"].includes(this.screen) &&
      this.previous === "menu"
    )
      this.menu();
    else if (this.screen === "mastery") this.armory();
    else if (this.screen === "rewards")
      this.toast("Escolha uma promessa ou guarde os óbolos.");
    else if (this.screen === "death" || this.screen === "victory") return;
    else this.close();
  }
  action(action: string, value: string): void {
    const app = this.app;
    switch (action) {
      case "hub":
        app.hub();
        break;
      case "returnToHub":
        app.returnToHub();
        break;
      case "npcService":
        this.openNpcService(value);
        break;
      case "craftProvision":
        app.craftProvision(value);
        break;
      case "wear":
        app.wear(value as ClothingId);
        break;
      case "consume":
        app.consume(value as ConsumableId);
        break;
      case "quickEat":
        app.consume(app.store.data.provisions.ration > 0 ? "ration" : "stew");
        break;
      case "quickDrink":
        app.consume(app.store.data.provisions.water > 0 ? "water" : "tea");
        break;
      case "provisions":
        this.provisions();
        break;
      case "continue":
        if (this.screen === "menu") app.resumeCampaign(); else app.continueRun();
        break;
      case "campaigns": this.campaigns(); break;
      case "campaignNew": this.newCampaign(); break;
      case "createCampaign": app.createCampaign((document.getElementById("campaign-name") as HTMLInputElement)?.value ?? "Nova campanha"); break;
      case "loadCampaign": void app.loadCampaign(value); break;
      case "exportCampaign": app.exportCampaign(); break;
      case "campaignDelete": {
        const c = app.store.campaigns.find(c => c.id === value && c.id !== app.store.activeId); if (!c) break;
        this.modal("Excluir campanha", "ESTA AÇÃO REMOVE O SAVE LOCAL", `<p>Excluir <b>${escape(c.name)}</b>? A campanha ativa será preservada. Exporte um backup antes se quiser guardar uma cópia.</p><div class="panel-footer">${this.button("Cancelar", "back")}${this.button("Excluir esta campanha", "deleteCampaign", value)}</div>`, "campaignDelete"); break;
      }
      case "deleteCampaign": app.store.deleteCampaign(value); this.campaigns(); break;
      case "saveNow": app.saveCheckpoint(); this.toast(app.store.available ? "Partida salva. Você pode retomar deste ponto." : "Não foi possível gravar. Exporte um backup em Campanhas."); break;
      case "menu":
        app.saveCheckpoint();
        this.menu();
        break;
      case "start":
        app.start(
          (document.getElementById("seed-input") as HTMLInputElement).value,
        );
        break;
      case "expedition":
        this.expedition();
        break;
      case "armory":
        this.forgeMode = "forge";
        this.armory();
        break;
      case "forgeMode":
        if (["forge", "upgrade", "infuse"].includes(value))
          this.forgeMode = value as CraftAction;
        this.armory(false);
        break;
      case "infusionChoice":
        if (INFUSIONS.some((i) => i.id === value))
          this.infusionChoice = value as InfusionId;
        this.armory();
        break;
      case "craft": {
        const [weapon, mode, infusion] = value.split(":");
        app.craft(
          weapon as WeaponId,
          mode as CraftAction,
          infusion as InfusionId,
        );
        break;
      }
      case "unlock":
        app.unlock(value as WeaponId);
        break;
      case "selectWeapon":
      case "equipWeapon":
        if (isWeapon(value)) void app.equip(value);
        break;
      case "mastery":
        if (isWeapon(value)) this.mastery(value);
        break;
      case "learnMastery": {
        const [weapon, node] = value.split(":");
        if (isWeapon(weapon)) app.mastery(weapon, node);
        break;
      }
      case "talents":
        this.talents();
        break;
      case "talent":
        app.buyTalent(value);
        break;
      case "skillBranch":
        if (SKILL_BRANCHES.some((b) => b.id === value))
          this.skillBranch = value as SkillBranch;
        this.talents(false);
        break;
      case "respec":
        app.respec();
        break;
      case "gallery":
        this.gallery();
        break;
      case "back":
        this.back();
        break;
      case "pause":
        this.pause();
        break;
      case "settings":
        this.settings();
        break;
      case "settingsBack":
        app.store.write();
        this.back();
        break;
      case "quality":
        app.store.data.settings.quality = value as "low" | "medium" | "high";
        app.store.write();
        {
          const prev = this.previous;
          this.settings();
          this.previous = prev;
        }
        break;
      case "controls":
        this.controls();
        break;
      case "credits":
        this.credits();
        break;
      case "villageGate":
        if (app.world.isHub) { this.close(); app.world.guideToVillageGate(); }
        break;
      case "villageGuide": {
        const n = hubNpc(value); if (!n || !app.world.isHub) break;
        this.close(); app.world.guideToNpc(n.id); break;
      }
      case "map":
        this.map();
        break;
      case "campaignMap":
        this.campaignMap();
        break;
      case "inventory":
        this.inventory();
        break;
      case "inventoryTab":
        if (this.screen === "inventory" && ["provisions", "resources", "clothes", "equipment"].includes(value))
          this.inventory(value as InventoryTab);
        break;
      case "dialogueNext":
        this.dialogueNext();
        break;
      case "dialogueTopic": if (this.activeNpc) this.dialogue(this.activeNpc, value); break;
      case "voiceReplay": if (this.activeNpc) app.voice.say(this.activeNpc, this.currentLine, true); break;
      case "voiceStop": app.voice.stop(); break;
      case "boon":
        this.acceptBoon(value);
        break;
      case "skipReward":
        if (app.run) app.world.collectLoot({ coins: 15 });
        app.world.rewardPending = false;
        app.saveCheckpoint();
        this.close();
        break;
      case "route":
        app.nextRoom(Number(value));
        break;
      case "buy": {
        const run = app.run!,
          cost = value === "heal" ? 30 : value === "boon" ? 55 : 40;
        if (run.coins < cost) {
          this.toast("Óbolos insuficientes.");
          break;
        }
        run.coins -= cost;
        if (value === "heal") app.world.health.heal(45);
        if (value === "echoes") app.world.collectLoot({ echoes: 8 });
        app.saveCheckpoint();
        if (value === "boon") this.rewards();
        else this.shop();
        break;
      }
      case "eventChoice":
        if (value === "preserve") {
          app.world.collectLoot({ echoes: 8 });
          app.remember("first");
          this.close();
        } else if (app.world.health.hp > 20) {
          app.world.health.hp -= 20;
          this.rewards();
        } else
          this.toast(
            "Sua luz precisa de mais de 20 de vida para alimentar a fonte.",
          );
        app.saveCheckpoint();
        break;
      case "ending":
        app.ending(value as "restore" | "preserve");
        break;
      case "retry":
        this.close();
        app.world.enterRoom();
        break;
      case "abandon":
        app.die();
        break;
    }
  }
}
