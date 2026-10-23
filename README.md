# VÉSPERA — As Engrenagens da Última Aurora

Action roguelite original para navegador, em português brasileiro. Eira atravessa quatro regiões para recuperar os fragmentos de uma máquina que transformava memórias em luz. Campanha compacta e jogável, com combate, objetivos, progressão e dois desfechos.

Identidade renovada em pixel art da era 32 bits: menu medieval, madeira, bronze, pergaminho e textos limpos e legíveis. Sprites, tiles, retratos e interface originais em PNG RGBA8888. As treze armas têm seis ataques com o botão esquerdo e entrada antecipada de combo. Consulte [a direção visual e de animação](docs/IDENTIDADE-32BITS.md).

Agora com seis campanhas independentes, checkpoints de fase, backups em arquivo e conversas em português com vozes incluídas. A vila e as quatro regiões receberam solo contínuo, vegetação, ruínas e ambientação própria, cobrindo as antigas áreas escuras. Guia em [docs/CAMPANHAS-E-VOZES.md](docs/CAMPANHAS-E-VOZES.md).

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

Entre no Farol, aproxime-se de um morador e pressione E. **Sálvia** desenvolve habilidades, **Orren** cuida das armas e **Nim** mostra memórias. **Lume** prepara comida, **Caio** purifica água e faz chá, e **Íria** confecciona vestimentas. Os serviços exigem conversa e proximidade; não há painel de atalhos para crafting ou árvore. O Farol é uma vila com praça, ruas e seis casas decoradas por profissão. Use Tab para consultar o mapa e caminhar até cada morador. Inicie uma expedição pressionando E junto ao portão leste. Guia em [docs/VILA-E-PORTOES.md](docs/VILA-E-PORTOES.md).

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
| F | Alternar entre a arma corpo a corpo e a arma de distância, exibidas no rodapé |
| E | Interagir / manter pressionado para canalizar |
| R | Comer uma ração; usa ensopado se não houver ração |
| T | Beber água; usa chá se não houver água |
| I | Inventário: consumir provisões, vestir roupas e consultar recursos |
| Tab | Mapa da vila ou da fase: posição, caminhos, destinos, objetivos, baús e pista da chave |
| Esc | Pausa e retorno |
| F1 | Controles |

Cada portão de avanço leva a uma câmara com percurso e regra próprios: labirintos, ilhas, bastiões, bifurcações, claustros, tesouros e passarelas de pulsos. Percorra as cinco áreas, sintonize os quatro marcos com E e cumpra o objetivo e encontre a chave escondida para abrir a saída. As arenas dos chefes mantêm seu próprio combate. Áreas alaranjadas e linhas antecipam os ataques. Urnas dão óbolos; flores explodem e ferem inimigos; espelhos devolvem projéteis hostis. Procure o nicho marcado em bronze, revele a chave com um ataque ou E e recolha com E. Cada fase tem sua própria chave; com objetivos e recompensa resolvidos, pressione E junto ao portão para abri-lo e avançar. As rotas opcionais retornam ao caminho principal. O portão fica no limite final da fase, sem piso ou conteúdo além dele. Folhas fechadas bloqueiam personagens, esquivas e projéteis; os pilares permanecem sólidos após abrir.

Depois de concluir cada câmara e escolher sua recompensa, use **Voltar ao Farol** para se abastecer sem encerrar a expedição. Vida, óbolos, Juramentos e progresso são preservados. Para retomar, pressione **E** no portão do Farol e escolha **Continuar expedição salva**; a câmara concluída não gera outro saque.

Para interromper em qualquer ponto, pressione **Esc → Salvar e sair para o menu**. **Continuar** retoma posição, vida, inimigos e objetivos da fase. Há autosave a cada cinco segundos, nas interações relevantes e ao sair. **Nova campanha** cria outra história preservando a anterior; **Campanhas salvas** permite alternar entre até seis histórias e exportar/importar backups. O save permanece neste navegador e endereço; exporte uma cópia antes de trocar de computador ou limpar os dados do navegador.

Cada morador tem uma conversa de apresentação e dois assuntos próprios, com 24 falas novas sobre sua história e a viagem. As 62 falas incluídas totalizam cerca de 11 minutos de síntese em português brasileiro, com seis perfis de timbre e ritmo. É possível repetir, interromper, ajustar volume e desligar leitura automática. Legendas permanecem visíveis. A música diminui durante a fala.

Fome, sede e frio aumentam durante a expedição; quanto menor a barra, melhor. Necessidades altas reduzem dano, velocidade e cadência, e valores máximos causam perda de vida. Leve comida e bebida, vista proteção contra frio e aqueça-se nas tochas ou no Farol. Menus e diálogos pausam as necessidades. Abra o **Inventário** com **I**, pelo HUD ou na pausa: quatro abas permitem consumir comidas e bebidas, consultar todos os recursos e moedas, vestir roupas já confeccionadas e consultar armas e Juramentos. Guia de moradores, receitas e efeitos em [docs/SOBREVIVENCIA-E-MORADORES.md](docs/SOBREVIVENCIA-E-MORADORES.md).

Óbolos e Juramentos duram uma expedição. Ecos, habilidades, materiais, armas, aprimoramentos, infusões, memórias e desfechos ficam no navegador. O Altar oferece uma árvore de 18 habilidades, pré-requisitos e redistribuição gratuita. Na Oficina, forje armas com Ecos e materiais, aprimore até +3 e aplique infusões de Vidro, Brasa ou Maré. Cada arma tem experiência permanente e árvore de sete técnicas; forja e técnicas exigem uso daquela arma em combate. Cada câmara restaurada concede materiais e 2 Ecos; o estoque anterior permanece, mas a morte remove parte do saque novo ainda em risco. Consulte [o guia de progressão e receitas](docs/PROGRESSAO-E-FORJA.md). Combine habilidades e equipamentos com os Juramentos das quatro escolas.

Guia das 13 armas, dois espaços de equipamento, experiência e árvores individuais, abertura animada dos baús, desafios regionais e reforços sinalizados em [docs/ARSENAL-E-DESAFIOS.md](docs/ARSENAL-E-DESAFIOS.md).

Fases ampliadas, passagens secretas, baús, props destrutíveis, mapa da fase e risco de perder 30% dos novos recursos ao morrer são descritos em [docs/EXPLORACAO-E-COLETA.md](docs/EXPLORACAO-E-COLETA.md). A coleta mostra o total da fase por 2,7 segundos no canto superior direito. Depois da morte, Eira ressurge junto de Sálvia no Refúgio da Centelha para investir em upgrades.

## Conteúdo integrado

- Vila do Farol com praça, seis casas de moradores, decoração por profissão, ruas, telhados translúcidos e mapa com caminhada orientada; serviços por conversa e proximidade, árvore de 18 habilidades, pré-requisitos, níveis, restituição dos Ecos investidos, galeria e conquista de campanha.
- Fome, sede, frio, variações por bioma, aquecimento, cinco matérias-primas de sobrevivência, quatro provisões e duas vestimentas com isolamento.
- Crafting com três materiais, receitas de armas, aprimoramentos permanentes até +3, três infusões com efeitos no combate e escolha de arma persistente.
- Quatro biomas, sete câmaras principais e dois desvios por região: 36 nós, até 28 câmaras na rota principal.
- Grafo de progressão determinístico, alas de dimensões variáveis, partições BSP, corredores reservados, regras de borda para tiles, A* e validação de entrada, saída, objetivos e encontros com fallback.
- Oito objetivos: combate, obeliscos, escolta, defesa, correntes, coleta, fendas e sequência de runas. Desafios secundários de dano e tempo.
- Fioferro, Âncora Solar e Arco do Ocaso, com atlas equipados próprios, cadências, hitboxes, dano, especiais, projéteis e sons distintos.
- Oito inimigos com silhuetas e comportamentos diferentes. Perseguição, reposicionamento, recuo, antecipação, ataque, recuperação, stagger e morte.
- Quatro chefes com sequências de quatro padrões, fases por vida, barras identificadas, ataques sinalizados e recompensas narrativas.
- 24 Juramentos de Vidro, Cinza, Maré e Eco; loja, eventos com escolhas e dois finais na plataforma do Tear.
- Pixel art original nativa, atlas PNG/JSON usados pelo Phaser, tilesets por bioma, seis NPCs exclusivos, retratos, estações de trabalho, props animados e interface medieval. 86 assets visuais, 22.286 quadros em atlas. Manifesto em `public/assets/manifest.json`.
- Cinco ambientes com chão contínuo alinhado à câmera, margens rasas, sombras de contato, 15 variações de solo e 20 elementos de cenário. A decoração respeita caminhos, segredos e a área final dos portões.
- Profundidade por pés, sombras de contato, emissão aditiva, partículas em pool, névoa em camadas, fade de foreground e shader GLSL de vinheta. Renderização WebGL com fallback Canvas.
- Música procedural original por contexto, efeitos por Web Audio e 62 falas WAV em português com reprodução sob demanda. Volumes independentes, qualidade visual e intensidade de câmera.
- Salvamento LocalStorage versão 2 com migração, validação e cópia por campanha. Checkpoints preservam posição, vida, inimigos, objetivos, reforços, escolta e recompensa pendente; seis campanhas independentes e backups JSON. O armazenamento é local a este navegador/origem.

## Escopo e limitações reais

Esta é uma implementação independente de escopo compacto. **Não é equivalente à produção artística, animação ou balanceamento de um jogo AAA ou de Hades.** O jogo possui campanha completa em sistemas, mas precisa de produção artística e testes de duração para atingir a ambição do briefing.

- Sprites usam rigs de pixels articulados, poses direcionais e espelhamento; os quadros não são ilustrações pintadas individualmente. Os chefes usam uma orientação principal. A arte procedural continua tendo limites de anatomia e expressividade.
- NPCs possuem sprites exclusivos e retratos em pixel art derivados dos seus rigs; não são retratos pintados à mão.
- Os biomas possuem plantas e desafios próprios e compartilham parte dos props. Não estão implementados todos os ambientes, prefabs e interações descritos no briefing: plataformas móveis, pistões, portas mecânicas físicas, geometria mutável, rios navegáveis e sala com enigma de espelhos são pendências.
- O gerador usa **regras de vizinhança**, não um solver WFC completo. BSP cria distribuição de pilares e alas; as transições entre câmaras são portões com chave, não corredores contínuos entre mapas.
- Há iluminação emissiva estilizada e shader de composição. Não há normal maps/Light2D, sombras projetadas, bloom HDR dedicado, distorção de calor, shader de água com reflexão ou dissolve de ruído. Morte usa quadros e partículas.
- Escolta e defesa são encontros compactos; secundárias implementadas são ausência de dano e tempo. As demais secundárias do briefing e missões de NPC entre partidas ainda não estão presentes.
- A progressão narrativa usa retornos, quatro chefes, escolhas de evento, cinco memórias e dois finais. Não há um sistema extenso de relacionamentos, centenas de diálogos ou finais condicionados a múltiplas runs.
- A IA possui navegação e estados em uso; patrulhas investigativas extensas e coordenação tática entre inimigos não foram produzidas. A fase do Almirante muda padrões e ritmo, não a geometria física da arena.
- As treze armas reutilizam três famílias de animação do esqueleto de Eira com equipamento, seis poses de ataque, alcance e timing distintos. Shift é uma habilidade compartilhada.
- Música e efeitos usam síntese ambiente simples. As vozes são síntese exportada para WAV, com duas bases e seis perfis de atuação; não são gravações de atores. Falas com o número de mortes de Sálvia acima de 20 usam a voz local em português do sistema, se disponível. Os demais ramos incluídos funcionam sem vozes instaladas.
- A arte de cenário e dos atores base é pré-carregada; os dez atlas adicionais de armas são carregados conforme o equipamento, com descarte dos que deixam de ser necessários. Partículas e projéteis usam pooling; inimigos e textos de dano são instanciados. Não há streaming, culling avançado ou benchmark que confirme 60 FPS. Os três níveis de qualidade ajustam partículas e névoa; não controlam uma cadeia HDR de efeitos inexistente.
- Suporte de jogo é desktop com teclado e mouse. Não há controle, touch ou remapeamento. Comandos discretos usam uma fila por frame para não perder pressionamentos curtos. A interface se adapta a telas menores, mas o combate não foi projetado para celular.
- Salvamento depende do LocalStorage e não faz sincronização. Se estiver indisponível, o HUD avisa e a sessão segue em memória; exporte um backup. Golpes, projéteis e animações em andamento retomam em estado seguro, com breve proteção, preservando o progresso do encontro. A pausa não restaura o quadro exato de uma animação.

## Testes e evidências

`tests/systems.test.ts` valida 100 seeds (3.600 câmaras), determinismo, grafo, portas, caminhos A*, áreas de objetivos, projeção, combate, cooldowns, invulnerabilidade, morte, progressão, 24 Juramentos e save corrompido.

Playwright abre o jogo real e verifica menu, assets, Farol, oficina, movimento, combate, recompensa, próxima câmara, pausa, mapa, configurações e continuação. Os testes usam encontros controlados para verificar combate e os seis golpes de cada arma com cliques reais. O modo de QA só é instalado com `?test=1`; não é acessível em sessões normais. Screenshots ficam em `test-results/`. Os testes de assets conferem RGBA de 32 bits, ampliação nearest, poses distintas e as 15 ações nas oito direções de cada equipamento. A suíte de sistemas, progressão, animação, apresentação, campanhas, áudio e assets contém 505 testes. A cobertura E2E inclui checkpoints, campanhas, backups, vozes e ambiente nas 36 câmaras. Resultados efetivamente executados estão em [docs/VALIDACAO.md](docs/VALIDACAO.md). Sem Edge instalado, use `npm run test:e2e -- --project=chromium`. `npm run assets:check` percorre os quadros dos atores para detectar recortes nas bordas.

Consulte [docs/ARQUITETURA.md](docs/ARQUITETURA.md), [docs/PLANO.md](docs/PLANO.md) e [docs/VALIDACAO.md](docs/VALIDACAO.md) para detalhes, andamento e resultados executados.

## Adicionar conteúdo

| Conteúdo | Pontos de extensão |
| --- | --- |
| Bioma | `src/game/config.ts` (paleta/nome), `procedural.ts` (grafo), `world.ts` (encontros/padrões), `generate-assets.mjs` (tiles e props) |
| Inimigo | `src/types.ts` (EnemyKind), `config.ts` (atributos), gerador (silhueta/quadros), `world.ts` (roster e ataque) |
| Arma | `types.ts`, `weapons.ts` (tipo, cadência, dano e perfil), `mastery.ts` (árvore), `combos.ts` (seis ataques), gerador (arma articulada), `world.ts` (hitbox/projétil) e `ui.ts` (desbloqueio) |
| Chefe | Gerador `bossFrame()`, `world.ts` em `updateBoss/bossAttack`, configuração regional e memória em `narrative.ts` |
| Vila/portão | `village.ts` (planta), `data/npcs.ts` (casas), `gates.ts` (chave e requisitos), `pixel-village.mjs` e `pixel-world.mjs` (arte), `world.ts` (interação) |
| Tile | Gerador `tileFrame()`, regra de seleção em `buildEnvironment`; mantenha proporção 2:1 e pivô no centro lógico |
| Prop | Gerador `propFrame()`, manifesto automático, definição em `types.ts` e seleção em `procedural.ts`/`world.ts` |
| Objetivo | `ObjectiveKind`, registro `OBJECTIVES`, distribuição no grafo e lógica em `updateObjectives` |
| Juramento | `src/data/boons.ts`: escola, atributo, magnitude; consumir novo atributo no sistema correspondente |
| Evento/diálogo | `src/data/narrative.ts`, `ui.ts` em `event/dialogue`; persistir flags no save e migrar a versão se necessário |

Após alterar assets, execute `npm run assets:generate`. Inclua novos atlas no Preload e acrescente verificações de sistema e integração para regras novas.

O gerador atual está em `scripts/art/pixel-*.mjs`. As contagens de animação são compartilhadas em `src/data/animations.json`. O pipeline vetorial anterior fica apenas como arquivo histórico em `scripts/art/*archive*` e não participa do build.
