import type { Save } from "../types";
export const MEMORIES = [
  {
    id: "first",
    title: "A cartógrafa",
    text: "Eu desenhava as correntes que levavam lembranças ao Tear. Pensava que mapas eram inocentes. Agora reconheço cada desvio que abriu caminho para o colapso.",
  },
  {
    id: "garden",
    title: "O jardim sem nomes",
    text: "Sob o vidro do Cervo, Eira encontra uma lista de famílias. Todas haviam sido apagadas para financiar uma única manhã na capital.",
  },
  {
    id: "forge",
    title: "A ordem de Eira",
    text: "A assinatura na ordem de desligamento é sua. Você abriu as válvulas para impedir o sacrifício de uma cidade inteira. A Regente apenas esperava por isso.",
  },
  {
    id: "archive",
    title: "O que Sálvia guardou",
    text: "Sálvia preservou a lembrança que você entregou: uma criança ao sol, sem medo de esquecer. Reconstruir a máquina não exige repetir seus crimes.",
  },
  {
    id: "regent",
    title: "A última aurora",
    text: "A Regente não roubou a luz. Aprisionou a mudança. Eira pode devolver ao mundo um amanhã incerto — ou guardar todos os seus ontens.",
  },
];
export function dialogue(
  who: string,
  s: Save,
): { speaker: string; role: string; lines: string[] } {
  if (who === "Sálvia")
    return {
      speaker: who,
      role: "Guardiã do Farol",
      lines: s.bosses.includes(2)
        ? [
            "Eu guardei uma lembrança sua. Uma que o Tear nunca deveria ter consumido.",
            "A aurora não precisa ser alimentada por esquecimentos. Você pode mudar o que construiu.",
          ]
        : s.deaths > 0
          ? [
              `O Farol a trouxe de volta ${s.deaths} vez${s.deaths > 1 ? "es" : ""}. Cada retorno deixa uma marca que só eu consigo ver.`,
              "Você não nasceu com essa luz, Eira. Estava lá quando o Tear se partiu. Procure as memórias dos Vigias.",
            ]
          : [
              "O mundo aprendeu a viver sem o sol. Ainda não aprendeu a viver sem lembranças.",
              "Você era nossa cartógrafa. Agora carrega a única centelha capaz de alcançar o Tear.",
              "Atravesse o portal. E, se a escuridão vencer, encontre o caminho de volta.",
            ],
    };
  if (who === "Orren")
    return {
      speaker: who,
      role: "Ferreiro sem Visão",
      lines: [
        "Não preciso de olhos para reconhecer metal vivo. Ele vibra quando ouve seu nome.",
        "Cada arma lembra um jeito diferente de perder. Aprenda um jeito novo de voltar.",
      ],
    };
  if (who === "Lume")
    return {
      speaker: who,
      role: "Cozinheira do Farol",
      lines: [
        "Fome nenhuma respeita uma espada. Traga grãos e ervas; eu preparo algo que aguente a estrada.",
        "Uma ração cabe no bolso. Um ensopado também aquece. Use R para comer ou abra suas Provisões para escolher.",
      ],
    };
  if (who === "Caio")
    return {
      speaker: who,
      role: "Guardião das Águas",
      lines: [
        "Água das ruínas precisa de cuidado. Eu a purifico; com ervas, preparo um chá que espanta o frio.",
        "Nas Forjas a sede vem mais depressa. No Arquivo e na Cúpula, leve chá e um bom casaco.",
      ],
    };
  if (who === "Íria")
    return {
      speaker: who,
      role: "Costureira do Abrigo",
      lines: [
        "A aurora pode morar dentro de você, mas o vento ainda encontra as frestas. Traga fibras e couro.",
        "Comece por um manto. Depois faço um casaco forrado. A roupa reduz a exposição; uma fogueira continua sendo bem-vinda.",
      ],
    };
  return {
    speaker: "Nim",
    role: "Colecionador de Ecos",
    lines: s.bosses.length
      ? [
          "Olha só! Você trouxe uma memória que ainda brilha. Não venda isso.",
          "Os Juramentos são promessas feitas por quem já não está aqui. Combine escolas. As promessas conversam entre si.",
        ]
      : [
          "Shhh. Estou ouvindo um ontem passar.",
          "Traga Ecos de suas expedições. Algumas coisas sobrevivem até ao esquecimento.",
        ],
  };
}
