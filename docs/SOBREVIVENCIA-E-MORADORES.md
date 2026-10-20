# Sobrevivência e moradores do Farol

## Conversar para trabalhar

O painel de atalhos do Farol foi retirado. Caminhe até um morador e pressione **E**; durante a conversa, escolha o serviço. O jogo verifica a conversa ativa e a proximidade novamente antes de cada compra. Estar apenas no Farol não permite acessar uma função à distância.

| Morador | Serviço |
| --- | --- |
| Sálvia | Árvore de habilidades e redistribuição de Ecos |
| Orren | Forja, aprimoramentos, infusões e equipamento de armas |
| Nim | Memórias e registros da campanha |
| Lume | Rações e ensopados |
| Caio | Água potável e chá |
| Íria | Confecção e troca de vestimentas |

Os seis possuem sprites e retratos originais em pixel art. Lume tem uma cozinha, Caio uma cisterna e Íria um tear. Os caminhos do Farol reservam acesso aos seis moradores. Para iniciar a expedição, aproxime-se do portal e pressione **E**.

## Retornar entre câmaras

Ao concluir uma câmara e resolver sua recompensa, aparece **Voltar ao Farol**. A opção também está na pausa de uma câmara restaurada. O retorno preserva a câmara atual, vida, carga, óbolos, Juramentos e recursos; não conta como morte e não encerra a expedição. No Farol, converse com os moradores para se abastecer. Depois, use **E** no portal e escolha **Continuar expedição salva**.

A câmara restaurada permanece concluída, sem inimigos nem novo saque. Atravesse seu portal para seguir à próxima câmara ou escolher um desvio. Chefes também permitem retornar; depois do último, é possível voltar ao Farol antes de escolher o desfecho e retomar a decisão pelo portal. Partir em uma nova expedição substitui a anterior, conforme o aviso da tela.

## Necessidades

Fome, sede e frio vão de **0 a 100**. Quanto menor a barra, melhor. O tempo só avança durante o jogo ativo: menus, pausa, diálogos e o jogo fechado não consomem necessidades.

| Necessidade | Consequência |
| --- | --- |
| Fome ≥60 / ≥85 | Dano de arma reduzido em 12% / 25% |
| Sede ≥60 / ≥85 | Velocidade de caminhada reduzida em 10% / 20% |
| Frio ≥70 | Mais 12% de redução na caminhada |
| Frio ≥90 | Cadência de ataque reduzida em 15% |
| Alguma necessidade em 100 | Perda de vida em pulsos de cinco segundos |

A fome aumenta 0,09 por segundo ativo. A sede aumenta 0,14, ou 0,19 nas Forjas. Sem proteção, o frio aumenta 0,035 nos Jardins, 0,13 no Arquivo e 0,21 na Cúpula; as Forjas reduzem o frio. Vestimentas reduzem o acúmulo, enquanto tochas e forjas próximas aquecem. O Farol aquece Eira sem aumentar fome ou sede.

O dano extremo de sobrevivência atravessa a imunidade de combate sem consumir sua duração. A morte segue o ciclo normal de retorno; o Farol estabiliza fome e sede em no máximo 40 e remove o frio. Mantimentos, matérias-primas e vestimentas permanecem guardados.

## Preparar e consumir

Use **R** para comer uma ração (ou ensopado se não houver ração) e **T** para beber água (ou chá se não houver água). Abra o **Inventário** com **I**, pelo botão no HUD ou na pausa. A aba **Comidas e bebidas** permite escolher exatamente o que consumir e mostra estoque, efeitos e necessidades atuais. Itens não são gastos quando todas as necessidades que restauram estão abaixo de 5.

O inventário funciona no Farol e durante a expedição. A aba **Recursos** lista os cinco ingredientes de sobrevivência e os três materiais da forja, suas quantidades e origens, mesmo quando o saldo é zero. **Vestimentas** permite equipar as roupas já possuídas, e **Equipamento** reúne armas, aprimoramentos, infusões e Juramentos da expedição atual ou salva. Ecos, óbolos e roupa em uso aparecem acima das abas. O inventário pausa a simulação; use **I**, **Esc** ou **×** para fechar. As receitas continuam restritas aos moradores do Farol.

| Item | Quem prepara | Ingredientes | Efeito |
| --- | --- | --- | --- |
| Ração de viagem | Lume | 2 Grãos, 1 Erva | Fome −40 |
| Ensopado do Farol | Lume | 3 Grãos, 2 Ervas, 1 Água bruta | Fome −65, sede −15, frio −15 |
| Água potável | Caio | 2 Águas brutas | Sede −45 |
| Chá de brasa | Caio | 2 Águas brutas, 2 Ervas | Sede −30, frio −35 |
| Manto de fibras | Íria | 6 Fibras, 1 Couro | 45% menos acúmulo de frio |
| Casaco forrado | Íria | 12 Fibras, 4 Couros; requer manto confeccionado | 75% menos acúmulo de frio |

Vestimentas são confeccionadas uma única vez e equipadas ao criar. Podem ser trocadas na aba **Vestimentas** do inventário ou ao conversar com Íria. O traje de viagem também pode ser escolhido. O isolamento não se acumula entre roupas. A roupa equipada aparece no inventário; Eira continua usando o atlas de personagem da arma, sem um atlas cosmético separado para cada vestimenta.

## Recursos e salvamento

O kit inicial oferece 2 rações, 2 águas, 6 Grãos, 4 Ervas, 8 Águas brutas, 8 Fibras e 2 Couros. Saves antigos recebem esses campos por migração, preservando progresso, habilidades e armas.

Restaurar uma câmara concede ingredientes automaticamente, junto dos materiais da forja. Jardins concedem mais Grãos, Arquivos mais Ervas e Forjas menos Água bruta. Toda câmara concede Fibras; elites, desafios e chefes concedem mais Couro. O registro de câmaras restauradas impede saques repetidos ao continuar o save.

Necessidades são preservadas entre câmaras, consumos e continuação, com checkpoint automático a cada cinco segundos ativos. Uma câmara não concluída ainda reinicia seus encontros ao recarregar, conforme o sistema existente.

Regras em `src/game/survival.ts`; moradores em `src/data/npcs.ts`; integração em `world.ts`, `main.ts`, `ui.ts` e `survival.css`. A economia e os ritmos iniciais foram verificados funcionalmente, sem alegar playtest prolongado de dificuldade.
