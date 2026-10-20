import type { School } from "../types";
export interface Boon {
  id: string;
  school: School;
  name: string;
  description: string;
  stat: string;
  value: number;
}
export const SCHOOL_COLORS: Record<School, string> = {
  Vidro: "#96e9db",
  Cinza: "#ffaf7d",
  Maré: "#9ebeff",
  Eco: "#d8acff",
};
const make = (
  school: School,
  defs: [string, string, string, number][],
): Boon[] =>
  defs.map(([name, description, stat, value], i) => ({
    id: `${school}-${i}`,
    school,
    name,
    description,
    stat,
    value,
  }));
export const BOONS: Boon[] = [
  ...make("Vidro", [
    ["Fio translúcido", "Seus golpes causam 22% mais dano.", "damage", 0.22],
    ["Ponto de ruptura", "+15% de chance de acerto crítico.", "crit", 0.15],
    ["Mil estilhaços", "Críticos causam 60% mais dano.", "critDamage", 0.6],
    ["Passo de cristal", "Esquivas recarregam 20% mais rápido.", "dash", 0.2],
    ["Espelho vivo", "O especial devolve projéteis próximos.", "reflect", 1],
    ["Luz cortante", "Projéteis atravessam mais um inimigo.", "pierce", 1],
  ]),
  ...make("Cinza", [
    [
      "Brasa antiga",
      "Ataques incendeiam por 4 de dano por segundo.",
      "burn",
      4,
    ],
    ["Último calor", "+30% de dano no ataque carregado.", "charged", 0.3],
    [
      "Pira dos ausentes",
      "Inimigos derrotados explodem ao redor.",
      "explode",
      18,
    ],
    ["Sangue de forja", "Especial causa 35% mais dano.", "special", 0.35],
    [
      "Cinzas ao vento",
      "Esquivas deixam uma explosão de 12 de dano.",
      "dashFire",
      12,
    ],
    ["Sol insaciável", "Incêndios duram mais e ficam mais fortes.", "burn", 6],
  ]),
  ...make("Maré", [
    ["Água na ferida", "Recupere 1 de vida a cada 5 segundos.", "regen", 0.2],
    [
      "Corrente profunda",
      "Ataques reduzem velocidade inimiga em 25%.",
      "slow",
      0.25,
    ],
    ["Círculo da maré", "Alcance de ataques de área +25%.", "area", 0.25],
    ["Abrigo submerso", "Reduz todo dano recebido em 15%.", "armor", 0.15],
    [
      "Fonte da lembrança",
      "Recupere 12 de vida ao concluir uma sala.",
      "heal",
      12,
    ],
    ["Maré crescente", "Vida máxima +30 e recupera 30 de vida.", "hp", 30],
  ]),
  ...make("Eco", [
    ["O segundo golpe", "Seus golpes repetem 22% do dano.", "echo", 0.22],
    ["O ontem veloz", "Velocidade de movimento +18%.", "speed", 0.18],
    [
      "Ressonância",
      "Eliminações geram 40% mais energia suprema.",
      "charge",
      0.4,
    ],
    [
      "Relógio sem horas",
      "Especial recarrega 20% mais rápido.",
      "cooldown",
      0.2,
    ],
    ["Memória voraz", "Ganhe mais 4 moedas por eliminação.", "gold", 4],
    [
      "Entre dois instantes",
      "Após esquivar, ganhe 0,2s extra de invulnerabilidade.",
      "iframes",
      0.2,
    ],
  ]),
];
export function boonStats(ids: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ids) {
    const b = BOONS.find((x) => x.id === id);
    if (b) out[b.stat] = (out[b.stat] ?? 0) + b.value;
  }
  return out;
}
