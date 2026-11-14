# Autenticação fadeUp — decisões e referência

> Documento interno. **Não** versione segredos reais aqui; valores sensíveis ficam no `.env`.

## Pepper de senha (NÃO PERDER)

As senhas de usuário são hasheadas com **bcrypt** sobre `senha + PASSWORD_PEPPER`.

- `PASSWORD_PEPPER = KANVOASJO1239BLAS01238995N`
- Guardado em `project/backend/.env` como `PASSWORD_PEPPER`.
- Fórmula: `bcrypt.hashpw((senha + PASSWORD_PEPPER).encode(), bcrypt.gensalt())`
- Verificação: `bcrypt.checkpw((senha + PASSWORD_PEPPER).encode(), hash_armazenado)`

Se o pepper mudar, todas as senhas existentes param de validar (é um segredo fixo do servidor).

## Fluxo de autenticação (2 camadas)

1. **Aplicação (front → API):** front envia `client_id` + `client_secret`; API confere o
   `client_secret` (SHA-256) contra `service_credentials` e devolve um **access JWT de aplicação**
   (30 min) + **refresh** (7 dias, guardado em `service_credentials`, revogável via `active=0`).
2. **Usuário (admin):** com o JWT de aplicação válido, o front envia **email + senha**; a API valida
   em `users` (bcrypt + pepper) e devolve **access JWT de usuário** (30 min, com `userId`) +
   **refresh JWT de usuário** (2h, **stateless/sem tabela**). No refresh, a API devolve um **novo
   access + novo refresh** (rotação); se o refresh de 2h expirou, o admin faz login de novo.

- **Rotas públicas** (config, slots, bookings do cliente): exigem **JWT de aplicação**.
- **Rotas admin**: exigem **JWT de aplicação + Bearer do usuário**.
- JWT: algoritmo **HS256**, segredo em `JWT_SECRET` (`.env`).

## Tabelas

- `type_documents`: `id`, `name` (1=CPF, 2=CNPJ, ...)
- `administrators`: `id`, `active` (soft delete), `name`, `mobile_number`, `type_document_id` (FK),
  `document_number` (dados crus, sem formatação)
- `users`: `id`, `active` (soft delete), `administrator_id` (FK), `email`, `password` (bcrypt+pepper),
  `created_at`, `updated_at`
- `service_credentials`: `id`, `client_id`, `client_secret` (SHA-256), `refresh_token`,
  `expire_at`, `active` (0 = client_id bloqueado)

O refresh do **usuário admin** é um JWT stateless (2h), **sem tabela**.

## Seed (manual)

O admin é inserido **à mão** no banco. Para gerar os valores hasheados use
`python tools/gerar_hash.py` (gera hash bcrypt de uma senha e um par client_id/secret + hash SHA-256).

## .env (novas variáveis)

```
JWT_SECRET=troque-por-um-segredo-forte
PASSWORD_PEPPER=KANVOASJO1239BLAS01238995N
ACCESS_TOKEN_MINUTES=30
REFRESH_USER_HOURS=2
APP_REFRESH_DAYS=7
```
