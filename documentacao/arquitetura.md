# Arquitetura do fadeUp

## Organização

A raiz tem cinco pastas de trabalho: `aplicacao`, `banco`, `documentacao`, `ferramentas` e `testes`. Dados e resultados locais ficam em `.local`, ignorada pelo Git. O mapa completo está no [README](../README.md).

## Aplicação

`Node → HTTP/API → serviço de agenda → repositório → SQLite`

A interface fica em `aplicacao/interface`; o servidor, em `aplicacao/servidor`.

| Pasta do servidor | Responsabilidade |
| --- | --- |
| `domain` | Regras puras de datas, catálogo, cliente e notificações pendentes |
| `services` | Casos de uso de reserva, reagendamento, cancelamento e configuração |
| `repositories` | SQL parametrizado e transações atômicas |
| `http` | Rotas, autenticação, respostas e arquivos estáticos |
| `infrastructure` | Adaptador SQLite e leitura dos arquivos da interface |

`node-server.mjs` adapta o protocolo HTTP do Node. O domínio não conhece HTTP ou banco; as rotas não contêm SQL. O repositório não decide regras de disponibilidade. O esquema e as migrações SQL ficam em `banco`.

## Duas áreas da interface

`/` carrega `client.js`, que registra somente agendamento e histórico. `/admin` carrega `admin.js`, que exige autenticação antes da consulta da agenda. A página do cliente não tem botão administrativo nem importa os módulos da pasta `admin`.

Em `aplicacao/interface/assets/js`, `booking` cuida do agendamento; `history`, do histórico; `admin`, da agenda/configurações/bloqueios do operador; `shared`, de rede, formatação, diálogo, links e armazenamento comum. Templates HTML ficam separados dos controladores de eventos. O agendamento é reutilizado para encaixes sem duplicar o fluxo.

A sessão administrativa só é lida pela entrada administrativa. O armazenamento de reservas guarda apenas identificador e token. A rede só envia `X-Admin-Key` para rotas administrativas, e os endpoints públicos continuam exigindo o token da reserva.

## Acesso

Todas as rotas `/api/admin/*` exigem `ADMIN_KEY` com pelo menos 24 caracteres. Estar em localhost ou enviar um cabeçalho de identidade não concede privilégios. A entrada sem credencial mostra apenas o formulário. Sair apaga a chave da sessão e retorna à entrada. Não há cadastro de múltiplos operadores nesta etapa.

## Build e testes

`ferramentas/compilar.mjs` produz um pacote Node/SQLite em `.local/compilado`, com apenas aplicação, esquema/migrações, inicializador e pacote npm mínimo. A alternativa antiga de Worker/Cloudflare foi removida. O build limita sua limpeza à própria pasta de compilação e preserva `.local/banco`.

A suíte em `testes` cobre domínio, API, HTTP, autorização, concorrência, migração, templates e execução do pacote compilado isoladamente. O teste de compilação inicia o artefato gerado, sem depender dos fontes originais. A verificação de sintaxe percorre aplicação, ferramentas e testes.

Nenhuma mudança de esquema de dados foi feita nesta organização; o banco existente e o PDF foram preservados. Não houve publicação.
