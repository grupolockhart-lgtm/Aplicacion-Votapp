import json

def safe_json_list(value):
    """
    Convierte un campo JSON en lista.
    Acepta string JSON, lista o dict. Devuelve [] si es inválido.
    """
    try:
        if isinstance(value, str):
            data = json.loads(value or "[]")
        elif isinstance(value, (list, dict)):
            data = value
        else:
            return []
        return data if isinstance(data, list) else []
    except Exception:
        return []

