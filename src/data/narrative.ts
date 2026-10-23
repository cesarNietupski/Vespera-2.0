import type { Save, NpcId } from "../types";
export const CONVERSATIONS: Record<NpcId, { id: string; label: string; lines: string[] }[]> = {
  salvia: [
    { id: "past", label: "Como você mantém o Farol aceso?", lines: ["Uma centelha sozinha se apaga. Nós a dividimos: Lume cuida do fogo, Caio da água, Íria do abrigo. O Farol é o que fazemos uns pelos outros.", "Você também pode descansar, Eira. Não precisa salvar o amanhã a cada instante."] },
    { id: "road", label: "O que devo procurar nas ruínas?", lines: ["Os marcos conservam a memória de cada lugar. Sintonize todos e escute o que a câmara pede.", "Os portões guardam outra promessa. Procure o nicho de bronze; a chave nunca estará além de uma passagem que você ainda não pode abrir."] },
  ],
  orren: [
    { id: "past", label: "Você sempre trabalhou com armas?", lines: ["Antes eu fazia dobradiças. Portas, janelas, coisas que deixavam a luz entrar. Ainda prefiro esse trabalho.", "Forjo suas armas para que um dia possamos precisar apenas de portas novamente."] },
    { id: "road", label: "Como aprendo novas técnicas?", lines: ["Ferro nenhum aprende por você. Use a arma contra os guardiões; cada vitória deixa experiência naquela arma.", "Depois venha à forja. Mostro as técnicas que sua mão já está pronta para entender. Leve também ferro, vidro e brasas."] },
  ],
  nim: [
    { id: "past", label: "O que você ouve nos Ecos?", lines: ["Uma risada, às vezes. Uma receita sem as medidas. Ontem encontrei alguém lembrando de um cachorro que nunca soube ficar quieto.", "Não coleciono tesouros. Coleciono provas de que nós estivemos aqui."] },
    { id: "road", label: "Como encontro os caminhos escondidos?", lines: ["Paredes rachadas são péssimas em guardar segredo. Chegue perto e investigue. Eu faria isso bem devagar, se fosse você.", "O mapa marca o que você descobre. Abra-o quando perder o rumo; a memória de uma trilha é melhor do que correr em círculos."] },
  ],
  lume: [
    { id: "past", label: "Por que você ficou no Farol?", lines: ["Porque alguém chegou tremendo, com uma espada maior que a própria fome. Fiz sopa. Na noite seguinte vieram mais três.", "Não sei consertar o sol. Sei preparar uma mesa para quem está tentando."] },
    { id: "road", label: "O que devo levar para comer?", lines: ["Rações para a estrada. Ensopado para quando o frio começa a entrar nos ossos. Traga grãos e ervas que eu cuido do resto.", "Abra o inventário para escolher o que comer. E não espere a barriga doer: com fome, até uma boa lâmina perde força."] },
  ],
  caio: [
    { id: "past", label: "De onde vem a água da vila?", lines: ["Da chuva guardada nas pedras do Farol. Ela atravessa areia, carvão e um pouco de paciência antes de chegar à sua garrafa.", "Já atravessei um verão com um único cantil. Desde então não entrego água sem antes conferir a tampa."] },
    { id: "road", label: "Água ou chá para a próxima fase?", lines: ["Nas Forjas, água. O calor rouba mais do que parece. Para o Arquivo e a Cúpula, leve chá também: ele ajuda a recuperar o calor.", "Se estiver com sede, pare e beba. Nenhum portão merece seus últimos passos."] },
  ],
  iria: [
    { id: "past", label: "O que você costurava antes?", lines: ["Roupas para festas que duravam até o amanhecer. Hoje costuro para que as pessoas cheguem a outro amanhecer.", "Guardei um tecido azul para quando tudo isso terminar. Ainda não decidi o vestido."] },
    { id: "road", label: "Como me protejo do frio?", lines: ["Fibras e couro fazem um bom manto. Com mais material, posso forrar um casaco. O vento encontra menos espaço para entrar.", "Vista a peça pelo inventário. E se encontrar uma fogueira, aproxime-se: roupa segura calor, mas não o cria sozinha."] },
  ],
};
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
              "Atravesse o portão. E, se a escuridão vencer, encontre o caminho de volta.",
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
