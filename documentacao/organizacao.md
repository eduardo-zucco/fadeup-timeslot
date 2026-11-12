# Organização das pastas — 12/11/2026

O código, as ferramentas, os documentos, as evidências e as saídas geradas estavam distribuídos em várias pastas da raiz. Foram agrupados por finalidade, preservando o comportamento do MVP.

| Antes | Agora |
| --- | --- |
| `src/server` | `aplicacao/servidor` |
| `public` | `aplicacao/interface` |
| `db/schema.sql` | `banco/esquema.sql` |
| `drizzle/*.sql` | `banco/migracoes/*.sql` |
| `docs` | `documentacao` |
| `evidence` | `documentacao/evidencias` |
| `output/pdf` | `documentacao/entrega` |
| `scripts` | `ferramentas`, com comandos em português |
| `tests` | `testes`, com nomes de categoria em português |
| `data/fadeup.sqlite` | `.local/banco/fadeup.sqlite` |
| `dist` e `test-results` | `.local/compilado` e `.local/relatorios` |

Foram removidos do código versionado o Worker, sua configuração `.openai`, o catálogo de metadados Drizzle e a configuração npm herdada. O build entrega apenas a aplicação Node/SQLite utilizada atualmente. As migrações SQL foram mantidas porque documentam a evolução e são exercitadas pelos testes.

Os antigos caches e temporários locais foram isolados em `.local/descartados`, fora do código e da compilação. A exclusão física, inclusive por Lixeira, foi recusada pela revisão automática, sem motivo detalhado. Essa pasta não participa da execução nem é versionada.

Os relatórios antigos continuam como histórico; seus links relativos às evidências foram ajustados. O gerador de relatório foi movido e teve os caminhos atualizados, mas não foi executado. O PDF foi movido sem alteração de conteúdo.

## Verificação

35 testes aprovados, incluindo execução do pacote compilado em isolamento e proteção da administração. Sintaxe verificada em todos os 47 módulos, build Node/SQLite aprovado e comandos npm preservados. A pipeline usa os novos diretórios e salva artefatos de teste e aplicação por 14 dias.

SHA-256 do PDF: `CE06AA450B26ED9F970C06069DB19A0661827F6501AEA8CBF1CDE578B8EE2CF0`.

A organização não adiciona dependências nem altera regras de agendamento. Publicação continua adiada.
