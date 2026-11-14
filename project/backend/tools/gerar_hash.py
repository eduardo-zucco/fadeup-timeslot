"""Utilitário de seed manual do fadeUp.

Gera os valores hasheados para inserir à mão no banco:
  - hash bcrypt (com pepper) de uma senha de usuário admin;
  - par client_id/client_secret + hash SHA-256 para a aplicação (front).

Uso:
  python tools/gerar_hash.py senha "minhaSenhaForte"     # hash de senha
  python tools/gerar_hash.py credencial                   # gera client_id/secret
  python tools/gerar_hash.py credencial meu-client-id     # usa um client_id informado

Requer as variáveis de ambiente (ou .env) carregadas — em especial PASSWORD_PEPPER.
Rode a partir da raiz do backend (project/backend).
"""
import os
import secrets
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.hashing_service import hash_client_secret, hash_password


def gerar_senha(plain: str) -> None:
    print("hash bcrypt (coluna users.password):")
    print(hash_password(plain))


def gerar_credencial(client_id: str | None) -> None:
    client_id = client_id or f"app-{secrets.token_hex(6)}"
    client_secret = secrets.token_urlsafe(32)
    secret_hash = hash_client_secret(client_secret)
    print("Guarde o client_secret em texto puro (o front vai usá-lo); o banco guarda só o hash.\n")
    print(f"client_id:            {client_id}")
    print(f"client_secret (puro): {client_secret}")
    print(f"client_secret (hash): {secret_hash}\n")
    print("SQL de exemplo:")
    print(
        "INSERT INTO service_credentials (client_id, client_secret, active) "
        f"VALUES ('{client_id}', '{secret_hash}', 1);"
    )


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    comando = sys.argv[1]
    if comando == "senha":
        if len(sys.argv) < 3:
            print("Informe a senha: python tools/gerar_hash.py senha \"minhaSenha\"")
            sys.exit(1)
        gerar_senha(sys.argv[2])
    elif comando == "credencial":
        gerar_credencial(sys.argv[2] if len(sys.argv) > 2 else None)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
