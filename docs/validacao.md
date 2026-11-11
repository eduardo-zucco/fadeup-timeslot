# Validação da entrega

Data: 11/11/2026.

- 20 testes aprovados com Node 24: API, transações SQLite, autorização, Worker e servidor HTTP público.
- `npm run check` e `npm run build` aprovados.
- PRs #1 a #4 integrados com CI aprovado e revisão técnica assistida por Codex, identificada nos comentários reais.
- Fluxo de reserva executado no navegador: serviço, horário, dados e confirmação. Reserva de teste visível no painel.
- Capturas reais em `evidence/`; exports do Jira sem reconstituição de telas da ferramenta.
- PDF de 18 páginas com texto pesquisável, seções 3.1 a 3.9 e 13 histórias. Revisão visual das 18 páginas sem sobreposição ou corte de tabelas.

## Pendências externas

A auditoria posterior identificou uma falha de concorrência entre cancelamento e reagendamento simultâneos. Os 20 testes existentes passam, mas não cobrem esse cenário. A aprovação integral do código depende da correção e de um teste de regressão. Consulte [auditoria de escopo](auditoria-escopo.md).

- Publicação adiada pelo proprietário; retomar quando solicitado. Não houve deploy nem contratação de plano pago.
- Confirmar acesso do professor ao Jira e ao repositório.
- Obter revisão humana independente e validação do PO, caso exigidas na avaliação.
- A janela de referência de 11 a 13/11/2026, capacidade e estimativas não comprovam cerimônias nem execução em datas futuras. O relatório registra essa distinção.

Para atualizar o PDF após publicar, grave em `evidence/deploy.json` um objeto com `published: true`, `url`, `provider` e `notes` somente após verificar o endereço, e execute `scripts/report.py` com Python e ReportLab. Atualize também o snapshot do Jira usado no relatório.
