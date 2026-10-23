import type { ObjectiveKind } from "../types";
export type ObjectiveState = "pending" | "active" | "completed" | "failed";
export interface ObjectiveDef {
  title: string;
  instruction: string;
  target: number;
  timed: number;
  interact: boolean;
}
export const OBJECTIVES: Record<ObjectiveKind, ObjectiveDef> = {
  eliminate: {
    title: "Rompa o silêncio",
    instruction: "Derrote os guardiões desta câmara.",
    target: 1,
    timed: 0,
    interact: false,
  },
  purify: {
    title: "Purifique os obeliscos",
    instruction: "Segure E próximo a cada obelisco. Proteja a luz.",
    target: 3,
    timed: 0,
    interact: true,
  },
  escort: {
    title: "Escolte a lembrança",
    instruction: "Permaneça perto do Eco até alcançar o portão.",
    target: 100,
    timed: 0,
    interact: false,
  },
  defend: {
    title: "Defenda o mecanismo",
    instruction: "Proteja o núcleo enquanto ele desperta.",
    target: 35,
    timed: 35,
    interact: false,
  },
  chains: {
    title: "Destrua as correntes",
    instruction: "Ataque todos os selos dourados ao longo do percurso.",
    target: 3,
    timed: 0,
    interact: false,
  },
  collect: {
    title: "Reúna os fragmentos",
    instruction: "Explore o percurso e recolha todas as memórias.",
    target: 3,
    timed: 0,
    interact: false,
  },
  seal: {
    title: "Sele as fendas",
    instruction: "Segure E em cada fenda para costurar o tempo.",
    target: 3,
    timed: 0,
    interact: true,
  },
  puzzle: {
    title: "Reescreva a aurora",
    instruction: "Ative com E as runas em ordem: I → II → III → IV → V.",
    target: 3,
    timed: 0,
    interact: true,
  },
};
export class Objective {
  state: ObjectiveState = "pending";
  progress = 0;
  elapsed = 0;
  integrity = 100;
  damageTaken = 0;
  dashes = 0;
  constructor(
    public kind: ObjectiveKind,
    public target = OBJECTIVES[kind].target,
  ) {}
  get definition(): ObjectiveDef {
    return OBJECTIVES[this.kind];
  }
  start(): void {
    if (this.state === "pending") this.state = "active";
  }
  add(n = 1): void {
    if (this.state !== "active") return;
    this.progress = Math.min(this.target, this.progress + n);
    if (this.progress >= this.target) this.state = "completed";
  }
  tick(dt: number): void {
    if (this.state === "active") this.elapsed += dt;
  }
  fail(): void {
    if (this.state === "active") this.state = "failed";
  }
  secondary(): { name: string; success: boolean }[] {
    return [
      { name: "Sem deixar uma cicatriz", success: this.damageTaken === 0 },
      { name: "Antes do próximo ponteiro · 90s", success: this.elapsed <= 90 },
    ];
  }
}
