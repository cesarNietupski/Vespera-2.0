import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CAMPAIGNS_KEY, freshSave, newRun, SaveStore, parseSave, finishRun } from "../src/game/save";
import { parseWorldCheckpoint, savedPosition, type WorldCheckpoint } from "../src/game/checkpoint";

const KEY = "vespera.save.v2";
let disk: Map<string, string>;
beforeEach(() => {
  disk = new Map();
  vi.stubGlobal("localStorage", { getItem: (k: string) => disk.get(k) ?? null, setItem: (k: string, v: string) => disk.set(k, v) });
});
afterEach(() => vi.unstubAllGlobals());

describe("Campanhas locais", () => {
  it("migra o save anterior e preserva configurações ao criar outra história", () => {
    const old = freshSave(); old.echoes = 91; old.settings.voice = .3; old.run = newRun("ANTIGA", "blade", 120);
    disk.set(KEY, JSON.stringify(old));
    const store = new SaveStore(), original = store.activeId;
    expect(store.data.echoes).toBe(91);
    store.createCampaign("  Aurora nova  ");
    expect(store.activeCampaign.name).toBe("Aurora nova");
    expect(store.data.echoes).toBe(0); expect(store.data.run).toBeNull(); expect(store.data.settings.voice).toBe(.3);
    store.data.echoes = 14; store.write();
    expect(store.selectCampaign(original)).toBe(true);
    expect(store.data.echoes).toBe(91); expect(store.data.run?.seed).toBe("ANTIGA");
    const reload = new SaveStore(); expect(reload.data.echoes).toBe(91); expect(reload.campaigns).toHaveLength(2);
    reload.selectCampaign(reload.campaigns[1].id); expect(reload.data.echoes).toBe(14);
  });
  it("importa em espaço independente e não compartilha referências de inventário", () => {
    const store = new SaveStore(), oldId = store.activeId, imported = freshSave(); imported.provisions.stew = 12;
    store.createCampaign("Backup", imported); imported.provisions.stew = 0;
    expect(store.data.provisions.stew).toBe(12);
    store.data.provisions.stew = 10; store.selectCampaign(oldId);
    expect(store.data.provisions.stew).toBe(0);
    expect(store.deleteCampaign(oldId)).toBe(false);
    expect(store.deleteCampaign("missing")).toBe(false);
    expect(store.deleteCampaign(store.campaigns[1].id)).toBe(true);
    expect(new SaveStore().campaigns).toHaveLength(1);
  });
  it("limita a seis espaços e limpa nomes sem apagar o progresso ativo", () => {
    const store = new SaveStore();
    for (let i = 0; i < 5; i++) store.createCampaign("\u0000" + "x".repeat(80));
    expect(store.activeCampaign.name).toHaveLength(40);
    expect(() => store.createCampaign("Sétima")).toThrow(/seis/);
    expect(store.campaigns).toHaveLength(6);
  });
  it("recupera a cópia da campanha se o espelho ativo estiver corrompido", () => {
    const store = new SaveStore(); store.data.echoes = 67; store.write();
    disk.set(KEY, "{broken");
    expect(new SaveStore().data.echoes).toBe(67);
    disk.set(CAMPAIGNS_KEY, "{broken"); disk.set(KEY, JSON.stringify(store.data));
    expect(new SaveStore().data.echoes).toBe(67);
  });
  it("rejeita IDs repetidos e informa armazenamento bloqueado", () => {
    const store = new SaveStore(); store.write();
    const a = JSON.parse(disk.get(CAMPAIGNS_KEY)!); a.campaigns.push(a.campaigns[0], { id: "../invalid", data: freshSave() }); disk.set(CAMPAIGNS_KEY, JSON.stringify(a));
    expect(new SaveStore().campaigns).toHaveLength(1);
    vi.stubGlobal("localStorage", { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("blocked"); } });
    const blocked = new SaveStore(); expect(blocked.available).toBe(false); blocked.write(); expect(blocked.available).toBe(false);
  });
});

function checkpoint(): WorldCheckpoint {
  return { version: 1, room: 0, pos: { x: 400, y: 400 }, facing: 1, elapsed: 24, cleared: false, rewardPending: false,
    objective: { kind: "eliminate", state: "active", target: 10, progress: 3, elapsed: 20, integrity: 80, damageTaken: 12, dashes: 2 },
    enemies: [{ kind: "guardian", pos: { x: 440, y: 400 }, hp: 37, maxHP: 130, boss: false, phase: 1, lootKey: "enemy:6", attackCount: 3, burn: 1, slow: 2, burnDamage: 4, slowAmount: .2, lastHitWeapon: "blade" }],
    markers: [{ pos: { x: 500, y: 500 }, progress: 1, done: true, hp: 70 }], relays: [1.4, .5, 0], stageZones: [0, 1], pendingWave: 1, waveTimer: 2, spawnSerial: 7, escortPath: [], escortLength: 1, escortTravel: 0, arrivals: [{ kind: "hound", pos: { x: 600, y: 600 }, remaining: .7 }] };
}
describe("Checkpoint de câmara", () => {
  it("preserva combate, posição, objetivos e reforços após serialização", () => {
    const save = freshSave(); save.run = newRun("CHECKPOINT", "blade", 91); save.run.checkpoint = checkpoint();
    expect(parseSave(JSON.stringify(save)).run?.checkpoint).toEqual(checkpoint());
  });
  it("rejeita dados de outra câmara e coordenadas inválidas", () => {
    expect(parseWorldCheckpoint(checkpoint(), 1)).toBeUndefined();
    expect(parseWorldCheckpoint({ ...checkpoint(), pos: { x: Infinity, y: 3 } }, 0)).toBeUndefined();
    expect(savedPosition({ x: -1, y: 0 })).toBeUndefined();
    expect(parseWorldCheckpoint({ ...checkpoint(), objective: { kind: "__proto__" } }, 0)).toBeUndefined();
  });
  it("mantém inimigos mortos, limpa tipos desconhecidos e limita campos importados", () => {
    const cp = checkpoint(); cp.enemies[0].hp = 0; cp.relays = [Infinity, 100, -2]; cp.stageZones = [0, 0, 9];
    cp.enemies.push({ ...cp.enemies[0], kind: "invalid" as any });
    const parsed = parseWorldCheckpoint(cp, 0)!;
    expect(parsed.enemies).toHaveLength(1); expect(parsed.enemies[0].hp).toBe(0);
    expect(parsed.relays).toEqual([0, 1.4, 0]); expect(parsed.stageZones).toEqual([0]);
  });
  it("permite metas zero em câmaras pacíficas e não retoma expedições encerradas", () => {
    const cp = checkpoint(); cp.objective.target = 0; expect(parseWorldCheckpoint(cp, 0)?.objective.target).toBe(0);
    const save = freshSave(), run = newRun("FIM", "blade", 120); run.checkpoint = cp; save.run = run;
    finishRun(save, run, "death");
    const loaded = parseSave(JSON.stringify(save)); expect(loaded.run).toBeNull(); expect(loaded.location?.area).toBe("hub");
  });
});
