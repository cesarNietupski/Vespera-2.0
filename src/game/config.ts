import type { EnemyKind, WeaponId } from "../types";
export const CONTENT_VERSION = "1.0.0";
export const TILE = 42;
export const BALANCE = {
  hp: 120,
  speed: 185,
  dashSpeed: 650,
  dashDuration: 0.19,
  dashCooldown: 0.85,
  invulnerability: 0.6,
  enemyCap: 12,
  particleCap: 220,
  crit: 0.12,
  critMultiplier: 1.7,
};
export const WEAPONS: Record<
  WeaponId,
  {
    name: string;
    subtitle: string;
    damage: number;
    range: number;
    duration: number;
    special: number;
    icon: string;
    description: string;
  }
> = {
  blade: {
    name: "Fioferro",
    subtitle: "Lâmina de Memórias",
    damage: 25,
    range: 100,
    duration: 0.36,
    special: 4,
    icon: "⟋",
    description:
      "Seis golpes: cortes, estocada, giro e um finalizador que rompe a guarda.",
  },
  hammer: {
    name: "Âncora Solar",
    subtitle: "Martelo das Forjas",
    damage: 48,
    range: 122,
    duration: 0.67,
    special: 5,
    icon: "⚒",
    description:
      "Seis impactos distintos. Varreduras, ascensão e um golpe final de área.",
  },
  bow: {
    name: "Arco do Ocaso",
    subtitle: "Flecha do último poente",
    damage: 22,
    range: 580,
    duration: 0.4,
    special: 3.5,
    icon: "⌁",
    description:
      "Seis disparos: flechas gêmeas, leque e perfuração. Segure para carregar.",
  },
};
export const BIOMES = [
  {
    name: "Jardins da Hora Quebrada",
    short: "Os jardins",
    eyebrow: "I · O TEMPO CRIOU RAÍZES",
    color: "#67e7ba",
    floor: "#1b3637",
    dark: "#07191e",
    accent: "#c5ac73",
    boss: "O Cervo de Vidro",
    quote: "Nem toda lembrança quer ser encontrada.",
    motif: "raízes",
  },
  {
    name: "Forjas do Crepúsculo",
    short: "As forjas",
    eyebrow: "II · O FOGO AINDA SE LEMBRA",
    color: "#ff995c",
    floor: "#392c2a",
    dark: "#1e1118",
    accent: "#cb8556",
    boss: "Almirante das Brasas",
    quote: "O calor de um sol morto ainda pode queimar.",
    motif: "engrenagens",
  },
  {
    name: "Arquivo das Marés",
    short: "O arquivo",
    eyebrow: "III · AS PALAVRAS SUBMERSAS",
    color: "#aaa2ff",
    floor: "#292c48",
    dark: "#101326",
    accent: "#b4bed9",
    boss: "A Bibliotecária das Marés",
    quote: "O que foi esquecido aprende a respirar debaixo d’água.",
    motif: "marés",
  },
  {
    name: "Cúpula do Eclipse",
    short: "A cúpula",
    eyebrow: "IV · ONDE A AURORA TERMINA",
    color: "#f3cf8e",
    floor: "#36323a",
    dark: "#12111d",
    accent: "#dbac62",
    boss: "A Regente Oca",
    quote: "Salvar o amanhecer tem um preço. Você o conhece.",
    motif: "astros",
  },
] as const;
export const ENEMIES: Record<
  EnemyKind,
  {
    name: string;
    hp: number;
    damage: number;
    speed: number;
    range: number;
    cooldown: number;
    color: number;
  }
> = {
  swordsman: {
    name: "Esgrimista sem ontem",
    hp: 56,
    damage: 12,
    speed: 91,
    range: 60,
    cooldown: 1.5,
    color: 0xe6b8a0,
  },
  archer: {
    name: "Arqueiro espectral",
    hp: 40,
    damage: 10,
    speed: 80,
    range: 340,
    cooldown: 2.1,
    color: 0x9eceff,
  },
  guardian: {
    name: "Guardião do vazio",
    hp: 130,
    damage: 24,
    speed: 45,
    range: 100,
    cooldown: 2.6,
    color: 0xd8bb81,
  },
  hound: {
    name: "Farejador de horas",
    hp: 34,
    damage: 9,
    speed: 151,
    range: 58,
    cooldown: 1.2,
    color: 0xa2e9ac,
  },
  summoner: {
    name: "Invocador de lembranças",
    hp: 65,
    damage: 9,
    speed: 57,
    range: 300,
    cooldown: 3.3,
    color: 0xd8a2ed,
  },
  automaton: {
    name: "Autômato de pressão",
    hp: 42,
    damage: 23,
    speed: 98,
    range: 92,
    cooldown: 1.4,
    color: 0xffa865,
  },
  wraith: {
    name: "Vulto sem rosto",
    hp: 48,
    damage: 12,
    speed: 105,
    range: 240,
    cooldown: 2.2,
    color: 0xa1e5ec,
  },
  elite: {
    name: "Vigia das correntes",
    hp: 155,
    damage: 20,
    speed: 99,
    range: 100,
    cooldown: 1.5,
    color: 0xeb798d,
  },
};
