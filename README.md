# fadeUp — TimeSlot

Agendamento para uma unidade e um profissional, com Node.js 24 e SQLite. Sem dependências de execução.

## Onde fica cada coisa

```text
fadeup/
├── aplicacao/
│   ├── interface/     # Telas, estilos e JavaScript do navegador
│   └── servidor/      # API, regras de negócio e acesso ao banco
├── banco/             # Esquema SQL e histórico de migrações
├── documentacao/
│   ├── evidencias/    # Prints, resultados e registros Jira/GitHub
│   └── entrega/       # PDF final preservado
├── ferramentas/       # Iniciar, testar, verificar e compilar
├── testes/            # Testes automatizados
└── .local/            # Dados e arquivos gerados, fora do Git
```

Na raiz ficam apenas as configurações que as ferramentas precisam encontrar: pacote npm, Docker, Railway e pipeline em `.github`.

## Rodar

Na pasta `fadeup`, com Node.js 24:

```sh
npm start
```

Cliente: http://127.0.0.1:5173/. Administração: http://127.0.0.1:5173/admin.

O cliente vê apenas Agendar e Meus horários. A administração exige uma chave privada com pelo menos 24 caracteres, inclusive em localhost. Para habilitar o operador no PowerShell:

```powershell
$env:ADMIN_KEY = Read-Host 'Chave administrativa da barbearia (mínimo 24 caracteres)'
npm start
```

Sem essa variável, o agendamento funciona e as rotas administrativas ficam bloqueadas. Sair remove a chave da sessão do navegador. Não há chave padrão no aplicativo.

O banco local fica em `.local/banco/fadeup.sqlite`. O banco que já existia foi preservado nesse caminho. `DB_FILE`, `PORT` e `HOST` podem ser definidos no ambiente. O servidor escuta somente em `127.0.0.1` por padrão.

## Verificar e compilar

```sh
npm test
npm run check
npm run test:ci
npm run build
```

Os comandos continuam iguais. Os relatórios de testes ficam em `.local/relatorios`; o pacote pronto para executar fica em `.local/compilado`. Dentro dele, `npm start` inicia a mesma aplicação Node/SQLite. O build não copia banco real, documentação, caches, testes ou credenciais. A pipeline salva resultados e pacote por 14 dias.

A preparação alternativa antiga de Cloudflare/Worker foi removida. Docker e Railway continuam preparados para a etapa futura de publicação, que permanece adiada. Nenhum plano foi contratado e nenhum deploy foi realizado.

## Manutenção e entrega

[Arquitetura e responsabilidades](documentacao/arquitetura.md) · [Organização das pastas](documentacao/organizacao.md) · [PDF final](documentacao/entrega/fadeup-relatorio-final.pdf)

O PDF foi apenas movido, mantendo os mesmos bytes. Relatórios anteriores e prints estão agrupados em `documentacao`; eles registram versões anteriores e podem mencionar os caminhos antigos. A sessão administrativa e os links secretos de reservas continuam separados. WhatsApp automático permanece fora do MVP.

Equipe: Lucas Castilho (PO), Eduardo Zucco (SM), Felipe Pereira e Fausto Iriu.
