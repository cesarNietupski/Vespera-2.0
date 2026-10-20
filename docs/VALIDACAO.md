# Validação executada — 20 de outubro de 2026

Ambiente: Windows, Node.js 24.18.0, TypeScript estrito, Phaser 3.90.0, Vite 7.3.7, Vitest 5.0.5 e Playwright com Chromium e Microsoft Edge instalado.

| Verificação | Resultado |
| --- | --- |
| `npm install` | Concluído, lockfile incluído |
| `npm run assets:generate` | 51 assets originais RGBA8888, 23 atlas JSON, fontes nativas PNG e manifesto; 8.826 frames em atlas |
| `npm run assets:check` | Todos os quadros dos três equipamentos, oito inimigos e quatro chefes sem recortes nas bordas |
| `npm run build` | Aprovado; build estático em `dist/` |
| `npm run test` | **189 testes aprovados**, seis arquivos |
| Seeds | **100 seeds × 36 câmaras**, determinismo, conectividade, A*, objetivos, entrada e saída; nenhum fallback nessas amostras |
| `npm run test:e2e` | **22 cenários aprovados**, onze em Chromium e onze em Microsoft Edge; rodada conjunta final em 3,8 minutos, incluindo árvore, crafting, fonte, combos e sobreposição |
| `node scripts/smoke-production.mjs` | Build de produção: menu, Farol, árvore, forja, assets, expedição, movimento, ataque e esquiva; zero erros de console e zero requisições HTTP externas |
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

Os encontros de QA usam inimigos com vida reduzida, posicionamento controlado e energia suprema carregada. Os objetivos interativos têm avanço de tempo controlado. Isso verifica integração sem alegar conclusão manual de uma campanha inteira no balanceamento padrão. O smoke test de produção usa controles e fluxo normais, sem habilitar o modo de QA.

## Evidências

Capturas do build de produção em `docs/screenshots/`: menu, Farol, árvore, forja e Jardins. As capturas de habilidades aprendidas e aprimoramentos/infusões vêm da validação da UI em Playwright com um saldo controlado. Escolhas, objetivos, mapa, quatro chefes e final são gerados em `test-results/` ao executar a suíte completa.

Os testes levaram à correção de timestamp truncado no save, HUD inconsistente no retorno, estados de pausa, recompensas repetidas de salas concluídas e comandos curtos perdidos entre frames. Seletores e prazos de espera foram ajustados para renderização sem GPU dedicada no navegador de testes.

A revisão visual verificou PNGs de 32 bits, pixels ampliados sem interpolação, seis poses distintas, janelas de impacto e enquadramento dos sprites. Humanoides foram reduzidos em aproximadamente 32%, com sombras, barras e nomes correspondentes; pés apoiados, ordem de profundidade, fundações recortadas pelo contorno da sala e cantos completos nas molduras foram revisados em capturas. A reação ao dano deixou de herdar o frame de um ataque simultâneo. A observação dos combos no teste usa frames de renderização para não perder animações curtas entre consultas.

Após a rodada completa, a verificação de leitura foi repetida nos dois navegadores para confirmar painéis opacos desde a abertura. A carta selecionada preserva o fundo claro de pergaminho; esse acabamento foi conferido novamente no Edge e em captura, seguido de novo build aprovado.

Os 15 novos testes de progressão verificam requisitos e talentos finais, custos crescentes, limite de níveis, restituição exata, compras sem consumo parcial, receitas, substituição de infusão, agregação de atributos, saque sem duplicação, morte e migração de saves antigos ou corrompidos. A integração usa três cenários adicionais por navegador, com recursos iniciais controlados somente nos dois cenários de compra. O cenário de coleta usa o saque normal da primeira câmara.

## Limites

- Não houve benchmark que confirme 60 FPS em diferentes GPUs e notebooks.
- Não houve playtest prolongado de dificuldade, sinergias ou duração da campanha.
- Efeitos gráficos avançados, interações ambientais e refinamentos artísticos ainda pendentes estão enumerados no README.
- Compatibilidade verificada nos navegadores disponíveis nesta máquina; não em todas as versões antigas.
