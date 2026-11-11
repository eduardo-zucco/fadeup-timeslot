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

Produção: Cloudflare Worker e D1 (SQLite), via Sites. O painel é autorizado pelo e-mail `ADMIN_EMAIL`, comparado à identidade fornecida pela plataforma. O Site permanece privado até que o proprietário escolha compartilhar.

Dados iniciais de demonstração: Corte R$40/30min, Barba R$30/30min, Combo R$65/60min; segunda a sábado, 9h-18h. O operador pode alterar os valores no painel. Não são dados validados de uma barbearia real.

Cada cliente recebe uma chave secreta de gerenciamento da reserva. Não compartilhe esse link. Não há consulta pública de dados por telefone. Confirmações e lembretes são registrados em fila; o envio externo por WhatsApp fica fora deste MVP.

Equipe: Lucas Castilho (PO), Eduardo Zucco (SM), Felipe Pereira e Fausto Iriu.
