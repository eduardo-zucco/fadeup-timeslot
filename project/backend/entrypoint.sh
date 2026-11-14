#!/bin/sh
set -e

echo "Aguardando o MySQL e aplicando migrations..."
attempt=0
max_attempts="${MIGRATE_MAX_ATTEMPTS:-30}"
until alembic upgrade head; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "MySQL indisponível após ${max_attempts} tentativas. Abortando."
    exit 1
  fi
  echo "MySQL ainda não respondeu (tentativa ${attempt}/${max_attempts}). Aguardando 2s..."
  sleep 2
done

echo "Migrations aplicadas. Iniciando API na porta ${PORT:-8000}..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}" --no-access-log
