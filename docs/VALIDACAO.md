# Validação executada — 20 de outubro de 2026

Ambiente: Windows, Node.js 24.18.0, TypeScript estrito, Phaser 3.90.0, Vite 7.3.7, Vitest 5.0.5 e Playwright com Chromium e Microsoft Edge instalado.

| Verificação | Resultado |
| --- | --- |
| `npm install` | Concluído, lockfile incluído |
| `npm run assets:generate` | 64 assets originais RGBA8888, 26 atlas JSON, fontes nativas PNG e manifesto; 9.405 frames em atlas |
| `npm run assets:check` | Todos os quadros dos três equipamentos, seis NPCs, oito inimigos e quatro chefes sem recortes nas bordas |
| `npm run build` | Aprovado; build estático em `dist/` |
| `npm run test` | **221 testes aprovados**, sete arquivos |
| Seeds | **100 seeds × 36 câmaras**, determinismo, conectividade, A*, objetivos, entrada e saída; nenhum fallback nessas amostras |
| `npm run test:e2e` (antes do inventário unificado) | **32 cenários aprovados**, dezesseis em Chromium e dezesseis em Microsoft Edge; rodada conjunta em 4,8 minutos, incluindo retorno ao Farol, sobrevivência, seis moradores, acesso por conversa, árvore, crafting, fonte, combos e sobreposição |
| Playwright: inventário, sobrevivência e retorno | **16 cenários aprovados** em Chromium e Microsoft Edge, em 2,4 minutos, após integrar o inventário unificado |
| `node scripts/smoke-production.mjs` | Build de produção: menu, Farol com seis moradores, inventário pela tecla I, oito recursos e provisões, caminhada até Lume, conversa, ração preparada, portal, expedição, necessidades, movimento, ataque e esquiva; zero erros de console e zero requisições HTTP externas |
| `npm audit` | **0 vulnerabilidades**, incluindo desenvolvimento |
| HTTP da prévia | 200 |

## Cobertura real no navegador

1. Menu, arte, Farol, oficina, expedição, movimento, combate, Juramento, próxima câmara, pausa e mapa.
2. Recarregamento, continuação e persistência da qualidade gráfica.
3. Os quatro chefes, fases, memórias persistentes, vitória e **os dois finais**, incluindo retorno ao Farol.
4. Obeliscos e combate com martelo e arco no **fallback Canvas**.
5. Morte, preservação de recursos, ressurreição e outra expedição.
6. Menu medieval, texto limpo e seis ataques diferentes com cliques reais do mouse em cada uma das três armas.
7. Descrições de cartas com pelo menos 16 px e botão principal com pelo menos 17 px em fonte de sistema.
8. Altura e sombra dos personagens; passagem atrás e à frente de um pilar, profundidade e transição de opacidade.
9. Árvore com pré-requisitos, compra de níveis, efeito na vida e armadura, persistência e redistribuição integral dos Ecos.
10. Forja de arma, aprimoramento +1, infusão de Brasa, equipamento persistente e incêndio aplicado em um acerto real.
11. Materiais recebidos ao restaurar uma câmara e preservados após morrer e recarregar o jogo.
12. Seis moradores acessíveis, ausência de atalhos e bloqueio de compras sem conversa ou fora do alcance do NPC.
13. Caminhada real até Lume, conversa, comida preparada, chá com Caio, roupas com Íria e persistência do guarda-roupa.
14. Necessidades e penalidades, pausa sem passagem de tempo, consumo pelos atalhos, dano extremo e continuação do save.
15. Retorno ao Farol após concluir uma câmara, bloqueio antes da conclusão, recursos preservados, abastecimento, recarregamento e continuação pelo portal sem repetir saque.
16. Retorno após chefes, inclusive antes da decisão final, com retomada do ponto salvo e acesso ao próximo bioma ou ao desfecho.
17. Inventário pelo HUD, tecla I e pausa; oito recursos com quantidades, saldos zerados, moedas e equipamento da expedição salva.
18. Consumo de cada comida e bebida, redução das necessidades, estoque atualizado, bloqueio de desperdício, tempo pausado e persistência após recarregar.
19. Troca de roupas já possuídas durante a expedição, peça não possuída bloqueada, persistência ao continuar e crafting remoto impedido.

Os encontros de QA usam inimigos com vida reduzida, posicionamento controlado e energia suprema carregada. Os objetivos interativos têm avanço de tempo controlado. Isso verifica integração sem alegar conclusão manual de uma campanha inteira no balanceamento padrão. O smoke test de produção usa controles e fluxo normais, sem habilitar o modo de QA.

## Evidências

Capturas atuais do build de produção em `docs/screenshots/`: menu, Farol, cozinha e Jardins. As capturas dos serviços de Sálvia, Caio e Íria e de habilidades aprendidas e aprimoramentos/infusões vêm da validação da UI em Playwright com saldo controlado. Escolhas, objetivos, mapa, quatro chefes e final são gerados em `test-results/` ao executar a suíte completa.

O inventário acrescenta capturas de produção em `inventario.png` e `inventario-recursos.png`; as capturas de consumo e troca de roupa nos testes usam estoque controlado. A rodada atual executou `npx playwright test tests/e2e/inventory.spec.ts tests/e2e/survival.spec.ts tests/e2e/farol-return.spec.ts`. O conjunto completo agora contém 19 cenários por navegador; os testes de combate não foram repetidos nesta alteração de inventário.

Os testes levaram à correção de timestamp truncado no save, HUD inconsistente no retorno, estados de pausa, recompensas repetidas de salas concluídas e comandos curtos perdidos entre frames. Seletores e prazos de espera foram ajustados para renderização sem GPU dedicada no navegador de testes.

A revisão visual verificou PNGs de 32 bits, pixels ampliados sem interpolação, seis poses distintas, janelas de impacto e enquadramento dos sprites. Humanoides foram reduzidos em aproximadamente 32%, com sombras, barras e nomes correspondentes; pés apoiados, ordem de profundidade, fundações recortadas pelo contorno da sala e cantos completos nas molduras foram revisados em capturas. A reação ao dano deixou de herdar o frame de um ataque simultâneo. A observação dos combos no teste usa frames de renderização para não perder animações curtas entre consultas.

Após a rodada completa, a verificação de leitura foi repetida nos dois navegadores para confirmar painéis opacos desde a abertura. A carta selecionada preserva o fundo claro de pergaminho; esse acabamento foi conferido novamente no Edge e em captura, seguido de novo build aprovado.

Os 15 novos testes de progressão verificam requisitos e talentos finais, custos crescentes, limite de níveis, restituição exata, compras sem consumo parcial, receitas, substituição de infusão, agregação de atributos, saque sem duplicação, morte e migração de saves antigos ou corrompidos. A integração usa três cenários adicionais por navegador, com recursos iniciais controlados somente nos dois cenários de compra. O cenário de coleta usa o saque normal da primeira câmara.

A extensão de sobrevivência acrescenta 19 testes de regras e migração e 13 verificações de novos assets. Verifica clima, fome/sede, isolamento, aquecimento, dano ambiental, imunidade preservada, consumo sem desperdício, receitas atômicas, moradores responsáveis, ingredientes, estoque e roupas após a morte. Três novos cenários por navegador verificam a integração; os antigos fluxos de oficina e árvore agora também passam por conversa e proximidade.

A revisão visual removeu o anúncio da câmara de cima dos painéis. Os seis cenários de sobrevivência passaram novamente nos dois navegadores após esse ajuste. O retorno entre câmaras acrescentou mais dois cenários por navegador; a rodada direcionada passou nos quatro casos, seguida da suíte completa com 32 casos aprovados.

## Limites

- Não houve benchmark que confirme 60 FPS em diferentes GPUs e notebooks.
- Não houve playtest prolongado de dificuldade, sinergias ou duração da campanha.
- Efeitos gráficos avançados, interações ambientais e refinamentos artísticos ainda pendentes estão enumerados no README.
- Compatibilidade verificada nos navegadores disponíveis nesta máquina; não em todas as versões antigas.
