# Validação — 23 de outubro de 2026

Ambiente: Windows, Node.js 24.18.0, TypeScript estrito, Phaser 3.90.0, Vite 7.3.7, Vitest 5.0.5, Playwright Chromium e Microsoft Edge.

| Verificação | Resultado |
| --- | --- |
| `npm test` | **505 testes aprovados**, 14 arquivos |
| `npm run build` | TypeScript e build estático aprovados; versão atual em `dist/` |
| `npm run assets:check` | Todos os quadros dos 13 equipamentos, seis moradores, oito inimigos e quatro chefes sem recortes nas bordas |
| Manifesto de arte | 86 assets RGBA8888; 34 atlas e quatro tilesets; 22.286 frames |
| Vozes incluídas | 62 WAVs PCM mono 22.050 Hz/16 bits; cerca de 671 s; cabeçalhos, tamanho, conteúdo audível e cobertura dos diálogos verificados |
| `npx playwright test --project=edge` | **50 cenários aprovados** em 5,6 minutos, rodada completa antes dos dois casos finais de menu e estabilidade |
| HUD final — Edge e Chromium | **4 casos aprovados**: três resoluções e estabilidade dos elementos durante atualização de tempo e barras |
| Menu final — Edge e Chromium | Botões e painel acima do rodapé em 1440×900, 1280×720 e 800×600; aprovado nos dois navegadores |
| Diálogos e voz — Edge e Chromium | Seis moradores, temas, avanço, repetição, cancelamento e leitura automática; reprodução real dos WAVs aprovada nos dois navegadores |
| `npx playwright test tests/e2e/village-gates.spec.ts --project=chromium --grep terminais` | Colisão por caminhada e esquiva nos quatro biomas e nas quatro arenas de chefes |
| Vila e chaves em Chromium — rodada anterior | **5 cenários aprovados**, incluindo casas, chave por ataque e E, save, portão e último chefe |
| Arsenal e sobrevivência em Chromium e Edge | **20 cenários aprovados** na rodada direcionada anterior à ampliação final dos desenhos de fase |
| `npx playwright test tests/e2e/stage-design.spec.ts --project=chromium` | **4 cenários aprovados**, incluindo transição pelo portal e nove mapas distintos |
| Smoke da produção no Edge | Fluxo normal sem QA: menu, vila, inventário, caminhada até Lume, diálogo/voz, cozinha, portão, combate, baú animado, troca por F, mapa, save, continuação na mesma posição e backup; zero erros de console e zero requisições externas |
| `git diff --check` | Sem erros de whitespace |
| HTTP de `http://127.0.0.1:4173/` | 200 |

A suíte E2E agora define 52 cenários por navegador. A rodada completa de 50 no Edge ocorreu antes dos dois últimos casos de menu e estabilidade; os refinamentos finais receberam execuções direcionadas de gameplay, chefes/finais, combos, proporção, campanhas, saves, menus, voz e HUD. O Chromium recebeu os casos novos de campanhas/checkpoints/ambiente/menu, além de HUD e vozes na validação final. Não se apresenta essa cobertura como uma rodada única de 104 execuções.

## Campanhas, checkpoint e diálogos

Testes de regras validam migração, independência de inventários, troca, recarga, importação em espaço separado, limite de seis campanhas, exclusão de inativas e recuperação por cópia quando o espelho está corrompido. Armazenamento bloqueado mantém a sessão em memória e é sinalizado.

No navegador, um inimigo é ferido antes de salvar; a recarga conserva sua vida, a posição de Eira, a vida do jogador e o progresso do objetivo. Recompensa pendente reaparece sem duplicar saque. F1 não permite dispensá-la. Trocar de campanha e importar backup preservam a original. Recarregar no menu não desloca a expedição para a vila. Morte seguida de pagehide, inclusive durante a animação, mantém a expedição encerrada.

Todos os moradores oferecem apresentação e dois temas. A integração usa arquivos WAV reais em português e verifica perfis distintos, reprodução, mudança de assunto, avanço, repetição, cancelamento e configuração de leitura automática. As regras conferem correspondência entre texto e catálogo em todos os ramos estáticos e retornos de Sálvia de 1 a 20. Testes de fallback cobrem voz local, cancelamento tardio e indisponibilidade.

## Ambiente e revisão de assets

Os 36 desenhos de fase recebem decoração determinística sem alterar piso, segredo ou portão. O navegador verifica cobertura do chão no início e na saída de todas as câmaras, limite de cinco texturas em cache e fallback Canvas. A conferência visual inclui vila e quatro regiões, com árvores, vegetação, ruínas, peças de forja e margens rasas.

Os contratos de animação cobrem as 13 armas, seis moradores, oito inimigos e quatro chefes, com pivôs, quadros retangulares, RGBA e ampliação nearest. Ferramentas de Lume, Caio e Íria não recebem mais a arma genérica de Eira. HUD usa elementos persistentes para evitar reconstruir o painel de objetivo a cada atualização. Moldura e conteúdo têm camadas explícitas para preservar leitura.

## Vila e chaves

Os testes de regras conferem seis casas acessíveis com ruas, entradas e paredes, além de esconderijos determinísticos nas 36 câmaras com seis seeds cada. A chave sempre pode ser alcançada sem abrir a passagem secreta. Coleta exige descoberta; portões exigem chave, objetivos e recompensa resolvida. Save preserva descoberta e posse, a fase seguinte começa sem chave, e a migração mantém câmaras antigas já liberadas.

No navegador, Eira percorre fisicamente as seis casas, conversa com cada morador e revela seus interiores. Os testes atacam o esconderijo, recarregam o save, recolhem com E, verificam inventário e mapa, abrem o portão com animação e chegam à fase seguinte. Também cobrem o último chefe e o retorno ao Farol sem dispensar a chave. A nova colisão é exercitada por caminhada e esquiva nos quatro biomas e nas quatro arenas; os 36 mapas, em seis seeds cada, não deixam piso ou conteúdo além do portão, inclusive com o segredo aberto. Testes conferem bloqueio das folhas e permanência dos pilares sólidos após abrir.

## Fases e portões

O teste de identidade compara células transitáveis, ignorando variações da textura: confirmou **36 geometrias diferentes na mesma campanha**. Há nove propostas de percurso por região: travessia, labirinto, ilhas, bastião, encruzilhada, claustro, arena, tesouro e passarela de pulsos.

As regras de navegação percorrem quatro seeds em cada uma das 36 posições de campanha. Validam acesso a objetivos, props, relays, perigos, entradas e saída; a passagem secreta permanece opcional. Também continuam os 60 casos de exploração e 100 seeds do gerador original, cada uma com grafo de 36 nós.

A integração atravessa portões com E e verifica o próximo desenho, regra e mapa. Nos casos antigos de desenho, a preparação de QA libera explicitamente a chave; os novos casos exercitam a busca e o bloqueio completos. Confere ordem dos marcos, pares alternados, bloqueio por guardas, dois baús exigidos e os nove mapas de uma região. Os quatro chefes e os dois finais continuam na regressão completa.

## Arsenal, baús e encontros

Os testes verificam dois espaços de equipamento, troca por F, carregamento de atlas sob demanda, persistência e dano real com todas as dez armas novas. XP é atribuída à arma que disparou o projétil; árvores e forja bloqueiam compras sem XP, pré-requisitos ou materiais da arma correspondente. As assinaturas dos equipamentos e os valores de combate são exercitados nas regras.

Baús usam aproximação de Eira, pose de interação e oito quadros de tampa. Testes conferem abertura gradual, cancelamento com Espaço antes da coleta, concessão sincronizada e impossibilidade de repetir o saque. Passagens, props e registros de risco também são cobertos.

Guardas já existem na entrada da fase. Reforços aguardam um aviso com portão antes de surgir; chegadas pendentes bloqueiam a conclusão. Flores limpam raízes, marcos fecham válvulas, a maré reduz velocidade e aumenta frio, e o eclipse causa dano em cruz.

## Regressão preservada

A suíte completa verifica menu e tipografia legível, Farol, seis moradores e serviços presenciais, inventário, provisões, roupas, sobrevivência e pausa; árvore de 18 habilidades, receitas e infusões no combate; combos, câmera, proporção e oclusão; objetivos, escolta e defesa; saque, perda parcial na morte e refúgio de upgrades; retorno ao Farol, continuação sem repetir recompensas, quatro chefes e ambos os finais. O fallback Canvas continua coberto.

Os testes de QA usam posicionamento e tempo controlados, energia carregada ou vida ajustada para testar os sistemas. Não alegam conclusão manual da campanha no balanceamento padrão. O smoke de produção usa comandos normais e uma sessão nova, sem habilitar `?test=1`.

## Evidências e limites

Capturas atuais em `docs/screenshots/`: `revisao-menu.png`, `revisao-farol.png`, `revisao-inventario.png`, `revisao-inventario-recursos.png`, `revisao-cozinha.png`, `revisao-coleta-producao.png`, `revisao-mapa-fase-producao.png`, `revisao-jardins.png`, `dialogo-producao.png` e `campanhas-producao.png`, pelo fluxo normal. Capturas com QA incluem `revisao-ambiente-vila.png`, os quatro `revisao-ambiente-<região>.png`, `checkpoint-retomado.png`, `campanhas-salvas.png`, `dialogo-voz-orren.png`, `hud-objetivo-estavel.png`, `hud-polido-800.png`, `hud-polido-1280.png`, `hud-polido-1440.png` e `menu-polido-800.png`.

A conferência visual final usa Edge e testes direcionados no Chromium. Nesta máquina, algumas capturas automatizadas de página inteira ainda omitem intermitentemente o conteúdo do painel de objetivos, embora os nós, estilos e valores permaneçam presentes e a captura individual do painel renderize o texto. A interface foi simplificada e sua atualização estabilizada; a peculiaridade das capturas continua registrada como limite de verificação, sem atribuir uma correção definitiva ao compositor do navegador.

Não houve benchmark de FPS em diferentes GPUs nem playtest prolongado de dificuldade, economia e duração. As vozes são síntese, com duas bases e seis perfis, sem gravação de atores; a progressão narrativa continua compacta. As limitações artísticas e de produção estão descritas no README.
