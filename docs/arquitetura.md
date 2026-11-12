# Arquitetura do fadeUp

## Fluxo do servidor

`Node ou Worker → HTTP/API → serviço de agenda → repositório → SQLite/D1`

As regras puras do domínio são usadas pelo serviço. O adaptador de transporte converte requisições para `Request` e devolve `Response`; não decide disponibilidade, preço ou duração. A API resolve rotas e autenticação, lê JSON e traduz erros. O serviço coordena autorização de reserva, disponibilidade, criação, reagendamento e cancelamento. O repositório concentra SQL parametrizado, batch e transações; não calcula regras de negócio.

| Alteração | Local |
| --- | --- |
| Datas, expediente, ocupação e intervalo | `src/server/domain/scheduling.mjs` |
| Campos de cliente e consentimento | `src/server/domain/customer.mjs` |
| Catálogo inicial e validação do expediente | `src/server/domain/config.mjs` |
| Momento das mensagens pendentes | `src/server/domain/notifications.mjs` |
| Casos de uso e conflitos | `src/server/services/agenda-service.mjs` |
| Consultas e transações | `src/server/repositories/agenda-repository.mjs` |
| Rotas e autorização de operador | `src/server/http/api.mjs` e `auth.mjs` |
| HTTP Node e SQLite | `node-server.mjs` e `infrastructure/` |

O esquema de dados não foi alterado nesta refatoração. O adaptador SQLite aplica o esquema idempotente existente. Migrações anteriores permanecem versionadas em `drizzle/`; os testes continuam cobrindo dados anteriores e consistência depois de reabrir o banco.

## Duas áreas de interface

`/` carrega `client.js`, que registra somente agendamento e histórico. `/admin` carrega `admin.js`, que inicializa uma sessão de operador e os módulos de agenda, configurações e bloqueios. A página do cliente não contém botão ou link administrativo e seu grafo de imports não inclui `admin/`.

Cada página recebe um contexto próprio com estado, navegação, cliente HTTP e notificações. As funcionalidades de agendamento, histórico e administração têm controladores de eventos separados dos templates HTML. Formatação, diálogo, links e armazenamento ficam em `shared/`. O agendamento é reutilizado pelo operador para encaixes, sem duplicar o fluxo do cliente.

A sessão administrativa só é lida pela entrada administrativa. A lista de reservas guarda apenas identificador e token de cada reserva. A camada de rede só acrescenta `X-Admin-Key` quando a operação usa o prefixo `admin/`; os endpoints públicos continuam exigindo o token da própria reserva.

## Acesso administrativo

Ocultar o botão não é a proteção. Todas as rotas `/api/admin/*` validam a chave de ambiente, de pelo menos 24 caracteres. A autorização é explícita em Node e Worker. Estar em localhost ou enviar um cabeçalho de identidade não concede privilégios. `GET /api/admin/session` verifica a credencial antes de a interface carregar a agenda.

Abrir `/admin` sem credencial mostra o formulário de entrada, sem dados de agenda. Sair apaga a chave da sessão do navegador e retorna ao formulário. A chave do negócio continua sendo um segredo compartilhado do operador; esta etapa não adiciona cadastro, perfis ou autenticação de múltiplos usuários.

## Build e manutenção

O build copia os módulos do servidor e gera um módulo de assets, preservando imports ESM. A antiga concatenação por substituições de texto foi removida. Node e Worker compartilham a descoberta de assets e os cabeçalhos de resposta; novos arquivos JavaScript, CSS e HTML não exigem editar duas listas de rotas estáticas.

Não importe o adaptador SQLite/Node pelo grafo do Worker; ele recebe o banco por `env.DB`. Não coloque SQL em rotas, regras de agendamento nos templates ou sessão administrativa na entrada de cliente. Mantenha dependências direcionadas para o domínio, sem ciclos de imports entre funcionalidades.

A suíte testa resultados observáveis: autorização em cada rota, ciclo HTTP, ocupação concorrente, migração, assets, imports da área do cliente e escaping de dados nos templates. O teste de API com falha de banco produz um log de erro intencional. Nenhuma dessas verificações declara publicação ou auditoria externa de segurança.
