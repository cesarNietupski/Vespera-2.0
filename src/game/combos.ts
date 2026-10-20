import type { WeaponId } from "../types";
import { HERO_FRAMES } from "./animation";
export interface ComboMove {
  name: string;
  animation: string;
  duration: number;
  power: number;
  range: number;
  arc: number;
  activeStart: number;
  activeEnd: number;
  arrows: readonly number[];
  pierce: number;
}
const move = (
  i: number,
  name: string,
  duration: number,
  power: number,
  range = 1,
  arc = 1.2,
  arrows: readonly number[] = [0],
  pierce = 0,
): ComboMove => ({
  name,
  animation: `attack${i}`,
  duration,
  power,
  range,
  arc,
  activeStart: Math.floor(HERO_FRAMES[`attack${i}`] * 0.4),
  activeEnd: Math.floor(HERO_FRAMES[`attack${i}`] * 0.62),
  arrows,
  pierce,
});
export const COMBOS: Record<WeaponId, readonly ComboMove[]> = {
  blade: [
    move(1, "Corte da centelha", 1, 1),
    move(2, "Fio de retorno", 0.94, 1.05),
    move(3, "Estocada de memória", 1.05, 1.2, 1.35, 0.55),
    move(4, "Órbita partida", 1.14, 1.15, 1.08, 2.4),
    move(5, "Ascensão do fio", 1, 1.2, 1.1, 1.3),
    move(6, "Último amanhecer", 1.35, 1.7, 1.25, 2.6),
  ],
  hammer: [
    move(1, "Queda da forja", 1, 1),
    move(2, "Varredura de bronze", 0.95, 0.95, 1.15, 2),
    move(3, "Ruptura frontal", 1.1, 1.25, 1.25, 0.8),
    move(4, "Volta da bigorna", 1.2, 1.15, 1.2, 2.6),
    move(5, "Brasa ascendente", 1, 1.15, 1.05, 1.5),
    move(6, "Peso do sol", 1.4, 1.8, 1.45, Math.PI),
  ],
  bow: [
    move(1, "Flecha do poente", 1, 1),
    move(2, "Disparo de retorno", 0.9, 0.95),
    move(3, "Flechas gêmeas", 1.1, 0.8, 1, 1.2, [-0.06, 0.06]),
    move(4, "Linha do horizonte", 1.2, 1.45, 1, 1.2, [0], 1),
    move(5, "Leque do ocaso", 1.1, 0.65, 1, 1.2, [-0.18, 0, 0.18]),
    move(6, "Memória perfurante", 1.4, 1.7, 1, 1.2, [0], 2),
  ],
};
export function comboMove(weapon: WeaponId, step: number): ComboMove {
  return COMBOS[weapon][
    (((step - 1) % COMBOS[weapon].length) + COMBOS[weapon].length) %
      COMBOS[weapon].length
  ];
}
export class AttackBuffer {
  remaining = 0;
  charged = false;
  request(charged = false): void {
    this.remaining = 0.9;
    this.charged = charged;
  }
  tick(dt: number): void {
    this.remaining = Math.max(0, this.remaining - dt);
  }
  take(): boolean | null {
    if (this.remaining <= 0) return null;
    const value = this.charged;
    this.clear();
    return value;
  }
  clear(): void {
    this.remaining = 0;
    this.charged = false;
  }
}
