# VÉSPERA — As Engrenagens da Última Aurora

Action roguelite original para navegador, em português brasileiro. Eira atravessa quatro regiões para recuperar os fragmentos de uma máquina que transformava memórias em luz. Campanha compacta e jogável, com combate, objetivos, progressão e dois desfechos.

Identidade renovada em pixel art da era 32 bits: menu medieval, madeira, bronze, pergaminho e textos limpos e legíveis. Sprites, tiles, retratos e interface originais em PNG RGBA8888. As três armas têm seis ataques com o botão esquerdo e entrada antecipada de combo. Consulte [a direção visual e de animação](docs/IDENTIDADE-32BITS.md).

## Executar no Windows

Requer Node.js 22.12+ (validado com Node 24). Abra o terminal nesta pasta:

```bash
npm install
npm run assets:generate
npm run dev
```

Abra **http://127.0.0.1:5173/** no Chrome ou Edge. Os assets produzidos já estão incluídos em `public/assets`; regenerar só é necessário depois de alterar o gerador. A exportação pode demorar alguns minutos. Não há dependências de serviços, fontes remotas, chaves ou backend durante o jogo.

```bash
npm run build
npm run preview
npm run test
npx playwright install chromium
npm run test:e2e
```

O build está em `dist/` e deve ser servido por HTTP. Não abrir `index.html` por `file://`. Para repetir o smoke test de produção, mantenha `npm run preview` em execução e rode `node scripts/smoke-production.mjs` em outro terminal. Para testar o fallback manualmente, adicione `?renderer=canvas` à URL.

O projeto usa caminhos relativos no build e pode ser hospedado como site estático. Não foi publicado em um serviço externo.

## Jogar

Entre no Farol. Sálvia, Orren e Nim conversam quando Eira se aproxima e pressiona E. A oficina, o altar e a galeria também estão acessíveis no painel à direita. Inicie uma expedição pelo painel ou pelo portal.

| Entrada | Ação |
| --- | --- |
| WASD | Movimento na tela em oito direções |
| Mouse | Direção do ataque |
| Botão esquerdo | Ataque / combo de seis golpes por arma |
| Segurar botão esquerdo | Golpe carregado após a primeira ação |
| Botão direito | Especial: corte circular, impacto ou leque de flechas |
| Espaço | Esquiva; cancela a recuperação dos golpes |
| Shift | Ruptura: dano e lentidão ao redor |
| Q | Aurora: ataque amplo com energia completa |
| E | Interagir / manter pressionado para canalizar |
| Tab | Mapa da região |
| Esc | Pausa e retorno |
| F1 | Controles |

Elimine os inimigos **e** cumpra o objetivo para abrir a saída. Áreas alaranjadas e linhas antecipam os ataques. Urnas dão óbolos; flores explodem e ferem inimigos; espelhos devolvem projéteis hostis. Os portais só avançam ao pressionar E nas proximidades. As rotas opcionais retornam ao caminho principal.

Óbolos e Juramentos duram uma expedição. Ecos, habilidades, materiais, armas, aprimoramentos, infusões, memórias e desfechos ficam no navegador. O Altar oferece uma árvore de 18 habilidades, pré-requisitos e redistribuição gratuita. Na Oficina, forje armas com Ecos e materiais, aprimore até +3 e aplique infusões de Vidro, Brasa ou Maré. Cada câmara restaurada concede materiais e 2 Ecos; o saque sobrevive à morte. Consulte [o guia de progressão e receitas](docs/PROGRESSAO-E-FORJA.md). Combine habilidades e equipamentos com os Juramentos das quatro escolas.

## Conteúdo integrado

- Farol com três NPCs, árvore de 18 habilidades em três caminhos, pré-requisitos, níveis e restituição dos Ecos investidos, galeria e conquista de campanha.
- Crafting com três materiais, receitas de armas, aprimoramentos permanentes até +3, três infusões com efeitos no combate e escolha de arma persistente.
- Quatro biomas, sete câmaras principais e dois desvios por região: 36 nós, até 28 câmaras na rota principal.
- Grafo de progressão determinístico, alas de dimensões variáveis, partições BSP, corredores reservados, regras de borda para tiles, A* e validação de entrada, saída, objetivos e encontros com fallback.
- Oito objetivos: combate, obeliscos, escolta, defesa, correntes, coleta, fendas e sequência de runas. Desafios secundários de dano e tempo.
- Fioferro, Âncora Solar e Arco do Ocaso, com atlas equipados próprios, cadências, hitboxes, dano, especiais, projéteis e sons distintos.
- Oito inimigos com silhuetas e comportamentos diferentes. Perseguição, reposicionamento, recuo, antecipação, ataque, recuperação, stagger e morte.
- Quatro chefes com sequências de quatro padrões, fases por vida, barras identificadas, ataques sinalizados e recompensas narrativas.
- 24 Juramentos de Vidro, Cinza, Maré e Eco; loja, eventos com escolhas e dois finais na plataforma do Tear.
- Pixel art original nativa, atlas PNG/JSON usados pelo Phaser, tilesets por bioma, NPCs exclusivos, retratos, props animados e interface medieval. 51 assets, 8.826 quadros em atlas. Manifesto em `public/assets/manifest.json`.
- Profundidade por pés, sombras de contato, emissão aditiva, partículas em pool, névoa em camadas, fade de foreground e shader GLSL de vinheta. Renderização WebGL com fallback Canvas.
- Música procedural original por contexto e efeitos sintetizados por Web Audio. Volumes independentes, qualidade visual e intensidade de câmera.
- Salvamento LocalStorage versão 2 com validação e recuperação de dados inválidos. Continue reabre a câmara atual; câmaras não concluídas reiniciam seus encontros. O armazenamento é local a este navegador/origem.

## Escopo e limitações reais

Esta é uma implementação independente de escopo compacto. **Não é equivalente à produção artística, animação ou balanceamento de um jogo AAA ou de Hades.** O jogo possui campanha completa em sistemas, mas precisa de produção artística e testes de duração para atingir a ambição do briefing.

- Sprites usam rigs de pixels articulados, poses direcionais e espelhamento; os quadros não são ilustrações pintadas individualmente. Os chefes usam uma orientação principal. A arte procedural continua tendo limites de anatomia e expressividade.
- NPCs possuem sprites exclusivos e retratos em pixel art derivados dos seus rigs; não são retratos pintados à mão.
- Os biomas compartilham a estrutura de câmara e parte dos props. Não estão implementados todos os ambientes, prefabs e interações descritos no briefing: plataformas móveis, pistões, portas mecânicas físicas, geometria mutável, rios navegáveis e sala com enigma de espelhos são pendências.
- O gerador usa **regras de vizinhança**, não um solver WFC completo. BSP cria distribuição de pilares e alas; as transições entre câmaras são portais, não corredores contínuos entre mapas.
- Há iluminação emissiva estilizada e shader de composição. Não há normal maps/Light2D, sombras projetadas, bloom HDR dedicado, distorção de calor, shader de água com reflexão ou dissolve de ruído. Morte usa quadros e partículas.
- Escolta e defesa são encontros compactos; secundárias implementadas são ausência de dano e tempo. As demais secundárias do briefing e missões de NPC entre partidas ainda não estão presentes.
- A progressão narrativa usa retornos, quatro chefes, escolhas de evento, cinco memórias e dois finais. Não há um sistema extenso de relacionamentos, centenas de diálogos ou finais condicionados a múltiplas runs.
- A IA possui navegação e estados em uso; patrulhas investigativas extensas e coordenação tática entre inimigos não foram produzidas. A fase do Almirante muda padrões e ritmo, não a geometria física da arena.
- As três armas reutilizam o esqueleto de Eira com equipamento, seis poses de ataque, alcance e timing distintos. Shift é uma habilidade compartilhada.
- Áudio é síntese ambiente simples, não trilha orquestrada. Não existem arquivos de áudio gravados.
- Todo conteúdo visual é pré-carregado. Partículas e projéteis usam pooling; inimigos e textos de dano são instanciados. Não há streaming, culling avançado ou benchmark que confirme 60 FPS. Os três níveis de qualidade ajustam partículas e névoa; não controlam uma cadeia HDR de efeitos inexistente.
- Suporte de jogo é desktop com teclado e mouse. Não há controle, touch ou remapeamento. Comandos discretos usam uma fila por frame para não perder pressionamentos curtos. A interface se adapta a telas menores, mas o combate não foi projetado para celular.
- Salvamento depende do LocalStorage e não faz sincronização. Se estiver indisponível, a sessão segue em memória e não é persistida.

## Testes e evidências

`tests/systems.test.ts` valida 100 seeds (3.600 câmaras), determinismo, grafo, portas, caminhos A*, áreas de objetivos, projeção, combate, cooldowns, invulnerabilidade, morte, progressão, 24 Juramentos e save corrompido.

Playwright abre o jogo real e verifica menu, assets, Farol, oficina, movimento, combate, recompensa, próxima câmara, pausa, mapa, configurações e continuação. Os testes usam encontros controlados para verificar combate e os seis golpes de cada arma com cliques reais. O modo de QA só é instalado com `?test=1`; não é acessível em sessões normais. Screenshots ficam em `test-results/`. Os testes de assets conferem RGBA de 32 bits, ampliação nearest, poses distintas e as 15 ações nas oito direções de cada equipamento. A suíte de sistemas, progressão, animação, apresentação e assets contém 189 testes. A suíte E2E contém onze cenários por navegador, executados em Chromium e Microsoft Edge, incluindo fonte, proporções, oclusão, pré-requisitos da árvore, redistribuição, receitas, infusões no combate e permanência do saque. Sem Edge instalado, use `npm run test:e2e -- --project=chromium`. `npm run assets:check` percorre os quadros dos atores para detectar recortes nas bordas.

Consulte [docs/ARQUITETURA.md](docs/ARQUITETURA.md), [docs/PLANO.md](docs/PLANO.md) e [docs/VALIDACAO.md](docs/VALIDACAO.md) para detalhes, andamento e resultados executados.

## Adicionar conteúdo

| Conteúdo | Pontos de extensão |
| --- | --- |
| Bioma | `src/game/config.ts` (paleta/nome), `procedural.ts` (grafo), `world.ts` (encontros/padrões), `generate-assets.mjs` (tiles e props) |
| Inimigo | `src/types.ts` (EnemyKind), `config.ts` (atributos), gerador (silhueta/quadros), `world.ts` (roster e ataque) |
| Arma | `types.ts`, `config.ts` (cadência e dano), `combos.ts` (seis ataques), gerador (arma articulada), `world.ts` (hitbox/projétil) e `ui.ts` (desbloqueio) |
| Chefe | Gerador `bossFrame()`, `world.ts` em `updateBoss/bossAttack`, configuração regional e memória em `narrative.ts` |
| Tile | Gerador `tileFrame()`, regra de seleção em `buildEnvironment`; mantenha proporção 2:1 e pivô no centro lógico |
| Prop | Gerador `propFrame()`, manifesto automático, definição em `types.ts` e seleção em `procedural.ts`/`world.ts` |
| Objetivo | `ObjectiveKind`, registro `OBJECTIVES`, distribuição no grafo e lógica em `updateObjectives` |
| Juramento | `src/data/boons.ts`: escola, atributo, magnitude; consumir novo atributo no sistema correspondente |
| Evento/diálogo | `src/data/narrative.ts`, `ui.ts` em `event/dialogue`; persistir flags no save e migrar a versão se necessário |

Após alterar assets, execute `npm run assets:generate`. Inclua novos atlas no Preload e acrescente verificações de sistema e integração para regras novas.

O gerador atual está em `scripts/art/pixel-*.mjs`. As contagens de animação são compartilhadas em `src/data/animations.json`. O pipeline vetorial anterior fica apenas como arquivo histórico em `scripts/art/*archive*` e não participa do build.
