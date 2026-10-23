# Exploração, mapa e risco da fase

As câmaras normais passam a ser fases com cinco áreas ligadas por corredores, em uma grade de 41 × 33 tiles. Posições e dimensões variam de forma determinística pela semente. O percurso principal passa por quatro marcos de travessia; segure **E** perto de cada um para sintonizá-lo. Guardiões despertam nos trechos do caminho. Os quatro chefes preservam suas arenas dedicadas.

Além dos marcos, complete o objetivo da fase e derrote os inimigos para liberar a saída. Purificação, correntes, coleta, fendas e runas usam cinco pontos distribuídos pelo percurso. A escolta percorre o caminho real até o portal. A defesa dura 55 segundos perto do núcleo. O mapa e o quadro de objetivo indicam o que falta. Os portais de entrada e saída têm arcos de blocos de pedra, inclusive durante sua animação.

## Mapa da fase

**Tab** abre o desenho dos corredores e áreas da fase atual. O ponto claro mostra a posição real de Eira. Uma linha tracejada indica o caminho até o próximo marco, objetivo ou portal. O mapa distingue terreno visitado e não visitado e marca objetivos, marcos, baús, entrada e saída. A rota da região continua disponível como visualização secundária.

A passagem secreta não é desenhada no mapa antes de ser descoberta. Investigue com **E** a parede rachada, ou quebre-a com um golpe próximo, para revelar o corredor e sua câmara de tesouro. Revelar o segredo não é obrigatório para concluir o percurso principal.

## Baús e objetos

Cada fase normal possui cinco baús no percurso e um na câmara secreta. Aproxime-se e pressione **E** para abrir. Caixas, barris e urnas quebram com ataques, incluindo flechas; a parede também pode ser investigada sem depender de uma arma específica. As flores preservam sua explosão contra inimigos.

| Fonte | Recursos |
| --- | --- |
| Baú comum | 8 óbolos, 2 ferros, 2 grãos, 2 águas brutas, 2 fibras |
| Baú secreto | 5 Ecos, 4 vidros, 2 brasas, 2 couros, 1 ensopado |
| Caixa | 1 ferro, 2 grãos, 2 fibras |
| Barril | 2 águas brutas, 1 erva, 2 óbolos |
| Urna | 1 água bruta, 3 óbolos |
| Flor | 1 erva e explosão |

Inimigos, chefes, eventos e recompensas da fase também passam pelo registro de coleta. O canto superior direito mostra **+quantidade** e **Total na fase** para cada recurso adquirido. Cada linha desaparece após **2,7 segundos**; coletar novamente o mesmo tipo atualiza seu total e renova o prazo. O inventário mostra o estoque completo, enquanto o aviso mostra o total obtido apenas nesta fase.

Baús, props já saqueados, marcos, passagem revelada e totais são salvos. Recarregar não permite receber outra vez o saque do mesmo recipiente. O checkpoint também conserva posição, vida dos inimigos, objetivos, reforços e recompensa pendente; o encontro continua sem recriar os guardas. Golpes e projéteis transitórios voltam a um estado seguro. Guia de campanhas e backups em CAMPANHAS-E-VOZES.md.

## Morte e Refúgio da Centelha

Ao morrer, perde-se **30% dos recursos novos ainda em risco da fase atual**, por tipo e com arredondamento para cima. A perda é limitada ao estoque disponível. Itens iniciais e recursos de fases anteriores não entram no registro em risco. Recursos consumidos deixam de estar em risco; o total histórico coletado continua no aviso.

Concluir o percurso e avançar para outra fase guarda os recursos anteriores. Usar **Voltar ao Farol** também guarda o saque e preserva a expedição. Armas, roupas confeccionadas, habilidades e memórias continuam permanentes. Óbolos e Juramentos seguem o ciclo temporário da expedição; a recompensa normal de Ecos pelo retorno é apresentada separadamente da perda.

A tela de morte lista exatamente o que foi perdido. Ao ressurgir, Eira aparece no **Refúgio da Centelha**, a área do Farol junto do altar e de Sálvia. Pressione **E** para conversar e investir em habilidades antes de partir novamente. O retorno continua sujeito às regras de proximidade dos NPCs.

## Implementação e limites

`game/exploration.ts` gera o percurso, a área secreta e o registro de terreno explorado. `game/loot.ts` centraliza concessão, identificação de recipientes, totais, recursos em risco e perdas. O save v2 migra os campos novos sem apagar campanhas antigas.

As fases usam uma estrutura de cinco áreas conectadas com variações de semente; não são mapas desenhados individualmente. A área de upgrades integra o Farol e seus NPCs existentes. Não há plataformas laterais ou movimentação de Dead Cells: a referência foi aplicada ao ciclo de risco, morte e upgrades do próprio Véspera.
