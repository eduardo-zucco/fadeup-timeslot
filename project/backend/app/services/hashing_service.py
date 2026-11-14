import hashlib
import hmac

import bcrypt

from config import get_environment_variables

_env = get_environment_variables()


def hash_password(plain: str) -> str:
    salted = (plain + _env.PASSWORD_PEPPER).encode("utf-8")
    return bcrypt.hashpw(salted, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    salted = (plain + _env.PASSWORD_PEPPER).encode("utf-8")
    try:
        return bcrypt.checkpw(salted, hashed.encode("utf-8"))
    except ValueError:
        return False


def hash_client_secret(plain: str) -> str:
    return hashlib.sha256(plain.encode("utf-8")).hexdigest()


def verify_client_secret(plain: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_client_secret(plain), hashed)
