# Vila do Farol e chaves das fases

O Farol dos Ecos agora tem uma planta própria de vila: praça com farol e poço, ruas de pedra clara, gramados, bancos, luminárias, árvores e seis casas. Cada casa tem placa, telhado e decoração da profissão do morador. Os telhados ficam translúcidos quando Eira se aproxima ou entra, preservando a leitura da interação.

| Morador | Casa | Decoração e serviço |
| --- | --- | --- |
| Sálvia | Casa da Centelha | Cristal, livros e altar; habilidades e redistribuição |
| Orren | Ferraria do Sol | Forno, bigorna e ferramentas; armas, técnicas e aprimoramentos |
| Nim | Arquivo das Memórias | Estantes, pergaminhos e mesa; registros da campanha |
| Lume | Cozinha do Abrigo | Fogão, panela e mantimentos; comidas |
| Caio | Casa das Águas | Cisterna, barris e recipientes; bebidas |
| Íria | Ateliê dos Fios | Tear, tecidos e rolos; vestimentas |

Use **Tab** para abrir o mapa da vila. Escolher um morador faz Eira caminhar pelas ruas até sua casa; **WASD** interrompe o percurso. Ao chegar, pressione **E** para conversar e escolher o serviço. O mapa também permite caminhar até o portão leste para iniciar ou continuar a expedição. A viagem usa a mesma grade e colisão do movimento manual; serviços continuam exigindo presença e conversa.

## Encontrar a chave e abrir o portão

Todas as fases, inclusive arenas de chefes, possuem uma chave em um **nicho marcado em bronze**. O esconderijo é escolhido pela seed entre recipientes alcançáveis, fora da passagem secreta opcional. O mapa informa uma região aproximada para procurar; o símbolo da chave só aparece depois da descoberta.

1. Explore a fase e procure o nicho indicado pela pista de **Tab**.
2. Ataque o recipiente com o botão esquerdo ou investigue com **E** nas proximidades para revelar a chave.
3. Pressione **E** junto da chave para recolher. O HUD e o inventário registram sua posse.
4. Cumpra os objetivos, restaure a fase e resolva a recompensa.
5. Pressione **E** junto do portão de pedra. A abertura tem oito quadros e dura aproximadamente um segundo; depois, a expedição avança.

Uma chave pertence à fase em que foi encontrada. A próxima começa com outro esconderijo e um portão trancado. A última arena também exige a chave e a abertura do portão antes da decisão final.

## Limite da fase e colisão

O portão fica na ponta de uma passagem de saída, depois da última área. A planta pode crescer para acomodar esse trecho; não há piso, baús, recursos, inimigos ou objetivos além do portão, mesmo após revelar a passagem secreta. A base sustenta os dois pilares de pedra.

As folhas fechadas têm colisão para personagens e projéteis. Caminhar, esquivar e receber impulso não permite atravessá-las. A simulação verifica subpassos de até oito unidades, inclusive nos disparos rápidos. A abertura libera o centro; os pilares laterais continuam sólidos. O portão reduz sua opacidade quando encobre Eira.

Os dois espaços de armas ficam no rodapé, abaixo das quatro habilidades e alinhados à base do painel de vida. A tecla **F** continua alternando a arma ativa. Avisos de interação e mensagens ficam acima desse conjunto.

## Continuação e retorno

Descoberta, posse e abertura do portão são salvas. Voltar ao Farol após restaurar a câmara preserva esses estados; continuar a expedição não dispensa uma chave que ainda falta. Câmaras concluídas não repetem saque. Uma nova expedição após a morte começa novamente sem chave.

Saves anteriores que já tinham uma câmara concluída mantêm sua passagem liberada. Fases novas e fases ainda incompletas recebem a busca pela chave normalmente.

## Código e validação

`src/game/village.ts` define casas, ruas, praça e colisão; `src/data/npcs.ts` associa moradores às casas; `scripts/art/pixel-village.mjs` desenha os atlas. `src/game/gates.ts` escolhe o esconderijo e valida descoberta, coleta e requisitos. `World` integra animação e interação; `Run.phase` e o parser do save preservam os três estados.

Os testes verificam as seis rotas da vila, esconderijos e limites terminais nas 36 fases em seis seeds, colisão das folhas e pilares, determinismo e migração do save. A integração no navegador percorre as seis casas com movimento real e testa revelação por ataque, coleta, reload, bloqueio por objetivos, abertura animada, troca de fase, retorno ao Farol e último chefe. Caminhada e esquiva contra portões fechados são exercitadas nos quatro biomas e nas quatro arenas de chefes.
