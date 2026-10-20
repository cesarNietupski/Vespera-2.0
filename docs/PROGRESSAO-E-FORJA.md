# Árvore de habilidades e forja

No Farol, caminhe até **Sálvia** e pressione **E** para conversar e desenvolver habilidades; converse com **Orren** para criar equipamentos. Não há atalhos remotos: cada operação exige a conversa ativa e proximidade do NPC responsável. As telas mantêm pergaminho opaco, molduras em pixels e descrições legíveis de 16 px ou mais. Comida, bebida e vestimentas são preparadas pelos três novos moradores descritos em `SOBREVIVENCIA-E-MORADORES.md`.

## Habilidades

Há 18 habilidades permanentes, distribuídas em três caminhos. Cada caminho tem uma origem, duas ramificações de dois talentos e um talento final que exige as duas ramificações. Requisitos e níveis necessários ficam escritos em cada nó. Os botões bloqueados não gastam recursos.

| Caminho | Especialização | Talento final |
| --- | --- | --- |
| Luz que resiste | Vida, redução de dano, cura por eliminação e regeneração | Sol indelével: +30 de vida e +10 de cura por câmara |
| Memória do aço | Dano, chance crítica, golpe carregado, execução e velocidade de ataque | Assinatura do sol: +25% no especial e +15% no dano crítico |
| Entre os instantes | Esquiva, movimento, energia, recarga e invulnerabilidade | Antes do primeiro raio: 25% de Aurora ao iniciar uma expedição |

Os níveis têm custos crescentes em Ecos. As três origens preservam os cinco níveis dos talentos anteriores; os outros talentos têm um a três níveis. **Redistribuir** devolve integralmente os Ecos investidos e permite reconstruir a árvore no Farol. Forja, infusões e materiais não são afetados pela redistribuição.

Os efeitos se somam aos Juramentos da expedição. As reduções de dano e recargas respeitam os limites do combate. Todos os efeitos estão ligados à simulação; críticos também funcionam nos projéteis do arco.

## Receitas de armas

Fioferro já pertence a Eira. As armas forjadas ficam disponíveis permanentemente; **Equipar** escolhe a arma para a travessia e a escolha é salva.

| Arma | Ecos | Ferro de memória | Estilhaços de vidro | Brasas antigas |
| --- | ---: | ---: | ---: | ---: |
| Âncora Solar | 12 | 6 | 0 | 1 |
| Arco do Ocaso | 18 | 4 | 4 | 0 |

Na aba **Aprimorar**, cada nível acrescenta 12% de dano e 3% de velocidade de ataque. Os bônus acumulam até +3, individualmente para cada arma. A tela mostra os atributos atuais e o dano do próximo nível.

| Novo nível | Ecos | Ferro | Vidro | Brasa |
| --- | ---: | ---: | ---: | ---: |
| +1 | 6 | 6 | 2 | 0 |
| +2 | 12 | 12 | 4 | 1 |
| +3 | 18 | 18 | 6 | 2 |

## Infusões

Uma arma +1 ou superior pode receber uma infusão. Cada arma possui um único espaço; aplicar outra substitui o efeito anterior e consome os novos materiais. Remover é gratuito e não devolve reagentes. Efeitos e cores dos golpes/projéteis acompanham a arma equipada.

| Infusão | Efeito | Receita |
| --- | --- | --- |
| Vidro | +6 pontos percentuais de chance crítica | 8 Ecos, 6 Vidros, 2 Ferros |
| Brasa | 4 de dano por segundo durante 3 segundos; novos acertos renovam a duração | 8 Ecos, 3 Brasas, 2 Ferros |
| Maré | Reduz velocidade inimiga em 18% durante 2 segundos | 8 Ecos, 4 Vidros, 1 Brasa |

## Materiais e permanência

O kit inicial contém quatro Ferros e dois Vidros. Cada câmara restaurada concede materiais e dois Ecos, salvos imediatamente. Não há coleta manual de objetos nem bolsas perdidas ao morrer.

- Ferro: todas as câmaras; encontros de combate concedem de três a seis unidades conforme a região.
- Vidro: todas as câmaras, com duas unidades nos Jardins e Arquivos e uma nas outras regiões.
- Brasa: câmaras das Forjas, elites e desafios; cada Vigia concede quatro.

Uma câmara já registrada como restaurada não repete seu saque. Morrer preserva o banco de materiais, habilidades, armas, níveis e infusões. Ecos de encerramento da expedição continuam sendo concedidos pelo sistema anterior.

## Dados e extensão

- `src/data/skills.ts`: grafo de pré-requisitos, custos, efeitos, compra e restituição.
- `src/game/crafting.ts`: materiais, receitas, infusões, atributos e recompensa de câmara.
- `src/game/world.ts`: agregação de efeitos, combate e entrega do saque.
- `src/progression.css` e `src/ui.ts`: apresentação, custos disponíveis, bloqueios e navegação.

O save mantém a chave `vespera.save.v2`, com campos adicionais validados. Saves anteriores preservam talentos, armas desbloqueadas, memórias e expedição. Os novos campos recebem valores padrão; habilidades órfãs, níveis fora do limite, materiais inválidos e infusões desconhecidas são descartados ou limitados durante a leitura.

O sistema oferece três bases de arma, três níveis e três infusões; não gera novos modelos de arma aleatórios. Economia e dificuldades receberam testes funcionais, sem alegar balanceamento exaustivo de múltiplas campanhas.
