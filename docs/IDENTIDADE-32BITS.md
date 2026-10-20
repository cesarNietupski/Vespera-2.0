# Identidade visual 32 bits

## Direção

Pixel art da era 32 bits, original, com fantasia medieval, crepúsculo, luz de memória, madeira escura, bronze e pergaminho. As duas referências fornecidas orientam materiais e o vocabulário de interface; nenhum pixel, retrato, moldura ou elemento delas foi copiado.

32 bits aqui tem dois sentidos explícitos: estética de pixel art e arquivos PNG verdadeiros em **RGBA8888** (8 bits por canal, incluindo alfa). Não significa tiles de 32×32, nem uma paleta limitada a 32 cores.

Todos os atores, pisos, props, ícones, retratos, logotipo e fundo do menu são desenhados em pixels nativos, sem rasterizar e reduzir os antigos vetores. A ampliação usa vizinho mais próximo. O Phaser usa filtro de textura nearest, antialias desativado e coordenadas de render arredondadas. A UI DOM preserva texto limpo em Segoe UI/Trebuchet/Arial do Windows para leitura, conforme solicitado. O título é uma imagem pixel original; não há dependência de fontes remotas.

## Animação

Contrato compartilhado em `src/data/animations.json`: gerador, gameplay, controlador visual e testes consultam as mesmas contagens. Eira possui 15 ações, oito direções e três equipamentos: **1.280 quadros por arma**. Inimigos têm antecipação, ataque, recuperação, reação, morte e ciclos de movimento próprios; NPCs agora têm sprites exclusivos. Chefes possuem sequências próprias de investida, disparo, erupção e nova.

As poses usam juntas separadas, passadas alternadas, elevação dos pés, atraso da capa e cabelos, antecipação, aceleração do golpe e acomodação final. Arco tem desenho da corda, retenção e soltura; martelo usa levantamentos e impactos; lâmina alterna cortes, estocada, giro, ascensão e finalizador.

Morte, dano, ressurreição e ações finitas param no último quadro. Movimento e idle são cíclicos. A animação de canalização é usada ao segurar E junto ao objetivo. Portais, tochas, engrenagens, cristais, flores, obeliscos, forjas, espelhos e astrolábios usam quadros animados em tempo de execução.

## Botão esquerdo

Cada arma tem seis movimentos definidos em `src/game/combos.ts`. Cliques durante um golpe são armazenados até a janela de encadeamento. Há um único ataque pendente, com expiração, para impedir rajadas acumuladas involuntárias. Soltar o combo por mais de aproximadamente um segundo após o golpe reinicia a sequência. Segurar M1 continua carregando o ataque forte; M2 conserva o especial.

| Etapa | Fioferro | Âncora Solar | Arco do Ocaso |
| --- | --- | --- | --- |
| 1 | Corte da centelha | Queda da forja | Flecha do poente |
| 2 | Fio de retorno | Varredura de bronze | Disparo de retorno |
| 3 | Estocada de memória | Ruptura frontal | Flechas gêmeas |
| 4 | Órbita partida | Volta da bigorna | Linha do horizonte |
| 5 | Ascensão do fio | Brasa ascendente | Leque do ocaso |
| 6 | Último amanhecer | Peso do sol | Memória perfurante |

Cada entrada especifica animação, tempo, potência, alcance, arco da hitbox, frames ativos e, quando aplicável, quantidade e perfuração das flechas. Inimigos e chefes também disparam os ataques na fase de ativação da sua nova animação, após a antecipação.

## Gerar e verificar

```bash
npm run assets:generate
npm run assets:check
npm run test
npm run build
npm run test:e2e
```

Fontes: `scripts/art/pixel-raster.mjs`, `pixel-actors.mjs`, `pixel-world.mjs`, `pixel-ui.mjs`. Atlas nativos editáveis: `public/assets/sources/*.native.png`. Metadados: `*.pixel.json`, manifesto e atlas JSON.

A checagem de bordas percorre todos os quadros dos três equipamentos, oito inimigos e quatro chefes. A suíte também verifica RGBA de 32 bits, ampliação exata 2×, poses diferentes para os seis ataques, duração das ações e o encadeamento real com mouse no navegador.

O estilo segue sendo arte procedural autoral. Não se apresenta como uma coleção de sprites pintados individualmente por um artista, nem como acabamento AAA. A renovação visual mantém o save anterior e os sistemas existentes da campanha.

## Proporções, apoio e acabamento

Humanoides foram reduzidos de 1,4× para 0,95×, aproximadamente 32%; chefes de 1,65× para 1,15×. Colunas permanecem maiores que duas alturas humanas, e Nim e os quadrúpedes preservam suas silhuetas menores. Sombras, nomes e barras de vida seguem o novo tamanho. A respiração e a inclinação movem o tronco sem deslocar os pés apoiados no chão.

O ponto de apoio define a sobreposição entre sprites e cenário. Sombras não cobrem corpos; projéteis respeitam a profundidade. Colunas, árvores e props altos ficam translúcidos gradualmente ao encobrir personagens, incluindo suas tochas anexas. A fundação acompanha cada borda exposta da sala, sem o antigo preenchimento retangular nas lacunas.

As molduras preservam cantos completos com recorte de 12 pixels na origem; os materiais interiores têm ruído suave para não competir com a leitura. Engrenagens usam apenas seus quadros em pixels, sem rotação adicional que deformava a grade.

Painéis abrem opacos desde o primeiro frame, evitando que cenário e textos se misturem durante um fade de entrada. A escuridão de fundo fica somente fora do pergaminho.
