# Deploy na VPS (Hostinger) — guia

Deploy **manual** pelo GitHub Actions: você clica em **Run workflow** e o CI entra na VPS por SSH e
roda o `deploy.sh`, que atualiza o código e sobe tudo com Docker Compose + Caddy (HTTPS automático).

Arquitetura em produção: **Caddy** nas portas 80/443 faz HTTPS (Let's Encrypt) e roteia
`/api/*` para o backend e o resto para o frontend. Domínio único — front e API na mesma origem.

---

## 1. Gerar a chave SSH (no seu computador)

O GitHub Actions precisa entrar na VPS sem senha, usando uma chave dedicada ao deploy:

```sh
ssh-keygen -t ed25519 -C "deploy-fadeup" -f ~/.ssh/fadeup_deploy
```

Isso cria dois arquivos:
- `~/.ssh/fadeup_deploy`      → **chave privada** (vai no secret `VPS_SSH_KEY` do GitHub)
- `~/.ssh/fadeup_deploy.pub`  → **chave pública** (vai na VPS)

Não coloque passphrase (deixe em branco), senão o CI não consegue usar.

## 2. Autorizar a chave na VPS

Copie a **pública** para a VPS (troque `usuario` e `IP_DA_VPS`):

```sh
ssh-copy-id -i ~/.ssh/fadeup_deploy.pub usuario@IP_DA_VPS
# ou manualmente:
cat ~/.ssh/fadeup_deploy.pub | ssh usuario@IP_DA_VPS "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Teste: `ssh -i ~/.ssh/fadeup_deploy usuario@IP_DA_VPS` deve entrar sem pedir senha.

## 3. Preparar a VPS

Dentro da VPS (já tem Docker e Docker Compose):

```sh
sudo mkdir -p /opt/fadeup
sudo chown $USER:$USER /opt/fadeup
git clone https://github.com/SEU_USUARIO/SEU_REPO.git /opt/fadeup
```

Abra as portas 80 e 443 no firewall (se usar ufw):

```sh
sudo ufw allow 80
sudo ufw allow 443
```

MySQL: o deploy aponta para o MySQL **externo** via `host.docker.internal`. Garanta que o MySQL
da VPS escuta e aceita conexão do Docker, e que o database existe:

```sql
CREATE DATABASE IF NOT EXISTS fadeup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 4. Apontar o DNS (Hostinger)

No painel de DNS da Hostinger, crie um registro **A**:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ (ou o subdomínio) | IP_DA_VPS |

Espere propagar (alguns minutos). O Caddy só consegue emitir o certificado HTTPS depois que o
domínio resolver para o IP da VPS.

## 5. Cadastrar os secrets no GitHub

Repositório → **Settings → Secrets and variables → Actions → New repository secret**. Crie:

**Acesso à VPS**
- `VPS_HOST` — IP (ou domínio) da VPS
- `VPS_USER` — usuário SSH (ex.: `root` ou o seu usuário)
- `VPS_PORT` — porta SSH (geralmente `22`)
- `VPS_SSH_KEY` — conteúdo da **chave privada** (`~/.ssh/fadeup_deploy`, o arquivo inteiro)
- `APP_DIR` — caminho na VPS (ex.: `/opt/fadeup`)

**Aplicação / domínio**
- `DOMAIN` — seu domínio (ex.: `fadeup.com.br`)

**Banco (MySQL externo na VPS)**
- `USER_MYSQL_FADEUP`, `PASS_MYSQL_FADEUP`, `HOST_MYSQL_FADEUP` (use `host.docker.internal`),
  `PORT_MYSQL_FADEUP` (`3306`), `BASE_MYSQL_FADEUP` (`fadeup`)

**Autenticação**
- `JWT_SECRET` — segredo forte (32+ caracteres)
- `PASSWORD_PEPPER` — o pepper fixo das senhas
- `ACCESS_TOKEN_MINUTES` (`30`), `REFRESH_USER_HOURS` (`2`), `APP_REFRESH_DAYS` (`7`)
- `VITE_APP_CLIENT_ID` — ex.: `front-app`
- `VITE_APP_CLIENT_SECRET` — o client_secret **em texto puro** (o mesmo cujo SHA-256 está em `service_credentials`)

## 6. Inserir os dados de seed no banco (uma vez)

As tabelas são criadas pela migration (o `deploy.sh`/entrypoint roda `alembic upgrade head`), mas o
admin e a credencial da aplicação são inseridos à mão. Gere os hashes:

```sh
cd /opt/fadeup/project/backend
python tools/gerar_hash.py credencial front-app     # client_secret (puro p/ secret do GitHub) + hash SHA-256 p/ banco
python tools/gerar_hash.py senha "suaSenhaAdmin"    # hash bcrypt p/ users.password
```

Insira `type_documents`, `service_credentials`, `administrators` e `users` (ver
`documentacao/autenticacao.md`). Garanta que o `VITE_APP_CLIENT_SECRET` do GitHub corresponde ao
hash salvo em `service_credentials`.

## 7. Rodar o deploy (manual)

No GitHub: aba **Actions → Deploy (manual) → Run workflow** → escolha a branch (`main`) → **Run**.

O workflow conecta na VPS e executa o `deploy.sh`, que:
1. `git reset --hard origin/<branch>` (atualiza o código),
2. escreve o `.env` de produção a partir dos secrets,
3. `docker compose -f docker-compose.prod.yml up -d --build`,
4. aguarda o `/healthy_check` do backend (falha o deploy se não responder).

Acesse `https://SEU_DOMINIO` — o Caddy emite o certificado no primeiro acesso.

## Observações

- **Primeira emissão de HTTPS:** pode levar alguns segundos; se o DNS ainda não propagou, o Caddy
  tenta de novo automaticamente.
- **Trocar `VITE_APP_CLIENT_SECRET`:** como o front "queima" essa variável no build, uma mudança
  exige novo deploy (o `--build` refaz o bundle).
- **Logs:** na VPS, `docker compose -f docker-compose.prod.yml logs -f`.
