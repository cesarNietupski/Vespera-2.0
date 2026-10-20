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
| `game/combat.ts` | Vida, invulnerabilidade, cooldown, timeline e hitbox |
| `game/combos.ts` | Seis movimentos por arma e buffer de um clique com expiração |
| `game/animation.ts` / `data/animations.json` | Contagens compartilhadas e quadros cíclicos ou finitos |
| `game/objectives.ts` | Registro e transições de estados dos objetivos |
| `game/visual.ts` | Seleção de quadros independente do gameplay e pool de partículas |
| `game/presentation.ts` | Escala relativa, apoio dos pés e oclusão com transição independente de FPS |
| `game/world.ts` | Integração de entidades, IA, encontros, perigos, renderização e interações |
| `game/shaders.ts` | PostFX WebGL original, seguro no fallback Canvas |
| `game/audio.ts` | Síntese sonora, sequência ambiente e gains independentes |
| `game/save.ts` | Validação, versionamento, checkpoint e fechamento de run |
| `data/skills.ts` | Grafo de 18 habilidades, custos, requisitos, efeitos e restituição |
| `game/crafting.ts` | Receitas atômicas, níveis de armas, infusões e saque permanente |
| `progression.css` | Árvore ramificada, recursos e controles da oficina |
| `data/boons.ts` | 24 definições de melhorias e agregação de atributos |
| `data/narrative.ts` | Memórias e diálogos condicionais |
| `ui.ts` | Menus funcionais e HUD em português |

## Determinismo e navegação

Seed + versão de conteúdo geram o grafo. Cada nó recebe uma seed própria. O layout divide regiões por BSP, reserva a galeria principal, conecta alas e protege entrada/saída/objetivos. Regras locais selecionam tiles de borda e variações de material. Flood fill valida alvos acessíveis; uma sala inválida é refeita até oito vezes, com fallback conectado. A* utiliza a mesma grade da colisão.

Os encontros têm sorteio por seed. A simulação não é um replay determinístico: movimento, críticos e VFX dependem da ação/tempo, e os VFX usam aleatoriedade visual. A garantia de reprodução cobre grafo, layout, objetivos e distribuição inicial de estruturas/encontros.

## Combate e animação

`AttackTimeline` é a fonte de tempo do golpe. O frame derivado abre a hitbox em `activeStart`, fecha em `activeEnd` e libera cancelamento na recuperação. O controlador visual recebe o mesmo frame, sincronizando desenho e dano. Um Set por ataque impede dano repetido no mesmo alvo. A timeline lida com cruzamento de frames em intervalos maiores.

Vida física é independente do retângulo visual. A colisão avança em subpassos de até oito unidades para impedir atravessamento de obstáculos durante dash. A esquiva usa invulnerabilidade distinta do cooldown. Os seis ataques por arma têm poses, potência, alcance e quadros próprios; o buffer aceita um clique antecipado e encadeia na recuperação. Projéteis e partículas reutilizam pools limitados. IA usa antecipação, ataque e recuperação com dano na fase ativa da animação; dano interrompe inimigos comuns por stagger. Chefes usam ciclos aprendíveis, animações por padrão e fases por percentual de vida.

## Arte e performance

O script Node desenha pixels nativos com os módulos `scripts/art/pixel-*.mjs`; sharp amplia com vizinho mais próximo e exporta PNG RGBA8888. Fontes nativas PNG e metadados ficam em `public/assets/sources`. Atlas JSON hash possui frames por `ação/direção/frame`, com dimensões e pivôs consistentes. O manifesto lista origem, dimensões e ações. Equipamentos usam variações completas de Eira, com 1.280 quadros cada. O contrato compartilhado de animações impede divergências entre exportação e gameplay. Cada arena compõe piso, fundo, ornamentos, props animados por profundidade, atores, projéteis, partículas e foreground com redução de opacidade. Texturas usam nearest e posições arredondadas; a UI usa molduras de nove partes e texto de sistema legível.

O shader de câmera limita-se a composição barata. Não há dependência de WebGL para as regras: Canvas funciona sem PostFX e sem blend avançado equivalente. Em qualidade baixa, o pool e a névoa diminuem. Este projeto ainda precisa de batching do piso, streaming dos atlas e medição de GPU em máquinas-alvo para assumir 60 FPS.

Humanoides usam escala 0,95 (antes 1,4) e chefes 1,15 (antes 1,65); o cenário mantém suas dimensões. A profundidade segue o ponto de apoio dos pés, com desempate mínimo entre ator e prop. Sombras ficam na camada do chão, projéteis seguem a profundidade da sua trajetória, nomes e barras acompanham a altura dos atores. Colunas e grandes props reduzem opacidade ao encobrir um ator; a interpolação exponencial tem duração estável em diferentes taxas de frames. As faces da fundação são desenhadas apenas nas bordas expostas da grade, preservando o contorno irregular da sala.

## Persistência

Chave: `vespera.save.v2`. Campos validados e números limitados. A extensão de progressão adiciona `skills`, `materials`, `weaponLevels`, `infusions` e `equipped` com migração por valores padrão. Os três talentos anteriores são as raízes da árvore; habilidades desconhecidas ou sem requisitos são removidas na leitura. Níveis de armas são limitados a três, e armas não possuídas não recebem níveis ou infusões. Memórias, chefes, finais, habilidades e equipamento persistente sobrevivem à morte. Fechar run remove apenas seu estado temporário e registra o resultado. Não são guardados identificadores externos ou telemetria.

`World.stats()` agrega habilidades permanentes, arma aprimorada, infusão e Juramentos. Movimento, dano, crítico corpo a corpo e de projéteis, carregado, especial, recargas, armadura, cura e energia consultam essa mesma agregação. Compras validam todos os requisitos antes de alterar os saldos; o controlador só permite alterações no Farol. O saque registra a câmara em `visited` na mesma transação em que concede materiais, impedindo recebimento duplicado ao continuar o save.
