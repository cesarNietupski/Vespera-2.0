# Plano de execução — Véspera

Projeto local em Phaser 3.90, TypeScript estrito e Vite, sem backend.

1. Fundação: projeção oblíqua reversível, colisão lógica, sprites e atlas PNG.
2. Combate: janelas de ataque, combo, carga, esquiva, IA por arquétipo, projéteis e impacto.
3. Jardins: salas conectadas por grafo, BSP, regras de vizinhança, objetivos e Cervo de Vidro.
4. Roguelite: Farol, diálogos, equipamentos, 24 Juramentos, salvamento e melhorias permanentes.
5. Expansão: quatro biomas, oito arquétipos, quatro chefes, oito objetivos e dois finais.
6. Apresentação: camadas, iluminação emissiva, partículas limitadas, áudio sintetizado, HUD e configurações.
7. Validação: 100 seeds, combate/progressão/save, navegador, screenshots e build.

Cada sistema deve estar conectado ao jogo. A entrega inclui um inventário verificável de limitações; a referência AAA é uma direção artística, não uma alegação de equivalência de produção.

## Estado da implementação

As sete etapas foram percorridas e integradas em uma campanha compacta. Os critérios funcionais centrais (movimento, combate, Jardins, ciclo roguelite, quatro regiões, apresentação e testes) estão implementados. A etapa de refinamento não atinge o acabamento artístico da referência; o inventário detalhado do README identifica efeitos, ambientes, interações, produção de arte e otimizações ainda pendentes. Não há código de sistema marcado como pronto sem integração ao fluxo de jogo.

A documentação de validação registra os resultados efetivamente executados, sem afirmar playtest exaustivo nem performance garantida.

## Progressão e crafting

Integrados: árvore ramificada de 18 habilidades, três caminhos e três talentos finais, requisitos por nível, compra e restituição integral de Ecos. Oficina com receitas, três materiais permanentes, aprimoramentos +1 a +3, infusões elementais e equipamento salvo. Habilidades e forja alteram a simulação; saque de câmaras e migração do save anterior estão cobertos por testes. Guia e receitas em `PROGRESSAO-E-FORJA.md`.

## Sobrevivência e moradores

Integrados: fome, sede e frio com efeitos e dano extremo; clima regional, aquecimento, mantimentos e isolamento. Três novos moradores com sprites e retratos próprios preparam alimentos, bebidas e roupas. Forja e árvore passaram a exigir conversa com Orren e Sálvia; não há atalhos no Farol. Novas receitas, recursos, estoque e necessidades preservam o save anterior. Guia em `SOBREVIVENCIA-E-MORADORES.md`.

Ao concluir cada câmara e recolher a recompensa, é possível voltar ao Farol sem encerrar a expedição. O portal oferece continuar o ponto salvo, inclusive após chefes e antes do desfecho final, sem duplicar recompensas.

Inventário unificado pelo HUD, tecla I e pausa: comidas e bebidas consumíveis, oito materiais com quantidades e origens, moedas, troca de roupas possuídas, armas e Juramentos. Consumo e troca de roupa persistem, enquanto receitas continuam com os NPCs. O menu funciona no Farol e nas câmaras e pausa o tempo.

## Revisão da identidade e animação

Revisão integrada em 20 de outubro de 2026: substituição dos vetores por pixels nativos em RGBA8888, quatro tilesets, atores e NPCs exclusivos, retratos, props animados, ícones, logo e menu medieval. A leitura usa fonte limpa de sistema, descrições de 16–17 px e contraste sobre pergaminho. Eira possui 15 ações por direção, seis ataques por arma e buffer de clique; inimigos e chefes têm antecipação, ativação e recuperação sincronizadas. A checagem de bordas e os testes de animação complementam a regressão da campanha. Detalhes em `IDENTIDADE-32BITS.md`.

## Exploração e risco — 22 de outubro de 2026

Fases normais ampliadas em cinco áreas, corredores, encontros por trecho, quatro marcos e objetivos maiores; mapa da fase com posição e caminho, passagens reveláveis, seis baús e props destrutíveis. A coleta registra totais por fase e exibe avisos por 2,7 segundos. Morte perde 30% do saque novo em risco e retorna ao Refúgio da Centelha, junto de Sálvia. Portais foram redesenhados com blocos de pedra. Regras, salvamento, combate e navegação receberam validação automatizada; balanceamento prolongado continua pendente.

## Arsenal e identidade das fases

Integrados: dez armas novas (13 no total), dois espaços de equipamento e troca por F; XP permanente e sete técnicas por arma, assinaturas específicas e forja limitada por experiência. Baús com aproximação, interação, oito quadros de tampa, coleta sincronizada e cancelamento seguro. Biomas possuem plantas, props e perigos próprios: flores controlam raízes, marcos fecham válvulas, maré reduz o passo e esfria, eclipse lança raios em cruz. Guardas já existem na entrada; reforços anunciam portais antes de chegar. Detalhes em ARSENAL-E-DESAFIOS.md.

Fases distintas por portal: nove propostas por região, 36 geometrias verificadas sem contar texturas. Labirintos exigem ordem dos marcos, ilhas exigem memórias, bastiões protegem marcos, encruzilhadas usam pares alternados, claustros restauram vida/calor, galerias exigem baús e passarelas exigem intervalos seguros. Quatro formatos de arena preservam os chefes. Transições reais pelo portal e mapas foram incluídos na integração.

## Vila e portões com chave

Integrados: planta exclusiva do Farol com praça, ruas, seis casas e decoração por profissão; telhados translúcidos, mapa da vila e caminhada orientada até moradores. Portais substituídos por portões de pedra e madeira com abertura animada. Cada fase esconde uma chave em um recipiente alcançável; mapa oferece pista, inventário registra posse e o portão valida objetivos, recompensa e chave. Descoberta e posse persistem, a próxima fase exige outra chave e a última arena segue a mesma regra. Guia em `VILA-E-PORTOES.md`.

Refinamento: portões no limite terminal de todas as fases, sem piso ou conteúdo depois da saída; folhas e pilares com colisão, inclusive durante esquiva e disparos rápidos. Armas reposicionadas no rodapé, abaixo das habilidades, com avisos acima do conjunto.

## Campanhas, vozes e acabamento — 23 de outubro de 2026

Integrados: seis campanhas independentes, migração do save anterior, salvar/continuar, checkpoints detalhados, exportação/importação de backups e indicação de gravação no HUD. A continuação preserva posição, inimigos, objetivos, reforços, escolta e recompensa pendente. Morte/vitória encerram a expedição sem ressurreição pelo autosave; sair durante a animação de morte registra a perda imediatamente.

Conversas receberam dois temas por morador e 24 linhas novas. Há 62 falas WAV em português brasileiro, cerca de 11 minutos, com seis perfis de timbre/ritmo derivados de duas vozes sintetizadas. Volume, leitura automática, repetição, cancelamento e redução da música estão integrados, mantendo as legendas. Serviços continuam restritos aos moradores.

Vila e quatro regiões receberam chão contínuo, margens rasas, 15 pisos e 20 elementos de cenário, preservando caminhos, segredos e portões. Revisão dos atlas corrigiu a arma indevida em três moradores e seus retratos. A interface agrupa objetivos, rota e chave, mantém armas no rodapé e adapta menu/diálogos a telas menores. Textos de objetivo são atualizados sem recriar os elementos a cada intervalo do HUD.

Cobertura e limites em VALIDACAO.md e CAMPANHAS-E-VOZES.md. A revisão melhora o acabamento do jogo compacto; a escala artística e de produção AAA continua sendo uma referência de ambição.
