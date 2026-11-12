# fadeUp - TimeSlot

MVP de agendamento para uma unidade e um profissional. Node.js 24, SQLite nativo e HTML/JavaScript; sem dependências de execução.

## Executar

```sh
npm start
```

Abra http://127.0.0.1:5173. O banco é criado automaticamente em `data/fadeup.sqlite`. O servidor local aceita conexões somente do próprio computador e representa o operador da barbearia. Não publique esse servidor diretamente na rede.

```sh
npm test
npm run check
npm run build
```

Hospedagem preferida: Railway Free com volume persistente para SQLite. Consulte [publicação gratuita](docs/publicacao-gratuita.md). Não houve contratação de plano pago. Fora da prévia local, o painel exige `ADMIN_KEY` com pelo menos 24 caracteres, configurada no ambiente do servidor.

O build alternativo de Cloudflare Worker/D1 também é gerado pelo CI; não é necessário para executar na Railway. O Sites ficou sem publicação para evitar cobrança futura.

Dados iniciais de demonstração: Corte R$40/30min, Barba R$30/30min, Combo R$65/60min; segunda a sábado, 9h-18h. O operador pode alterar os valores no painel. Não são dados validados de uma barbearia real.

Cada cliente recebe uma chave secreta de gerenciamento da reserva. Não compartilhe esse link. Não há consulta pública de dados por telefone. Confirmações e lembretes são registrados em fila; o envio externo por WhatsApp fica fora deste MVP.

Equipe: Lucas Castilho (PO), Eduardo Zucco (SM), Felipe Pereira e Fausto Iriu.

## Revisão do MVP em 12/11/2026

Fluxo em quatro etapas com resumo e dados preservados, histórico por situação e painel por dia/semana. Bloqueios usam horários livres; o catálogo pode ser editado sem mudar reservas anteriores. A concorrência entre cancelar e reagendar foi corrigida no banco.

Veja a [auditoria complementar e os prints](docs/auditoria-melhorias-2026-11-12.md). O PDF anterior permanece preservado e a publicação continua adiada. Para executar a mesma verificação da pipeline, use `npm run test:ci`; o relatório JUnit é gerado em `test-results/junit.xml`.
