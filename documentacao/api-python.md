# API fadeUp em Python — contrato para o front existente

> **Atualização (autenticação):** a API usa **JWT de 2 camadas** (não mais `X-Admin-Key`).
> Veja a seção 0 abaixo. As menções a `X-Admin-Key` no restante do documento são históricas.

## 0. Autenticação (JWT, 2 camadas)

Duas camadas de autenticação, ambas com JWT **HS256** (segredo em `JWT_SECRET`):

1. **Aplicação (front → API).** O front troca `client_id` + `client_secret` por um JWT de aplicação.
   - `POST /api/auth/app-token` — corpo `{ "client_id", "client_secret" }` → `{ access_token, refresh_token }`.
     O `client_secret` é conferido por SHA-256 contra `service_credentials`; `active = 0` bloqueia o `client_id`.
   - `POST /api/auth/app-refresh` — corpo `{ "refresh_token" }` → novo par (refresh de aplicação, 7 dias).
2. **Usuário admin.** Com o JWT de aplicação, o admin loga com email/senha.
   - `POST /api/auth/login` — corpo `{ "email", "password" }` → `{ access_token, refresh_token, userId }`.
     Senha validada por **bcrypt + pepper** (`PASSWORD_PEPPER`) contra `users`.
   - `POST /api/auth/refresh` — corpo `{ "refresh_token" }` → **novo par** (rotação). Refresh de usuário é
     stateless, expira em **2h**; expirou, faz login de novo. Access expira em **30 min**.

### Como enviar os tokens
- **Rotas públicas** (`/api/config`, `/api/slots`, `/api/bookings...`): `Authorization: Bearer <app_token>`.
- **Rotas admin** (`/api/admin/*`): `Authorization: Bearer <user_token>` **e** `X-App-Token: <app_token>`.
- Rotas `/api/auth/*` são abertas. Falha de autenticação → **401** com `{ "error": "..." }`.
- No Swagger (`/docs`) as rotas protegidas exibem o cadeado (schemes `HTTPBearer` e `APIKeyHeader`).

### Variáveis de ambiente (backend)
`JWT_SECRET`, `PASSWORD_PEPPER`, `ACCESS_TOKEN_MINUTES` (30), `REFRESH_USER_HOURS` (2), `APP_REFRESH_DAYS` (7).

### Variáveis do front
`VITE_API_BASE`, `VITE_APP_CLIENT_ID`, `VITE_APP_CLIENT_SECRET`. O `client_secret` fica embutido no
bundle (inevitável em SPA); a segurança real do admin é o login de usuário.

---

Este documento descreve a API que o front **atual** (HTML/CSS/JS em `aplicacao/interface`) já espera.
Qualquer backend em Python que implemente exatamente este contrato funciona sem tocar no front.

A referência é o backend Node atual (`aplicacao/servidor`). O objetivo é reproduzir o mesmo comportamento.

---

## 1. Como o front conversa com a API hoje

- O front chama sempre caminhos relativos: `fetch('/api/' + path)` (ver `assets/js/shared/api.js`).
- Toda chamada envia `Content-Type: application/json`.
- Rotas de operador começam com `admin/` no front e viram `/api/admin/...`. Para essas, o front
  adiciona o header `X-Admin-Key` com a chave administrativa.
- Rotas de reserva por link enviam o header `X-Booking-Token` com o token da reserva.
- O front espera **sempre JSON de volta**, inclusive em erro. Se não vier JSON, ele mostra
  "A agenda não respondeu como esperado".
- Em erro, o front lê `data.error` (mensagem) e, quando existir, `data.fields` (erros por campo).
- O status HTTP importa: o front trata `403`, `409` e `400` (com `fields`) de formas diferentes.

### Mesma origem é obrigatório (CSP)
O HTML é servido com `Content-Security-Policy: ... connect-src 'self' ...`. O navegador só deixa o
front chamar a API **na mesma origem**. Então a API Python precisa responder sob o mesmo host/porta
que serve o front, OU você ajusta o CSP e habilita CORS. Ver seção 7 (arquitetura).

---

## 2. Convenções gerais

| Item | Regra |
|------|-------|
| Base | `/api` |
| Formato | JSON em corpo e resposta |
| Headers de resposta | `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` |
| Corpo de erro | `{ "error": "mensagem em pt-BR" }` e opcional `{ "fields": { "campo": "msg" } }` |
| Limite de corpo | 16 KB. Acima disso, responder `413` |
| Origin em escrita | Em `POST/PUT/PATCH/DELETE`, se vier header `Origin` diferente da origem, responder `403` |
| Autenticação operador | Header `X-Admin-Key`, comparação em tempo constante, exige **>= 24 caracteres** |
| Fuso | Todos os horários são America/Sao_Paulo (-03:00) |

### Representação de tempo
- `start` e minutos são **inteiros = minutos desde a meia-noite**. Ex.: `540` = 09:00, `1080` = 18:00.
- `date` é string `YYYY-MM-DD`.
- `price` e `duration`: `price` em **centavos** (inteiro), `duration` em **minutos**.

---

## 3. Modelos

### Config (configuração do negócio)
```json
{
  "name": "fadeUp Barbearia",
  "open": 540,
  "close": 1080,
  "interval": 0,
  "days": [1, 2, 3, 4, 5, 6],
  "services": [
    { "id": "corte", "name": "Corte", "price": 4000, "duration": 30 },
    { "id": "barba", "name": "Barba", "price": 3000, "duration": 30 },
    { "id": "combo", "name": "Corte + barba", "price": 6500, "duration": 60 }
  ]
}
```
Regras de validação do config (reproduzir de `domain/config.mjs`):
- `name`: string, 2 a 80 caracteres.
- `open`/`close`: inteiros, múltiplos de 15, `0 <= open`, `close <= 1440`, `close > open`.
- `interval`: um de `[0, 15, 30]`.
- `days`: array não vazio de inteiros de 0 (domingo) a 6 (sábado).
- `services`: 1 a 20 itens; `id` casa `^[a-z0-9-]{1,30}$` e é único; `name` 2 a 80;
  `price` inteiro 0 a 1.000.000; `duration` um de `[15,30,45,60,75,90,120]`.

### Booking (reserva)
Retornado em criação/consulta (o `token` **nunca** aparece em `GET` de reserva nem na agenda):
```json
{
  "id": "uuid",
  "name": "Cliente",
  "phone": "5514999999999",
  "service": "Corte",
  "price": 4000,
  "duration": 30,
  "date": "2026-11-20",
  "start": 540,
  "status": "confirmed",
  "kind": "appointment"
}
```
- `status`: `confirmed` ou `cancelled`.
- `kind`: `appointment` (cliente) ou `block` (bloqueio feito pelo operador).
- Na **criação** (`POST /api/bookings`), a resposta inclui o `token` (string de 72 hex),
  para o cliente guardar o link de gerenciamento. Nas demais respostas, o token é omitido.

---

## 4. Rotas públicas (cliente)

### `GET /api/config`
Retorna o Config. Usado na inicialização das duas páginas.
- 200 → objeto Config.

### `GET /api/slots?date=YYYY-MM-DD&service=<id>`
Lista horários livres para um serviço numa data.
- Query: `date` (obrigatório), `service` (id de serviço do config).
- A duração vem do serviço escolhido.
- 200 → `{ "slots": [540, 555, 570, ...] }` (inteiros de minutos).
- 400 → data fora da janela (hoje até +90 dias) ou serviço inválido.

### `POST /api/bookings`
Cria uma reserva de cliente.
- Corpo:
  ```json
  { "service": "corte", "date": "2026-11-20", "start": 540,
    "name": "Cliente", "phone": "(14) 99999-9999", "consent": true }
  ```
- Validação do cliente (`domain/customer.mjs`):
  - `name`: 2 a 80 caracteres.
  - `phone`: só dígitos após limpar; casa `^(?:55)?\d{10,11}$`.
  - `consent`: precisa ser `true`.
  - Em falha → `400` com `fields` por campo: `{ "error": "Confira os campos destacados.", "fields": { "phone": "..." } }`.
- 201 → Booking **com** `token`.
- 409 → "Esse horário não está mais disponível. Escolha outro." (slot ocupado/condição de corrida).

### `GET /api/bookings/{id}`  (header `X-Booking-Token`)
Consulta uma reserva pelo link de gerenciamento.
- 200 → Booking (sem token).
- 404 → "Reserva não encontrada ou link inválido." (id inexistente ou token errado).

### `GET /api/bookings/{id}/slots?date=YYYY-MM-DD`  (header `X-Booking-Token`)
Horários livres para **reagendar** esta reserva (mantém a duração original; inclui o próprio horário atual como livre).
- 200 → `{ "slots": [...] }`.
- 404 → reserva/link inválido.
- 409 → "Esta reserva já foi cancelada. Atualize seus horários." (reserva não confirmada).

### `PATCH /api/bookings/{id}`  (header `X-Booking-Token`)
Reagenda a reserva.
- Corpo: `{ "date": "2026-11-21", "start": 600 }`.
- Regras: reserva precisa estar `confirmed`; cliente não pode mexer em atendimento que já começou
  (→ `409` "Este atendimento já começou. Fale com a barbearia."); novo horário precisa estar livre
  (→ `409` "Esse horário não está mais disponível. Escolha outro.").
- 200 → `{ "ok": true }`.

### `DELETE /api/bookings/{id}`  (header `X-Booking-Token`)
Cancela a reserva.
- Mesmas regras de "já começou" para o cliente.
- 200 → `{ "ok": true }`.
- 409 → reserva já cancelada, ou atendimento já começou.

---

## 5. Rotas de operador (prefixo `/api/admin`, header `X-Admin-Key`)

Se a chave estiver ausente ou inválida (ou com menos de 24 caracteres configurados no servidor),
**toda** rota `admin` responde `403` "Entre no painel para realizar esta operação."
O front reage ao `403` limpando a sessão e voltando à tela de login.

### `GET /api/admin/session`
Verifica se a chave é válida (usado no login e na reabertura da página).
- 200 → `{ "authenticated": true }`.
- 403 → chave inválida.

### `PUT /api/admin/config`
Salva a configuração do negócio.
- Corpo: objeto Config (validado como na seção 3).
- 200 → `{ "ok": true }`.
- 400 → config inválido.

### `GET /api/admin/agenda?date=YYYY-MM-DD&end=YYYY-MM-DD`
Lista as reservas do período (inclui bloqueios e cancelados; o front filtra na tela).
- `end` opcional; se ausente, usa `date`. Período máximo de 31 dias.
- 200 → `{ "records": [ Booking, ... ] }` ordenado por data e início, **sem token**.
- 400 → período inválido/maior que 31 dias.

### `GET /api/admin/slots?date=YYYY-MM-DD&duration=<minutos>`
Horários livres para uma duração arbitrária (usado no formulário de bloqueio e encaixe manual).
- `duration` precisa ser um de `[15,30,45,60,75,90,120]`.
- 200 → `{ "slots": [...] }`.
- 400 → duração inválida ou data fora da janela.

### `POST /api/admin/bookings`
Cria encaixe manual **ou** bloqueio.
- Encaixe manual (atendimento): mesmo corpo de `POST /api/bookings`.
- Bloqueio:
  ```json
  { "kind": "block", "name": "Almoço", "date": "2026-11-20", "start": 720, "duration": 60 }
  ```
  - `name` do bloqueio: 2 a 80 caracteres (é o motivo).
- 201 → Booking (bloqueio tem `kind: "block"`, `phone: ""`, `price: 0`).
- 409 → horário ocupado.

### `DELETE /api/admin/bookings/{id}`
Cancela atendimento ou libera bloqueio (operador, sem a regra de "já começou").
- 200 → `{ "ok": true }`.

---

## 6. Códigos de status que o front trata explicitamente

| Status | Significado | Reação do front |
|--------|-------------|-----------------|
| 400 | Validação. Pode vir `fields` | Marca campos inválidos no formulário |
| 403 | Operador não autenticado / origin inválido | Limpa sessão admin e volta ao login |
| 404 | Reserva/link inválido ou rota inexistente | Mostra mensagem de erro |
| 409 | Conflito (horário ocupado, reserva cancelada, já começou) | Recarrega horários / volta etapa |
| 413 | Corpo acima de 16 KB | — |
| 500/503 | Erro interno / agenda indisponível | Mostra erro genérico |

---

## 7. Arquitetura recomendada para a versão Python

O front depende de **mesma origem** (CSP `connect-src 'self'`) e de arquivos estáticos servidos
no mesmo host. Duas formas de encaixar o Python:

### Opção A (recomendada): FastAPI servindo API + estáticos
Um único serviço Python que:
1. Expõe `/api/*` com as rotas acima.
2. Serve os arquivos de `aplicacao/interface` como estáticos, mantendo os mesmos cabeçalhos de
   segurança (CSP, `X-Content-Type-Options`), e mapeando `/` → `index.html`, `/admin` → `admin.html`.

Vantagem: nada muda no front. Mesma origem, CSP intacto.

Stack sugerida (sem fugir do espírito "sem dependências pesadas" do projeto):
- **FastAPI + Uvicorn** (ou **Flask**), SQLite via `sqlite3` da stdlib.
- Pydantic para validar os corpos (espelhando `domain/config.mjs` e `domain/customer.mjs`).

Esqueleto de rotas:
```python
from fastapi import FastAPI, Header, Request, Response
app = FastAPI()

@app.get("/api/config")              # público
@app.get("/api/slots")               # público  ?date&service
@app.post("/api/bookings")           # público
@app.get("/api/bookings/{id}")       # X-Booking-Token
@app.get("/api/bookings/{id}/slots") # X-Booking-Token  ?date
@app.patch("/api/bookings/{id}")     # X-Booking-Token
@app.delete("/api/bookings/{id}")    # X-Booking-Token

@app.get("/api/admin/session")       # X-Admin-Key
@app.put("/api/admin/config")        # X-Admin-Key
@app.get("/api/admin/agenda")        # X-Admin-Key  ?date&end
@app.get("/api/admin/slots")         # X-Admin-Key  ?date&duration
@app.post("/api/admin/bookings")     # X-Admin-Key
@app.delete("/api/admin/bookings/{id}")  # X-Admin-Key

# estáticos de aplicacao/interface, com / e /admin mapeados
```

### Opção B: API Python separada + front em outro host
Se a API Python rodar em outra origem (ex.: `api.fadeup...`), é preciso:
- Habilitar **CORS** na API para a origem do front.
- Ajustar o CSP do front para incluir a origem da API em `connect-src`.
- Trocar a base de `fetch('/api/...')` no front para a URL absoluta da API (`assets/js/shared/api.js`).

Mais peças móveis e mais superfície de erro. Só vale se houver motivo de deploy para separar.

---

## 8. Estrutura de pastas sugerida (migração para Python)

```text
fadeup/
├── aplicacao/
│   ├── interface/            # front atual, intacto
│   └── api/                  # NOVO: backend Python
│       ├── main.py           # app FastAPI + montagem de estáticos
│       ├── rotas/            # bookings.py, admin.py, config.py
│       ├── dominio/          # scheduling.py, customer.py, config.py (regras puras)
│       ├── repositorio/      # agenda_repository.py (SQLite)
│       └── infra/            # conexão sqlite, segurança (CSP, compare-digest)
├── banco/                    # esquema.sql e migrações (reaproveitados)
├── testes/                   # testes em pytest espelhando testes/*.test.mjs
├── pyproject.toml            # deps: fastapi, uvicorn (sqlite3 é stdlib)
└── README.md
```

Reaproveite `banco/esquema.sql` como está: os triggers garantem a consistência de ocupação dentro
da transação, o que a lógica Python só precisa respeitar (inserir em `occupancy` dentro da mesma
transação da `bookings`).

---

## 9. Checklist de paridade (para saber que a API Python está "pronta")

- [ ] `GET /api/config` devolve o config padrão quando não há config salvo.
- [ ] Slots respeitam dia da semana, janela de 90 dias e não oferecem horário no passado.
- [ ] `POST /api/bookings` valida nome/telefone/consent e devolve `fields` em erro.
- [ ] Reserva criada retorna `token`; consultas e agenda **não** retornam `token`.
- [ ] Reagendar/cancelar exige token do cliente e barra atendimento já iniciado.
- [ ] Toda rota `admin` exige `X-Admin-Key` válido (>= 24 chars), com comparação em tempo constante.
- [ ] Criação concorrente no mesmo horário resulta em exatamente uma reserva (a outra recebe 409).
- [ ] Erros sempre em JSON com `error` em pt-BR.
```