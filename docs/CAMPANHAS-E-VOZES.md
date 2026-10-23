# Campanhas, diálogos e acabamento

## Salvar e continuar

Use Esc → Salvar agora ou Salvar e sair para o menu. O autosave também ocorre a cada cinco segundos, ao ocultar/fechar a página e após mudanças importantes. O indicador no canto superior direito mostra a última gravação e avisa quando o navegador bloqueia o armazenamento.

Continuar restaura a vila ou a expedição ativa: posição, vida, energia, necessidades, inventário, inimigos e suas vidas, marcos, objetivos, ondas, reforços e escolta. Saque obtido, segredos e chaves continuam no registro da fase. Recompensas pendentes reaparecem sem duplicar o saque. Golpes, projéteis e animações em andamento são retomados em estado seguro; há uma breve proteção de 0,6 s ao voltar ao combate.

O save anterior é migrado para Campanha 1. Nova campanha cria outra história, com inventário e progressão novos, mantendo as preferências de áudio e qualidade. Há até seis espaços. Campanhas salvas permite alternar, exportar um JSON, importar em outro espaço e excluir campanhas inativas. Exportar não apaga o save local.

Os dados ficam no navegador e endereço utilizados, sem conta ou sincronização. O backup permite transportar uma campanha entre computadores, navegadores ou entre as portas locais de desenvolvimento e produção. Importação valida a versão e os campos e aceita arquivos de até 2 MB. Não altere um backup manualmente durante uma partida.

## Conversas e vozes

Aproxime-se de um dos seis moradores e pressione E. Além da apresentação, cada um oferece dois temas: história pessoal e orientação ligada à sua profissão. Os serviços continuam exigindo conversa e proximidade.

| Morador | Interpretação | Serviço |
| --- | --- | --- |
| Sálvia | Serena, acolhedora e lenta | Habilidades |
| Orren | Grave e pausada | Armas e técnicas |
| Nim | Aguda, ágil e curiosa | Memórias |
| Lume | Calorosa e direta | Cozinha |
| Caio | Calmo e cuidadoso | Água e chá |
| Íria | Clara e firme | Vestimentas |

Há 62 arquivos WAV PCM mono, 22.050 Hz/16 bits, com cerca de 671 segundos ao todo. A síntese usa Maria e Daniel em português brasileiro, com seis perfis de timbre e ritmo. Os arquivos estão incluídos e são carregados apenas quando a fala é selecionada; a música diminui durante a reprodução.

Ouvir novamente repete a linha atual; Parar voz interrompe imediatamente. Avançar, mudar de assunto, abrir um serviço, fechar a conversa, trocar de campanha ou ocultar a página cancela a fala anterior. Configurações oferece volume e leitura automática. As legendas permanecem ativas, mesmo sem áudio.

Os ramos de progresso e retornos de Sálvia de 1 a 20 estão incluídos. Números superiores usam síntese local do navegador quando existe voz em português. Falha de arquivo também tenta essa alternativa, sem enviar o texto para um serviço remoto.

Para regenerar: `node scripts/generate-voices.mjs`, com Node 24 e as vozes Windows usadas na geração. O jogo pronto não exige essas vozes instaladas para reproduzir os WAVs. O catálogo é `public/assets/dialogue-voices.json`.

## Revisão visual e correções

Os atlas de 13 armas, seis moradores, oito inimigos e quatro chefes são conferidos quanto a dimensões, pivôs, ações, direções e recortes. Lume, Caio e Íria agora mantêm somente suas ferramentas de profissão, sem a arma genérica que aparecia indevidamente; seus retratos também foram atualizados.

Os cinco ambientes receberam solo contínuo, margens rasas, 35 quadros de cenário, contato com o chão e partículas nas cores de cada região. A decoração preserva a geometria da fase, a passagem secreta e a visão dos portões. A textura de fundo acompanha a câmera e cobre redimensionamentos, com cache limitado aos cinco temas.

Objetivos, orientação e chave ficam em uma coluna organizada; armas continuam no rodapé, sob as habilidades. O painel se compacta em alturas menores. Campanhas, diálogos, configurações e inventário usam texto legível e áreas roláveis. Diálogos contam com controle de foco por Tab.

Foram corrigidos a reinicialização de encontros ao continuar, a perda da recompensa pendente ao recarregar, a possibilidade de recriar uma expedição encerrada pelo autosave, a alteração do local salvo ao recarregar no menu, o desvio de recompensas pelo F1 e o retorno incorreto de Configurações para a partida durante a pausa. A cobertura executada consta em VALIDACAO.md.
