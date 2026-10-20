import type { Vec } from "../types";

// A human is ~80 world pixels tall; columns remain ~180 pixels tall.
export function actorMetrics(texture: string, boss = false) {
  const scale = boss ? 1.15 : texture === "hound" ? 0.9 : 0.95;
  return {
    scale,
    origin: boss ? 179 / 192 : 90 / 112,
    height:
      (boss ? 150 : texture === "nim" ? 56 : texture === "hound" ? 64 : 86) *
      scale,
    shadowWidth: boss ? 64 : texture === "hound" ? 31 : 26,
    shadowHeight: boss ? 17 : 8,
  };
}

export interface OccluderBounds extends Vec {
  halfWidth: number;
  height: number;
}

// Only scenery in front of an actor and intersecting its body fades.
export function obscuresActor(scenery: OccluderBounds, actor: Vec): boolean {
  return (
    actor.y < scenery.y - 2 &&
    actor.y > scenery.y - scenery.height &&
    Math.abs(actor.x - scenery.x) < scenery.halfWidth + 12
  );
}

export function approachAlpha(
  current: number,
  target: number,
  dt: number,
): number {
  return current + (target - current) * (1 - Math.exp(-Math.max(0, dt) * 12));
}
