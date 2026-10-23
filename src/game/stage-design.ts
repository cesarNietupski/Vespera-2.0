export type StageRule = "traverse" | "ordered" | "islands" | "guarded" | "paired" | "rest" | "boss" | "treasure" | "timing";
export interface StageDesign { id: string; title: string; rule: StageRule; brief: string; }
const DESIGNS: Omit<StageDesign, "id">[] = [
  { title: "Travessia das alamedas", rule: "traverse", brief: "Atravesse cinco áreas e vença os guardas do caminho." },
  { title: "Labirinto dos ponteiros", rule: "ordered", brief: "Encontre a rota entre os becos e sintonize os marcos na ordem 1 → 2 → 3 → 4." },
  { title: "Arquipélago de memórias", rule: "islands", brief: "Pontes estreitas ligam pequenas ilhas. Recolha as cinco memórias antes de partir." },
  { title: "Bastião das sentinelas", rule: "guarded", brief: "Os marcos estão guardados. Derrote os inimigos próximos para poder sintonizá-los." },
  { title: "Encruzilhada dos pares", rule: "paired", brief: "Escolha entre o atalho e a volta longa. Ligue os pares na ordem 1 → 3 → 2 → 4." },
  { title: "Claustro da última luz", rule: "rest", brief: "Explore as quatro alas do refúgio. Cada marco recupera vida e calor; não há perigos cíclicos." },
  { title: "Arena do fragmento", rule: "boss", brief: "Leia os padrões do Vigia e use os espaços próprios desta arena." },
  { title: "Galerias do tesouro", rule: "treasure", brief: "Investigue os desvios e abra pelo menos dois baús para liberar a saída." },
  { title: "Passarela do juramento", rule: "timing", brief: "Atravesse o zigue-zague. Os marcos só podem ser sintonizados no intervalo seguro dos pulsos." },
];
const REGION = ["das raízes", "da fornalha", "das marés", "do eclipse"];
export function stageDesign(biome: number, chamber: number): StageDesign {
  const design = DESIGNS[chamber % 9];
  return { ...design, id: `region-${biome}:stage-${chamber % 9}`, title: `${design.title} · ${REGION[biome % 4]}` };
}
export function roomPlan(biome: number, chamber: number): number[][] {
  const plans: Record<number, number[][]> = {
    1: [[6, 8], [17, 5], [33, 5], [32, 24], [16, 25]],
    2: [[6, 8], [18, 5], [32, 9], [33, 24], [17, 25]],
    3: [[6, 8], [17, 6], [32, 8], [32, 24], [17, 24]],
    4: [[6, 8], [18, 6], [32, 8], [32, 24], [18, 24]],
    5: [[6, 9], [21, 14], [20, 5], [33, 14], [20, 25]],
    7: [[6, 7], [16, 7], [16, 24], [32, 24], [33, 8]],
    8: [[6, 8], [16, 5], [30, 7], [34, 24], [18, 26]],
  };
  if (plans[chamber % 9]) return plans[chamber % 9].map(([x, y], i) => [x - (i === 3 ? biome % 3 : i === 2 ? Math.floor(biome / 2) : 0), y + (i > 0 && i < 4 ? biome % 2 : 0)]);
  return [
    [[6, 9], [18, 7], [18, 23], [33, 23], [33, 8]],
    [[6, 7], [19, 7], [19, 23], [34, 23], [34, 7]],
    [[6, 8], [19, 7], [34, 8], [32, 24], [18, 24]],
    [[6, 8], [18, 8], [33, 8], [33, 25], [18, 25]],
  ][biome % 4].map(p => [...p]);
}
