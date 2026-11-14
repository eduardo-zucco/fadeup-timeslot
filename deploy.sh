#!/usr/bin/env bash
# Deploy do fadeUp na VPS. Executado via SSH pelo GitHub Actions (workflow manual).
# Espera que as variáveis de ambiente de produção já estejam exportadas (vindas dos secrets).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/fadeup}"
BRANCH="${DEPLOY_BRANCH:-main}"
COMPOSE_FILE="docker-compose.prod.yml"

echo "==> Deploy em ${APP_DIR} (branch ${BRANCH})"
cd "${APP_DIR}"

echo "==> Atualizando o código"
git fetch --all --prune
git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"

echo "==> Escrevendo .env de produção"
cat > .env <<EOF
USER_MYSQL_FADEUP=${USER_MYSQL_FADEUP}
PASS_MYSQL_FADEUP=${PASS_MYSQL_FADEUP}
HOST_MYSQL_FADEUP=${HOST_MYSQL_FADEUP}
PORT_MYSQL_FADEUP=${PORT_MYSQL_FADEUP:-3306}
BASE_MYSQL_FADEUP=${BASE_MYSQL_FADEUP}
JWT_SECRET=${JWT_SECRET}
PASSWORD_PEPPER=${PASSWORD_PEPPER}
ACCESS_TOKEN_MINUTES=${ACCESS_TOKEN_MINUTES:-30}
REFRESH_USER_HOURS=${REFRESH_USER_HOURS:-2}
APP_REFRESH_DAYS=${APP_REFRESH_DAYS:-7}
DOMAIN=${DOMAIN}
FRONT_ORIGINS=https://${DOMAIN}
VITE_API_BASE=
VITE_APP_CLIENT_ID=${VITE_APP_CLIENT_ID}
VITE_APP_CLIENT_SECRET=${VITE_APP_CLIENT_SECRET}
EOF
chmod 600 .env

echo "==> Subindo containers (build + up)"
docker compose -f "${COMPOSE_FILE}" up -d --build --remove-orphans

echo "==> Aguardando health check do backend"
ok=0
for i in $(seq 1 20); do
	if docker compose -f "${COMPOSE_FILE}" exec -T backend python -c "import urllib.request,sys; sys.exit(0) if urllib.request.urlopen('http://localhost:8000/healthy_check').status==200 else sys.exit(1)" 2>/dev/null; then
		ok=1
		echo "    backend respondeu ao health check (tentativa ${i})"
		break
	fi
	echo "    aguardando backend subir... (${i}/20)"
	sleep 3
done

if [ "${ok}" -ne 1 ]; then
	echo "!! Health check falhou. Últimos logs do backend:"
	docker compose -f "${COMPOSE_FILE}" logs --tail=40 backend
	exit 1
fi

echo "==> Limpando imagens antigas"
docker image prune -f >/dev/null 2>&1 || true

echo "==> Deploy concluído com sucesso."
docker compose -f "${COMPOSE_FILE}" ps
