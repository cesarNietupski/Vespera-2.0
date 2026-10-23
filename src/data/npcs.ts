import type { NpcId, NpcService } from "../types";
export interface HubNpc {
  id: NpcId;
  name: string;
  role: string;
  service: NpcService;
  action: string;
  x: number;
  y: number;
  station?: string;
  houseX: number;
  houseY: number;
  houseName: string;
}
export const HUB_NPCS: HubNpc[] = [
  {
    id: "salvia",
    name: "Sálvia",
    role: "Guardiã da Centelha",
    service: "skills",
    action: "Desenvolver habilidades",
    x: 7.8,
    y: 8.8,
    houseX: 7,
    houseY: 8,
    houseName: "Casa da Centelha",
  },
  {
    id: "orren",
    name: "Orren",
    role: "Ferreiro sem Visão",
    service: "forge",
    action: "Abrir a forja",
    x: 17.8,
    y: 23.8,
    houseX: 17,
    houseY: 23,
    houseName: "Ferraria do Sol",
  },
  {
    id: "nim",
    name: "Nim",
    role: "Colecionador de Memórias",
    service: "memories",
    action: "Rever memórias",
    x: 17.8,
    y: 8.8,
    houseX: 17,
    houseY: 8,
    houseName: "Arquivo das Memórias",
  },
  {
    id: "lume",
    name: "Lume",
    role: "Cozinheira do Farol",
    service: "food",
    action: "Preparar comida",
    x: 7.8,
    y: 23.8,
    houseX: 7,
    houseY: 23,
    houseName: "Cozinha do Abrigo",
    station: "cookpot",
  },
  {
    id: "caio",
    name: "Caio",
    role: "Guardião das Águas",
    service: "drink",
    action: "Preparar bebidas",
    x: 27.8,
    y: 23.8,
    houseX: 27,
    houseY: 23,
    houseName: "Casa das Águas",
    station: "cistern",
  },
  {
    id: "iria",
    name: "Íria",
    role: "Costureira do Abrigo",
    service: "clothes",
    action: "Confeccionar vestimentas",
    x: 27.8,
    y: 8.8,
    houseX: 27,
    houseY: 8,
    houseName: "Ateliê dos Fios",
    station: "loom",
  },
];
export function hubNpc(idOrName: string): HubNpc | undefined {
  return HUB_NPCS.find((n) => n.id === idOrName || n.name === idOrName);
}
