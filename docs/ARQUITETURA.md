# Arquitetura

## Ciclo de execução

`main.ts` instancia App, SaveStore, AudioDirector, UI e Phaser. Preload carrega atlas locais; World mantém hub e câmara atual. A UI DOM apresenta menus e HUD, encaminhando ações para App. O jogo usa coordenadas lógicas com colisão própria e projeção matemática 2.5D; o mouse passa pela câmera e pela projeção inversa antes de orientar um ataque.

Comandos discretos são capturados em eventos de tecla e consumidos pela simulação no próximo frame. A fila preserva uma ação mesmo quando keydown e keyup ocorrem antes da atualização, e descarta comandos restantes a cada frame.

O estado de tela suspende simulação, teclado e relógio de eventos nos modais. Ao voltar, as teclas são reiniciadas para evitar movimento preso. A aba perde foco e pausa automaticamente durante expedições. Animações decorativas continuam leves nos menus.

## Módulos

| Arquivo | Responsabilidade |
| --- | --- |
| `types.ts` | Contratos de dados persistentes e de conteúdo |
| `game/config.ts` | Conteúdo regional, armas, inimigos e balanceamento |
| `game/procedural.ts` | PRNG, grafo, layout, validação, projeção e A* |
| `game/village.ts` | Planta própria da vila, casas, ruas, praça e identificação de interiores |
| `game/gates.ts` | Esconderijo determinístico, coleta da chave e requisitos dos portões |
| `game/exploration.ts` | Cinco áreas conectadas, marcos, segredo opcional, terreno explorado e caminho no mapa |
| `game/loot.ts` | Concessão de recursos, recipientes saqueados, total da fase, recursos em risco e perda parcial |
| `game/combat.ts` | Vida, invulnerabilidade, cooldown, timeline e hitbox |
| `game/combos.ts` | Seis movimentos por arma e buffer de um clique com expiração |
| `game/animation.ts` / `data/animations.json` | Contagens compartilhadas e quadros cíclicos ou finitos |
| `game/objectives.ts` | Registro e transições de estados dos objetivos |
| `game/visual.ts` | Seleção de quadros independente do gameplay e pool de partículas |
| `game/presentation.ts` | Escala relativa, apoio dos pés e oclusão com transição independente de FPS |
| `game/world.ts` | Integração de entidades, IA, encontros, perigos, renderização e interações |
| `game/shaders.ts` | PostFX WebGL original, seguro no fallback Canvas |
| `game/audio.ts` | Síntese sonora, sequência ambiente e gains independentes |
| `game/voices.ts` | Reprodução de falas incluídas, síntese local de reserva, cancelamento e perfis por morador |
| `game/save.ts` | Validação, versionamento, seis campanhas e fechamento de run |
| `game/checkpoint.ts` | Contrato e validação do estado retomável de câmara |
| `game/environment.ts` | Planejamento de ambientação cosmética por bioma, preservando segredos e saída |
| `game/landscape-renderer.ts` | Solo contínuo em TileSprite e decoração de margens |
| `data/skills.ts` | Grafo de 18 habilidades, custos, requisitos, efeitos e restituição |
| `game/crafting.ts` | Receitas atômicas, níveis de armas, infusões e saque permanente |
| `game/survival.ts` | Necessidades, clima, isolamento, provisões, receitas e ingredientes |
| `data/npcs.ts` | Seis moradores, funções, posições e estações de trabalho |
| `progression.css` | Árvore ramificada, recursos e controles da oficina |
| `data/boons.ts` | 24 definições de melhorias e agregação de atributos |
| `data/narrative.ts` | Memórias e diálogos condicionais |
| `ui.ts` | Menus funcionais e HUD em português |

## Determinismo e navegação

Seed + versão de conteúdo geram o grafo. Cada nó recebe uma seed própria. O layout divide regiões por BSP, reserva a galeria principal, conecta alas e protege entrada/saída/objetivos. Regras locais selecionam tiles de borda e variações de material. Flood fill valida alvos acessíveis; uma sala inválida é refeita até oito vezes, com fallback conectado. A* utiliza a mesma grade da colisão.

O Farol usa `generateVillage`, uma grade própria de 35×33 com seis lotes, ruas e praça. As paredes traseiras das casas bloqueiam movimento; as entradas permitem alcançar todos os moradores. O mapa da vila oferece trajetos físicos até as casas e o portão leste. O telhado de cada casa reduz a opacidade junto da entrada e durante a conversa.

Fases usam `generateStage`, com plantas e regras próprias; fases normais têm cinco áreas e quatro ligações em uma grade base de 41×33. `placeTerminalGate` estende a última área até uma saída sem conteúdo além do portão, expandindo a grade quando necessário. A passagem secreta é opcional: suas células iniciam bloqueadas e não aparecem no mapa; investigar a parede altera a grade, renderiza o piso e revela seu baú. A câmera segue Eira. O mapa SVG usa a mesma grade, posição e A* do jogo.

Os encontros têm sorteio por seed. A simulação não é um replay determinístico: movimento, críticos e VFX dependem da ação/tempo, e os VFX usam aleatoriedade visual. A garantia de reprodução cobre grafo, layout, objetivos e distribuição inicial de estruturas/encontros.

## Combate e animação

`AttackTimeline` é a fonte de tempo do golpe. O frame derivado abre a hitbox em `activeStart`, fecha em `activeEnd` e libera cancelamento na recuperação. O controlador visual recebe o mesmo frame, sincronizando desenho e dano. Um Set por ataque impede dano repetido no mesmo alvo. A timeline lida com cruzamento de frames em intervalos maiores.

Vida física é independente do retângulo visual. A colisão avança em subpassos de até oito unidades para impedir atravessamento de obstáculos durante dash. A esquiva usa invulnerabilidade distinta do cooldown. Os seis ataques por arma têm poses, potência, alcance e quadros próprios; o buffer aceita um clique antecipado e encadeia na recuperação. Projéteis e partículas reutilizam pools limitados. IA usa antecipação, ataque e recuperação com dano na fase ativa da animação; dano interrompe inimigos comuns por stagger. Chefes usam ciclos aprendíveis, animações por padrão e fases por percentual de vida.

## Arte e performance

O script Node desenha pixels nativos com os módulos `scripts/art/pixel-*.mjs`; sharp amplia com vizinho mais próximo e exporta PNG RGBA8888. Fontes nativas PNG e metadados ficam em `public/assets/sources`. Atlas JSON hash possui frames por `ação/direção/frame`, com dimensões e pivôs consistentes. O manifesto lista origem, dimensões e ações. Equipamentos usam variações completas de Eira, com 1.280 quadros cada. O contrato compartilhado de animações impede divergências entre exportação e gameplay. Cada arena compõe piso, fundo, ornamentos, props animados por profundidade, atores, projéteis, partículas e foreground com redução de opacidade. Texturas usam nearest e posições arredondadas; a UI usa molduras de nove partes e texto de sistema legível.

O shader de câmera limita-se a composição barata. Não há dependência de WebGL para as regras: Canvas funciona sem PostFX e sem blend avançado equivalente. Em qualidade baixa, o pool e a névoa diminuem. Este projeto ainda precisa de batching do piso, streaming dos atlas e medição de GPU em máquinas-alvo para assumir 60 FPS.

Humanoides usam escala 0,95 (antes 1,4) e chefes 1,15 (antes 1,65); o cenário mantém suas dimensões. A profundidade segue o ponto de apoio dos pés, com desempate mínimo entre ator e prop. Sombras ficam na camada do chão, projéteis seguem a profundidade da sua trajetória, nomes e barras acompanham a altura dos atores. Colunas e grandes props reduzem opacidade ao encobrir um ator; a interpolação exponencial tem duração estável em diferentes taxas de frames. Margens rasas de 3 px (7 px no Arquivo) substituem as fundações altas que criavam aparência de plataforma flutuante.

`planEnvironment` calcula distância até piso e células secretas sem alterar a geometria. A decoração é cosmética e mantém livre a visão do portão. `paintLandscape` compõe uma textura opaca 1024×512 por tema, reutilizada em TileSprite; o retângulo acompanha o worldView e cobre zoom, câmera e redimensionamento. O cache tem no máximo cinco texturas de fundo, sem criar uma tela gigante do tamanho do mapa.

## Persistência

Chave: `vespera.save.v2`. Campos validados e números limitados. A extensão de progressão adiciona `skills`, `materials`, `weaponLevels`, `infusions` e `equipped` com migração por valores padrão. Os três talentos anteriores são as raízes da árvore; habilidades desconhecidas ou sem requisitos são removidas na leitura. Níveis de armas são limitados a três, e armas não possuídas não recebem níveis ou infusões. Memórias, chefes, finais, habilidades e equipamento persistente sobrevivem à morte. Fechar run remove apenas seu estado temporário e registra o resultado. Não são guardados identificadores externos ou telemetria.

`vespera.campaigns.v1` armazena até seis campanhas com ID, nome, datas e cópia validada do Save. A chave v2 continua como espelho da ativa e permite migração do save anterior. Criar campanha preserva configurações e zera a progressão; trocar salva a anterior antes de carregar outra cópia. Importar cria um espaço separado e exportar gera JSON local. `campaignActive` impede que o Farol decorativo do menu sobrescreva o local de uma expedição ainda não carregada.

`Run.checkpoint` contém posição, estado dos inimigos, objetivos, marcos, ondas, chegadas, escolta e recompensa pendente. `World.restoreCheckpoint` recria o estado validado e conserva os identificadores de saque. Ataques e projéteis transitórios são descartados; inimigos retornam em recuperação e Eira recebe 0,6 s de proteção. Morte e vitória removem a Run ativa do controlador e do Save; sair durante a animação de morte conclui a perda antes de gravar.

`World.stats()` agrega habilidades permanentes, arma aprimorada, infusão e Juramentos. Movimento, dano, crítico corpo a corpo e de projéteis, carregado, especial, recargas, armadura, cura e energia consultam essa mesma agregação. Compras validam todos os requisitos antes de alterar os saldos; o controlador só permite alterações no Farol. O saque registra a câmara em `visited` na mesma transação em que concede materiais, impedindo recebimento duplicado ao continuar o save.

Serviços também exigem `activeNpc` e proximidade real do morador. A conversa cria esse contexto; fechar, mudar de câmara ou voltar ao menu o invalida. Cada receita de sobrevivência declara seu responsável, impedindo preparar roupas na cozinha ou comprar habilidades com Orren. O antigo menu lateral foi retirado.

Necessidades ficam em `Run.needs` durante a expedição e em `Save.needs` no Farol. A simulação só chama `tickNeeds` durante jogo ativo. Consequências alteram dano de arma, caminhada e duração dos ataques; extremos geram dano ambiental que preserva a imunidade de combate. Estado, estoque, matérias-primas e guarda-roupa são validados na migração do save v2 e gravados em checkpoints ativos de cinco segundos. Pausa e diálogo não simulam passagem do tempo.

`App.returnToHub()` exige câmara concluída, personagem vivo e recompensa resolvida. Faz checkpoint antes de entrar no Farol, mantendo `Save.run`; não chama `finishRun`. A continuação pelo portão reutiliza `visited` para restaurar a câmara sem inimigos ou novos materiais. O estado transitório `World.rewardPending` evita que o botão de retorno interrompa uma escolha de Juramento pendente. A decisão do último chefe também oferece retorno antes de encerrar a campanha.

`UI.inventory()` reúne provisões, oito materiais, moedas, vestimentas e equipamento em quatro abas, acessíveis no Farol e na expedição. O estado `inventory` pausa a simulação e permite consumir itens e vestir roupas possuídas; as operações persistem sem refazer receitas. `App.wear()` aceita esse contexto para troca de roupas, validando posse e personagem vivo. Criar itens, aprimorar armas e aprender técnicas continuam exigindo o NPC correspondente; equipar armas possuídas também funciona na aba Equipamento. O atalho I ignora campos de texto, repetição de tecla e combinações de navegador.

`Run.phase` registra a câmara, totais coletados, recursos em risco, recipientes/inimigos recompensados, marcos sintonizados, células exploradas e segredo aberto. `grantLoot` concede e registra na mesma operação; um identificador já reclamado não concede novamente. Cada concessão faz checkpoint e atualiza o aviso superior por 2,7 segundos. O retorno ao Farol zera o risco, e avançar inicia outro registro de fase. A morte desconta 30% do risco por tipo, limitado ao saldo, e grava `lastLoss` e `recovering` para o refúgio junto de Sálvia.

## Arsenal e desafios regionais

`weapons.ts` define 13 perfis e valida os espaços melee/ranged de Save e Run; `mastery.ts` define sete técnicas por arma, limiares de XP e assinaturas específicas. Armas adicionais usam carregamento de atlas sob demanda. `Shot.weapon` conserva a origem do disparo, e o último acerto atribui XP uma única vez por identificador de inimigo na fase. Incêndio e lentidão guardam seus próprios valores, evitando alterações ao trocar a arma.

A interação com baús usa estado temporal próprio, aproximação, pose interact e oito quadros da tampa. O saque é concedido após 0,93s; cancelamento por esquiva ou dano respeita o mesmo registro atômico de coleta.

Cada fase inclui `keyHiding`, escolhido entre recipientes alcançáveis sem abrir o segredo opcional. `Run.phase` guarda `keyRevealed`, `keyFound` e `gateOpened`; o mapa apresenta uma pista regional antes da descoberta e o ponto exato depois. Quebrar ou investigar o recipiente revela a chave, e E a recolhe. O portão exige chave, câmara concluída e recompensa resolvida. Sua abertura usa oito quadros durante 1,05s e só então permite `App.nextRoom` ou o final. A próxima fase reinicia os estados. Migração mantém liberadas câmaras concluídas por saves anteriores ao sistema de chaves.

`gateCollides` testa a caixa orientada da porta no chão isométrico, mantendo os pilares sólidos mesmo com as folhas abertas. `World.canMoveTo` combina piso e portão; movimento, esquiva e impulsos usam esse teste em subpassos. Projéteis também verificam subpassos para impedir atravessamento em alta velocidade. O HUD agrupa habilidades e armas em duas linhas no rodapé, com as armas na linha inferior.

`generateStage` recebe bioma e índice da câmara. `stage-design.ts` fornece nove planos e regras por região: percurso, labirinto ordenado, ilhas, bastião guardado, pares, descanso, arena, tesouros e pulsos. A máscara de piso difere em cada uma das 36 câmaras. Flores destruídas registram `hazard:<id>` e marcos fecham válvulas. Maré afeta movimento e frio; eclipse usa área em cruz. Guardas nascem com a sala e permanecem ociosos quando distantes. `arrivals` guarda chegadas com aviso, portal e prazo; entradas pendentes impedem a conclusão prematura.

## Diálogos e áudio de voz

`CONVERSATIONS` adiciona dois temas e quatro linhas por morador. A apresentação consulta mortes e progresso; todos os temas continuam vinculados ao contexto de proximidade do NPC. `VoiceDirector` recebe o catálogo JSON no Preload e faz correspondência exata entre morador e texto. WAVs são carregados sob demanda por HTMLAudioElement; falas variáveis e falhas usam apenas vozes locais em português do SpeechSynthesis, se disponíveis. Um token de reprodução impede callbacks tardios após cancelar ou mudar de assunto. Fechar diálogo, ocultar página ou trocar campanha interrompe áudio e síntese. `AudioDirector.setSpeaking` reduz música para 28% durante a fala.

`scripts/generate-voices.mjs` usa SAPI/OneCore no Windows para exportar PCM mono 22.050 Hz/16 bits. O catálogo guarda texto, arquivo e perfil, sem dados pessoais ou chamadas externas. Os seis perfis derivam de duas bases de síntese, Maria e Daniel, com ritmo e pitch distintos. O jogo distribuído reproduz os arquivos sem exigir essas vozes instaladas.
