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
}
export const HUB_NPCS: HubNpc[] = [
  {
    id: "salvia",
    name: "Sálvia",
    role: "Guardiã da Centelha",
    service: "skills",
    action: "Desenvolver habilidades",
    x: 10,
    y: 6,
  },
  {
    id: "orren",
    name: "Orren",
    role: "Ferreiro sem Visão",
    service: "forge",
    action: "Abrir a forja",
    x: 9,
    y: 12,
  },
  {
    id: "nim",
    name: "Nim",
    role: "Colecionador de Memórias",
    service: "memories",
    action: "Rever memórias",
    x: 15,
    y: 7,
  },
  {
    id: "lume",
    name: "Lume",
    role: "Cozinheira do Farol",
    service: "food",
    action: "Preparar comida",
    x: 6,
    y: 9,
    station: "cookpot",
  },
  {
    id: "caio",
    name: "Caio",
    role: "Guardião das Águas",
    service: "drink",
    action: "Preparar bebidas",
    x: 13,
    y: 12,
    station: "cistern",
  },
  {
    id: "iria",
    name: "Íria",
    role: "Costureira do Abrigo",
    service: "clothes",
    action: "Confeccionar vestimentas",
    x: 16,
    y: 10,
    station: "loom",
  },
];
export function hubNpc(idOrName: string): HubNpc | undefined {
  return HUB_NPCS.find((n) => n.id === idOrName || n.name === idOrName);
}
