# Publicação sem contratar plano pago

O projeto funciona localmente com `npm start` e SQLite. Para Railway, o Dockerfile não instala dependências: usa Node 24 e o SQLite nativo.

## Railway Free

1. Entre na sua própria conta Railway e permaneça no plano Free/Trial, sem adicionar cartão ou contratar Hobby.
2. Conecte o repositório `eduardo-zucco/fadeup-timeslot` e a branch `main`.
3. Crie um único serviço com o Dockerfile incluído.
4. Anexe um volume de até 0,5 GB em `/data`; esse é o diretório que preserva o SQLite.
5. Defina `ADMIN_KEY` como uma senha aleatória de pelo menos 24 caracteres no ambiente do serviço. Não coloque a senha no GitHub ou no PDF.
6. Ative Serverless/suspensão por inatividade, quando disponível, para reduzir o consumo. Gere o domínio público da Railway.
7. Abra `/api/config` para conferir a saúde e depois faça uma reserva de teste. Reinicie o serviço e confirme que a reserva continua existindo.
8. Confira Usage antes de demonstrar. O crédito é limitado; não há promessa de funcionamento contínuo dentro de US$ 1 mensal. Se a plataforma exigir um plano pago, interrompa a publicação.

Preços consultados em 11/11/2026: Trial de US$ 5 por até 30 dias; Free de US$ 0 com US$ 1 de crédito por mês. Fontes: https://railway.com/pricing e https://docs.railway.com/pricing/free-trial . A disponibilidade efetiva deve ser confirmada na conta antes de publicar.

O painel exige a `ADMIN_KEY` no botão Painel. Ela fica apenas na sessão do navegador. Não use dados pessoais reais no ambiente acadêmico de demonstração.

## Limites das alternativas

Render Free não oferece disco persistente para SQLite; dados locais se perdem em reinícios/redeploys/suspensão. Fonte: https://render.com/docs/free .

Sites não foi publicado: a gratuidade anunciada termina em 31/12/2026. Não foi contratado plano de hospedagem.

Um túnel de desenvolvimento seria temporário, dependeria do computador ligado e não substituiria a publicação persistente.
