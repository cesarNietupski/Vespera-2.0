import type { WeaponId, WeaponSlot, WeaponLoadout, Save } from "../types";
export interface WeaponDefinition {
  name: string; subtitle: string; damage: number; range: number; duration: number;
  special: number; icon: string; description: string;
  slot: WeaponSlot; family: "blade" | "hammer" | "bow";
  color: number; projectileSpeed: number; pierce: number; spread: readonly number[];
  perk: string; stats: Record<string, number>;
}
const weapon = (name: string, subtitle: string, slot: WeaponSlot, family: WeaponDefinition["family"], damage: number, range: number, duration: number, color: number, description: string, perk: string, stats: Record<string, number> = {}, projectileSpeed = 640, pierce = 0, spread: readonly number[] = [0]): WeaponDefinition => ({ name, subtitle, slot, family, damage, range, duration, color, description, perk, stats, projectileSpeed, pierce, spread, special: family === "hammer" ? 5 : slot === "ranged" ? 3.5 : 4, icon: "✦" });
export const WEAPONS: Record<WeaponId, WeaponDefinition> = {
  blade: weapon("Fioferro", "Lâmina de Memórias", "melee", "blade", 25, 100, .36, 0xb6ffe1, "Seis cortes, estocada, giro e finalizador. Equilíbrio entre alcance e cadência.", "Fio preciso", {}),
  hammer: weapon("Âncora Solar", "Martelo das Forjas", "melee", "hammer", 48, 122, .67, 0xffcb88, "Impactos pesados com atordoamento prolongado e varreduras amplas.", "Peso do sol", { area: .08 }),
  bow: weapon("Arco do Ocaso", "Flecha do último poente", "ranged", "bow", 22, 580, .4, 0xb6ffe1, "Flechas gêmeas, leque e perfuração no combo. Segure para carregar.", "Linha do horizonte", {}, 640),
  dagger: weapon("Dentes da Névoa", "Adagas gêmeas", "melee", "blade", 15, 76, .23, 0xcac1ff, "Cortes muito rápidos de curto alcance; favorecem críticos e mobilidade.", "Passo de névoa", { crit: .06, speed: .04 }),
  spear: weapon("Agulha da Aurora", "Lança de vigília", "melee", "blade", 29, 160, .49, 0xffe5ae, "Estocadas longas em arcos estreitos. Mantenha os inimigos à distância.", "Ponta vigilante", { execution: .1 }),
  greatsword: weapon("Sol Partido", "Montante de cinza", "melee", "hammer", 55, 142, .79, 0xffaf79, "Cortes lentos e largos que atingem grupos e rompem a linha inimiga.", "Horizonte partido", { area: .12 }),
  axe: weapon("Lenhadora de Horas", "Machado do jardim", "melee", "hammer", 39, 110, .54, 0x99e5ac, "Machadadas firmes. O gume pune alvos já feridos.", "Último anel", { execution: .22 }),
  scythe: weapon("Lua Ceifada", "Foice dos ecos", "melee", "blade", 27, 145, .5, 0xb5aeff, "Varreduras circulares e alcance amplo; cada abate recupera vida.", "Colheita lunar", { killHeal: 1.5 }),
  rapier: weapon("Pêndulo Real", "Florete de vidro", "melee", "blade", 23, 125, .3, 0xb2e5ff, "Estocadas precisas, arco estreito e alto potencial crítico.", "Ponto imóvel", { crit: .08 }),
  crossbow: weapon("Voto de Ferro", "Besta de pressão", "ranged", "bow", 43, 690, .72, 0xffd59d, "Virotes pesados e rápidos que atravessam um inimigo adicional.", "Virote jurado", {}, 810, 1),
  staff: weapon("Maré de Âmbar", "Cajado das marés", "ranged", "bow", 19, 510, .55, 0xb6a3ff, "Três orbes em leque. A maré desacelera os inimigos atingidos.", "Corrente de âmbar", { slow: .12 }, 420, 0, [-.14, 0, .14]),
  pistol: weapon("Última Faísca", "Pistola de brasa", "ranged", "bow", 18, 460, .26, 0xffb17a, "Projéteis velozes e cadência alta, com alcance menor que o arco.", "Faísca certeira", { crit: .03 }, 980),
  chakram: weapon("Órbita Esquecida", "Disco de vidro", "ranged", "bow", 26, 470, .49, 0x9bf1dd, "Discos de alcance médio que atravessam até dois inimigos.", "Aro cortante", {}, 530, 2),
};
export const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[];
export const isWeapon = (id: unknown): id is WeaponId => typeof id === "string" && Object.hasOwn(WEAPONS, id);
export const actorTexture = (id: WeaponId): string => id === "blade" ? "eira" : `eira-${id}`;
export function weaponRecord<T>(value: () => T): Record<WeaponId, T> { return Object.fromEntries(WEAPON_IDS.map(id => [id, value()])) as Record<WeaponId, T>; }
export function validLoadout(raw: unknown, unlocked: WeaponId[], fallback?: WeaponId): WeaponLoadout {
  const input = raw && typeof raw === "object" ? raw as Partial<WeaponLoadout> : {};
  const loadout: WeaponLoadout = { melee: "blade", ranged: "bow" };
  for (const slot of ["melee", "ranged"] as const) {
    const id = input[slot];
    if (isWeapon(id) && WEAPONS[id].slot === slot && unlocked.includes(id)) loadout[slot] = id;
    else if (fallback && WEAPONS[fallback].slot === slot && unlocked.includes(fallback)) loadout[slot] = fallback;
  }
  return loadout;
}
export function equipWeapon(save: Save, id: WeaponId): boolean {
  if (!isWeapon(id) || !save.unlocked.includes(id)) return false;
  save.loadout[WEAPONS[id].slot] = id;
  save.equipped = id;
  return true;
}
