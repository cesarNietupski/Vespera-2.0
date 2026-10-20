import type { Vec } from "../types";
export function damage(hp: number, amount: number): number {
  return Math.max(
    0,
    Number.isFinite(hp)
      ? hp - Math.max(0, Number.isFinite(amount) ? amount : 0)
      : 0,
  );
}
export class Vitality {
  hp: number;
  immune = 0;
  dead = false;
  constructor(public max: number) {
    this.hp = max;
  }
  tick(dt: number): void {
    this.immune = Math.max(0, this.immune - dt);
  }
  hit(amount: number, iframes = 0.6, ignoreImmunity = false): boolean {
    if (
      this.dead ||
      (this.immune > 0 && !ignoreImmunity) ||
      !Number.isFinite(amount) ||
      amount <= 0
    )
      return false;
    this.hp = damage(this.hp, amount);
    if (!ignoreImmunity) this.immune = iframes;
    this.dead = this.hp === 0;
    return true;
  }
  heal(n: number): void {
    if (!this.dead) this.hp = Math.min(this.max, this.hp + Math.max(0, n));
  }
  resurrect(): void {
    this.hp = this.max;
    this.dead = false;
    this.immune = 1;
  }
}
export class Cooldown {
  remaining = 0;
  constructor(public duration: number) {}
  tick(dt: number): void {
    this.remaining = Math.max(0, this.remaining - dt);
  }
  use(): boolean {
    if (this.remaining > 0) return false;
    this.remaining = this.duration;
    return true;
  }
}
export class AttackTimeline {
  elapsed = 0;
  hit = new Set<number>();
  constructor(
    public frames: number,
    public duration: number,
    public activeStart: number,
    public activeEnd: number,
    public angle: number,
    public power = 1,
    public style = "attack1",
  ) {}
  get frame(): number {
    return Math.min(
      this.frames - 1,
      Math.floor((this.elapsed / this.duration) * this.frames),
    );
  }
  get active(): boolean {
    return this.frame >= this.activeStart && this.frame <= this.activeEnd;
  }
  get finished(): boolean {
    return this.elapsed >= this.duration;
  }
  get cancellable(): boolean {
    return this.frame >= this.activeEnd;
  }
  tick(dt: number): void {
    this.elapsed += dt;
  }
}
export function distance(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
export function inArc(
  origin: Vec,
  target: Vec,
  angle: number,
  range: number,
  arc = 1.15,
): boolean {
  const a = Math.atan2(target.y - origin.y, target.x - origin.x);
  return (
    distance(origin, target) < range &&
    Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle))) < arc
  );
}
