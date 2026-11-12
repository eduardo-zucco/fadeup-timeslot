# Separação de áreas e refatoração — 12/11/2026

Implementação e validação local realizadas antes do registro no Jira e GitHub, conforme solicitado. Esta etapa mantém o MVP, SQLite e ausência de dependências de execução. Nenhum PDF foi atualizado e nenhum deploy foi realizado.

## Alterações

- Cliente em `/`, contendo apenas agendamento e histórico. Administração em `/admin`, com autenticação antes da consulta de dados.
- Removido o privilégio automático de operador no servidor local. Node e Worker exigem `ADMIN_KEY`; cabeçalhos de identidade não substituem a chave.
- As rotas públicas de reserva continuam exigindo a chave da própria reserva, inclusive se houver credencial de operador na requisição. O operador utiliza as rotas próprias em `/api/admin/`.
- Servidor separado em domínio, serviços, repositório, HTTP e infraestrutura. Consultas parametrizadas e gravações atômicas permanecem no repositório.
- Interface dividida por funcionalidade, com templates separados dos controladores e entradas independentes para cliente e administração. Armazenamento de reservas e sessão administrativa têm módulos distintos.
- Build ESM com imports explícitos, descoberta única de assets e verificação de sintaxe em todos os módulos. Docker e testes apontam para a estrutura nova.

## Verificação

35 testes aprovados, sem ignorados. Verificados sintaxe, build e relatório JUnit. Novas regressões cobrem ausência de módulo administrativo no cliente, autorização no loopback, identidade forjada, reserva pública sem privilégio de operador, acesso Worker e escaping de dados nos templates. As regressões anteriores de concorrência e migração continuam aprovadas.

Navegador com banco isolado `.sites-runtime/qa-estrutura.sqlite` e chave fictícia de teste: criação de reserva às 09h, histórico, acesso direto a `/admin` sem chave, rejeição de chave inválida, login válido, consulta da agenda, salvamento de configurações, bloqueio às 12h, logout e recarga permanecendo na entrada. O formulário de login fica acessível por endereço direto; os dados administrativos exigem autenticação.

| Captura | Evidência |
| --- | --- |
| [Cliente sem painel](evidencias/estrutura-2026-11-12/01-cliente-sem-painel.jpg) | Navegação somente com Agendar e Meus horários |
| [Administração bloqueada](evidencias/estrutura-2026-11-12/02-admin-autenticacao.jpg) | Entrada sem agenda depois de sair e recarregar |

A [arquitetura](arquitetura.md) descreve a responsabilidade de cada pasta. Prints anteriores e o relatório de melhorias continuam como histórico da versão anterior.

SHA-256 do PDF preservado: `CE06AA450B26ED9F970C06069DB19A0661827F6501AEA8CBF1CDE578B8EE2CF0`.

## Rastreabilidade

| Jira | Entrega | GitHub |
| --- | --- | --- |
| [SCRUM-28](https://eduardobarreto879.atlassian.net/browse/SCRUM-28) | Separação cliente/admin e acesso explícito | [PR 13](https://github.com/eduardo-zucco/fadeup-timeslot/pull/13) |
| [SCRUM-29](https://eduardobarreto879.atlassian.net/browse/SCRUM-29) | Organização do código, camadas e módulos | [PR 13](https://github.com/eduardo-zucco/fadeup-timeslot/pull/13) |
| [SCRUM-30](https://eduardobarreto879.atlassian.net/browse/SCRUM-30) | Verificações, guia e capturas | [PR 14](https://github.com/eduardo-zucco/fadeup-timeslot/pull/14) |

A correção e a refatoração são integradas juntas para manter cliente e API compatíveis. A documentação e as evidências têm PR próprio. As revisões registradas são técnicas assistidas por Codex na conta autora; não são aprovações independentes da squad. Jira mantém as datas reais da execução e do registro posterior. O [JUnit](evidencias/estrutura-2026-11-12/testes-junit.xml) é uma captura da validação local; a execução atual do CI fica nos links de cada PR.

CI da implementação aprovada: [execução 43268209939](https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/43268209939), com artefatos de teste e build confirmados pela API do GitHub. [Snapshot](evidencias/estrutura-2026-11-12/ci-implementacao.json).
