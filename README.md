# fadeUp — TimeSlot

Agendamento para uma unidade e um profissional. O sistema tem duas partes independentes:

- **Backend** (`project/backend`): API em Python (FastAPI) com MySQL via SQLAlchemy.
- **Frontend** (`project/frontend`): aplicação React (TypeScript, Vite, Tailwind e SCSS).

## Estrutura

```text
fadeup/
├── project/
│   ├── backend/       # API Python (FastAPI + SQLAlchemy/MySQL)
│   └── frontend/      # App React (TypeScript + Vite + Tailwind + SCSS)
├── banco/             # Esquema SQL e histórico de migrações (referência)
├── documentacao/      # Relatórios, evidências e contrato da API
└── ferramentas/       # Utilitários (gerar-relatorio.py)
```

O cliente usa `/` (Agendar e Meus horários). A administração usa `/admin` e exige uma chave
privada com pelo menos 24 caracteres.

## Backend (API Python)

Requisitos: Python 3.11+ e um MySQL acessível.

```sh
cd project/backend
pip install -r requirements.txt
cp .env.example .env     # preencha as credenciais do MySQL, JWT_SECRET e PASSWORD_PEPPER
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Variáveis em `.env`:

- `USER_MYSQL_FADEUP`, `PASS_MYSQL_FADEUP`, `HOST_MYSQL_FADEUP`, `PORT_MYSQL_FADEUP`, `BASE_MYSQL_FADEUP`
- `JWT_SECRET` — segredo de assinatura dos tokens (HS256).
- `PASSWORD_PEPPER` — pepper fixo concatenado à senha antes do bcrypt.
- `ACCESS_TOKEN_MINUTES` (30), `REFRESH_USER_HOURS` (2), `APP_REFRESH_DAYS` (7).
- `FRONT_ORIGINS` — origens do frontend autorizadas por CORS (separadas por vírgula).

### Autenticação

As rotas são protegidas por **JWT em duas camadas** (ver `documentacao/autenticacao.md`):

- O front se autentica como **aplicação** (`client_id`/`client_secret`) → token de aplicação.
- O **admin** loga com **email + senha** → token de usuário. Rotas `/api/admin/*` exigem as duas camadas.

O admin é inserido **à mão** no banco. Para gerar os valores hasheados:

```sh
cd project/backend
python tools/gerar_hash.py senha "minhaSenhaForte"   # hash bcrypt (users.password)
python tools/gerar_hash.py credencial front-app       # client_id/secret + hash (service_credentials)
```

O esquema das tabelas é versionado por **Alembic** (ver seção Migrations); os modelos ORM estão em
`project/backend/app/entities/mysql/` (`models.py` e `auth_models.py`).

Testes do backend:

```sh
cd project/backend
pip install -r requirements.txt
pytest
```

Os testes usam SQLite assíncrono (aiosqlite) como armazenamento, exercitando o mesmo código de
repositório SQLAlchemy sem exigir um MySQL em execução.

## Frontend (React)

Requisitos: Node.js 24.

```sh
cd project/frontend
cp .env.example .env      # VITE_API_BASE + VITE_APP_CLIENT_ID + VITE_APP_CLIENT_SECRET
npm install
npm run dev               # desenvolvimento em http://127.0.0.1:5173
```

Build de produção:

```sh
npm run build             # gera dist/
npm run preview           # serve o build localmente
```

- Cliente: `/`
- Administração: `/admin`

A base da API é lida de `VITE_API_BASE` em tempo de build/dev. O frontend é estático: qualquer
servidor de arquivos (ou `npm run preview`) serve o conteúdo de `dist/`.

## Docker (backend + frontend)

O `docker-compose.yml` sobe dois serviços — `backend` (FastAPI na porta 8000) e `frontend`
(build do Vite servido por nginx na porta 8080). O **MySQL é externo** (não faz parte do compose):
aponte para um banco já existente pelas variáveis de ambiente.

```sh
cp .env.example .env     # ajuste MySQL, JWT_SECRET, PASSWORD_PEPPER, VITE_* e FRONT_ORIGINS
docker compose up --build
```

- Cliente: http://localhost:8080
- API: http://localhost:8000

Variáveis do `.env` (raiz):

- `USER_MYSQL_FADEUP`, `PASS_MYSQL_FADEUP`, `HOST_MYSQL_FADEUP`, `PORT_MYSQL_FADEUP`, `BASE_MYSQL_FADEUP`
  — conexão com o MySQL externo. Para um MySQL rodando no host, use `HOST_MYSQL_FADEUP=host.docker.internal`.
- `JWT_SECRET`, `PASSWORD_PEPPER`, `ACCESS_TOKEN_MINUTES`, `REFRESH_USER_HOURS`, `APP_REFRESH_DAYS` — autenticação JWT.
- `VITE_API_BASE` — URL **pública** da API usada no build do frontend (ex.: `http://localhost:8000`).
- `VITE_APP_CLIENT_ID`, `VITE_APP_CLIENT_SECRET` — credenciais da aplicação (front), correspondentes a um
  registro em `service_credentials`.
- `FRONT_ORIGINS` — origem do frontend autorizada por CORS no backend (ex.: `http://localhost:8080`).

Como o frontend e a API ficam em origens diferentes, o `VITE_API_BASE` é aplicado em **build time**
(troque-o para o endereço real da API antes de buildar em produção) e o backend libera essa origem
via CORS (`FRONT_ORIGINS`).

## Migrations (Alembic)

O esquema do banco é versionado com **Alembic** (migrations do SQLAlchemy), em
`project/backend/migrations`. A migration inicial cria as tabelas `settings`, `bookings`,
`occupancy` (chave primária composta `date, minute`) e `outbox`.

No Docker, o `entrypoint.sh` do backend executa `alembic upgrade head` automaticamente a cada
start (aguardando o MySQL ficar disponível) antes de iniciar o uvicorn. Para rodar manualmente:

```sh
cd project/backend
alembic upgrade head        # aplica as migrations pendentes
alembic revision -m "msg"   # cria uma nova migration ao evoluir os modelos
```

As credenciais vêm das mesmas variáveis `*_MYSQL_FADEUP` do `.env`.

## Contrato da API

As rotas (pública e de operador), modelos e códigos de status estão descritos em
[`documentacao/api-python.md`](documentacao/api-python.md).

## Equipe

Lucas Castilho (PO), Eduardo Zucco (SM), Felipe Pereira e Fausto Iriu.
