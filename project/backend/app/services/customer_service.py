import re

from app.services.errors import ValidationError

_PHONE_RE = re.compile(r"^(?:55)?\d{10,11}$")


def customer(body: dict) -> dict:
    name = body.get("name").strip() if isinstance(body.get("name"), str) else ""
    phone_raw = body.get("phone") if isinstance(body.get("phone"), str) else ""
    phone = re.sub(r"\D", "", phone_raw)
    errors: dict[str, str] = {}
    if len(name) < 2 or len(name) > 80:
        errors["name"] = "Informe seu nome, entre 2 e 80 caracteres."
    if not _PHONE_RE.match(phone):
        errors["phone"] = "Informe um telefone com DDD, por exemplo (14) 99999-9999."
    if body.get("consent") is not True:
        errors["consent"] = "Autorize o uso dos dados para administrar a reserva."
    if errors:
        raise ValidationError("Confira os campos destacados.", errors)
    return {"name": name, "phone": phone}
