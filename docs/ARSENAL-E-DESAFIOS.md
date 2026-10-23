# Arsenal, baús e desafios por região

## Duas armas equipadas

Eira leva uma arma de corpo a corpo e uma de distância. **F** alterna entre elas; o HUD destaca a arma em uso. O inventário (**I → Equipamento**) permite escolher armas já possuídas para cada espaço. Forjar, aprimorar, infundir e aprender técnicas continuam exigindo conversa presencial com **Orren**.

Fioferro e Arco do Ocaso são o equipamento inicial. Saves antigos recebem o arco sem perder o progresso. A expedição salva guarda seu próprio par de armas. Trocar arma não restaura a recarga do especial e só cancela um ataque na janela de recuperação. Projéteis conservam a identificação da arma que os disparou, inclusive para creditar experiência depois da troca.

| Arma | Tipo | Identidade de combate |
| --- | --- | --- |
| Fioferro | Lâmina | Cortes equilibrados, estocada e giro |
| Âncora Solar | Martelo | Impactos pesados e atordoamento prolongado |
| Arco do Ocaso | Arco | Flechas gêmeas, leque e perfuração |
| Dentes da Névoa | Adagas | Alta cadência, curto alcance e críticos |
| Agulha da Aurora | Lança | Alcance longo e estocadas estreitas |
| Sol Partido | Montante | Dano alto e varreduras lentas |
| Lenhadora de Horas | Machado | Execução de inimigos feridos |
| Lua Ceifada | Foice | Varreduras amplas e cura por abate |
| Pêndulo Real | Florete | Precisão, velocidade e críticos |
| Voto de Ferro | Besta | Virotes rápidos com perfuração |
| Maré de Âmbar | Cajado | Três orbes em leque e lentidão |
| Última Faísca | Pistola | Disparo veloz e alta cadência |
| Órbita Esquecida | Chakram | Discos de alcance médio com perfuração |

São dez armas novas, treze no total, cada uma com ícone e equipamento próprio no sprite de Eira. As animações reutilizam três famílias de rigs com seis golpes; silhueta, cadência, dano, alcance e efeitos definem as diferenças. Atlas adicionais são carregados quando necessários; texturas de armas fora dos equipamentos em uso são descartadas para conter o uso de memória.

## Experiência e árvores

Um inimigo comum concede **10 + 2 × bioma XP**, elites concedem 20 XP e chefes 70 XP, à arma responsável pelo último acerto. Um identificador salvo impede repetir XP do mesmo inimigo ao recarregar a fase. Caixas e baús não fornecem experiência de arma. A experiência é permanente, não é perdida na morte e não é gasta ao aprender técnicas.

Cada arma possui sete técnicas próprias: uma origem e duas ramificações de três nós. Os requisitos são **30 XP** na origem e **80 / 170 / 320 XP** nas ramificações. Também é necessário aprender o nó anterior e pagar o trabalho de Orren com **2 / 4 / 7 / 10 Ferros**, conforme a profundidade. A interface mostra XP atual, requisito, materiais e bloqueio.

A ramificação Técnica trabalha crítico, cadência e a assinatura da arma; Disciplina trabalha golpes carregados, recarga e especiais. A assinatura tem um efeito específico por arma: a foice ganha cura, o machado aumenta execução, a besta perfura mais alvos, o cajado intensifica a lentidão, entre outros. Os efeitos só se aplicam à arma correspondente.

Os níveis de forja **+1 / +2 / +3** também exigem **60 / 180 / 360 XP** com a arma, além da receita de materiais e Ecos existente. Aprimoramentos antigos são preservados; a migração concede a XP mínima compatível quando o save ainda não continha esse campo.

## Baús

Pressione **E** perto de um baú fechado. Eira se aproxima, orienta o corpo, alcança a fechadura e acompanha a tampa. Oito quadros fazem a abertura, seguida de luz, partículas, som e coleta em cerca de 1,4 segundo. A coleta acontece no momento de revelação do conteúdo, depois de aproximadamente 0,93 segundo.

**Espaço** cancela a interação e permite esquivar. Dano também interrompe. Cancelar antes da coleta não dá recursos e fecha o baú; depois da coleta, o registro permanece aberto. O mesmo identificador de saque evita duplicação ao apertar E várias vezes ou recarregar. A pausa congela a sequência.

## Percursos e desafios

As 36 câmaras possuem identidade e geometria próprias. Cada região combina nove propostas de percurso com sua arquitetura e perigo regional. Fases normais mantêm quatro marcos, cinco áreas e a passagem secreta opcional; arenas têm formatos próprios. O mapa usa a mesma grade da colisão e mostra perigos e entradas de reforços.

| Câmara | Percurso e regra |
| --- | --- |
| 1 · Travessia | Cinco áreas ligadas por alamedas e guardas posicionados desde a entrada. |
| 2 · Labirinto | Salas menores, becos e desvios. Marcos na ordem 1 → 2 → 3 → 4. |
| 3 · Ilhas | Pontes de uma célula ligam ilhas compactas. Recolher cinco memórias. |
| 4 · Bastião | Salas amplas com entradas estreitas. Guardas próximos impedem ativar os marcos. |
| 5 · Encruzilhada | Rota longa e atalho entre alas. Ativar os pares 1 → 3 → 2 → 4. |
| 6 · Claustro | Quatro alas em torno de um núcleo. Marcos recuperam vida e calor; sem perigo cíclico. |
| 7 · Arena | Quatro formatos de arena para os quatro chefes. |
| Desvio · Tesouro | Galerias com becos e exploração. Abrir pelo menos dois baús antes da saída. |
| Desvio · Juramento | Pontes em zigue-zague e pulsos mais rápidos. Marcos só aceitam canalização no intervalo seguro. |

Portais de avanço usam o próximo nó da campanha e constroem o desenho correspondente; a geometria não é reutilizada apenas com outra cor. O mapa mostra a planta e a regra da câmara atual. Voltar ao Farol e continuar preserva o ponto salvo, como antes.

| Região | Construção | Desafio e resposta |
| --- | --- | --- |
| Jardins | Clareiras arredondadas e alamedas diagonais | Raízes pulsantes ferem e reduzem a velocidade. Destruir a flor correspondente limpa o trecho permanentemente. |
| Forjas | Galerias retangulares e corredores em cotovelo | Válvulas antecipam descargas de calor. Cada marco fecha sua válvula; aguardar a descarga é outra opção. |
| Arquivo | Salas largas, galerias e retorno pela parte inferior | A maré fria reduz o passo a 55% e aumenta o frio. Cruze na vazante, use ilhas secas e roupas isolantes. |
| Cúpula | Plataformas angulares e pontes em circuito | Raios em cruz alternam pelas pontes. Leia a antecipação, atravesse no intervalo ou use a esquiva. |

Os perigos avisam antes de ativar e cessam quando a fase é restaurada. Arenas dos chefes conservam seus padrões próprios. Balanceamento prolongado de toda a campanha permanece como trabalho de playtest.

## Inimigos e reforços

Os guardas dos trechos são criados junto com a fase, em posições determinísticas. Guardas distantes ficam em repouso e despertam com a aproximação; atravessar um marco não cria outro grupo instantâneo.

Reforços de defesa, fendas, invocadores e chefes chegam por entradas definidas no cenário. Um portal de pedra, luz e contagem de dois segundos antecipam a chegada; o inimigo ainda tem uma breve recuperação antes de agir. A entrada escolhida fica a pelo menos 155 unidades de Eira quando o aviso começa. Reforços pendentes contam para a conclusão, impedindo abrir a saída no intervalo antes da chegada.

## Arquivos

- `src/game/weapons.ts`: catálogo, tipos, equipamento e validação dos dois espaços.
- `src/game/mastery.ts`: árvores, requisitos, assinaturas e experiência.
- `src/game/stage-design.ts`: nove propostas de fase, regras e planos.
- `src/game/exploration.ts`: plantas e distribuição de desafios.
- `src/game/world.ts`: troca, combate, baús, perigos, guardas e chegadas sinalizadas.
- `scripts/art/pixel-actors.mjs`, `pixel-ui.mjs`, `pixel-world.mjs`: arte nativa.
- `tests/arsenal.test.ts`, `tests/e2e/arsenal.spec.ts`: regras e integração.
