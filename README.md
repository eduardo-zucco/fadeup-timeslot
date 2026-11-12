# fadeUp — TimeSlot

MVP de agendamento para uma unidade e um profissional. Node.js 24, SQLite nativo e módulos JavaScript, sem dependências de execução.

## Executar

Na pasta `fadeup`:

```sh
npm start
```

Cliente: http://127.0.0.1:5173/. Administração: http://127.0.0.1:5173/admin.

A página do cliente contém apenas Agendar e Meus horários. A administração tem uma entrada própria e exige autenticação, inclusive no computador local. Nenhuma chave administrativa é criada automaticamente ou enviada ao cliente.

Para habilitar o acesso de operador, defina `ADMIN_KEY` no ambiente antes de iniciar o servidor. Use uma chave privada com pelo menos 24 caracteres. No PowerShell:

```powershell
$env:ADMIN_KEY = Read-Host 'Chave administrativa da barbearia (mínimo 24 caracteres)'
npm start
```

Sem `ADMIN_KEY`, o agendamento público funciona e as rotas administrativas permanecem bloqueadas. O botão Sair remove a chave da sessão deste navegador; ela não é guardada na lista de reservas dos clientes.

O servidor escuta apenas em `127.0.0.1` por padrão e cria o banco em `data/fadeup.sqlite`. `DB_FILE`, `PORT` e `HOST` podem ser definidos no ambiente. A prévia local não publica o app.

## Estrutura

- `src/server/domain/`: regras puras de datas, serviços, cliente e mensagens pendentes.
- `src/server/services/`: casos de uso de agendamento.
- `src/server/repositories/`: SQL e transações atômicas.
- `src/server/http/`: rotas, autenticação, respostas e assets.
- `src/server/infrastructure/`: adaptador SQLite e leitura dos arquivos públicos.
- `src/server/node-server.mjs` e `src/server/worker.mjs`: adaptadores HTTP de execução.
- `public/assets/js/`: entradas separadas de cliente/admin, funcionalidades e módulos compartilhados.
- `public/assets/css/`: estilos da interface.
- `db/` e `drizzle/`: esquema local e migrações versionadas.
- `tests/`: domínio, API, HTTP, acesso, templates, migração e Worker.
- `scripts/`: comandos pequenos de inicialização, verificação, testes e build.

O [guia de arquitetura](docs/arquitetura.md) explica os limites entre as camadas e como alterar o app.

## Verificar

```sh
npm test
npm run check
npm run build
npm run test:ci
```

`check` verifica a sintaxe de todos os módulos de aplicação, scripts e testes. `test:ci` gera `test-results/junit.xml`. O build mantém imports ESM explícitos e gera o Worker em `dist/server/index.js`, usando a mesma API e os mesmos assets do servidor Node. A pipeline executa testes, sintaxe e build em push e PR, salvando os artefatos por 14 dias.

## Produto e limites

Dados de demonstração: Corte R$40/30min, Barba R$30/30min, Combo R$65/60min; segunda a sábado, 9h–18h. O operador pode alterar o catálogo sem modificar reservas anteriores. São hipóteses de demonstração, não preços validados de um negócio real.

O cliente recebe um link secreto de gerenciamento; ele autoriza acesso apenas àquela reserva. Confirmações e lembretes são registrados em fila; o envio por WhatsApp permanece fora do MVP. SQLite e transações protegem a ocupação contra reservas concorrentes.

Publicação continua adiada. Configuração Railway/Worker foi mantida, sem deploy ou contratação de plano. Consulte o [histórico de publicação](docs/publicacao-gratuita.md) quando essa etapa for retomada. O PDF anterior permanece preservado; as [melhorias de 12/11](docs/auditoria-melhorias-2026-11-12.md) e a [separação das áreas](docs/refatoracao-2026-11-12.md) estão documentadas à parte.

Equipe: Lucas Castilho (PO), Eduardo Zucco (SM), Felipe Pereira e Fausto Iriu.
