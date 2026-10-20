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
