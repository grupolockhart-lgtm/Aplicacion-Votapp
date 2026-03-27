

import json

def safe_json_list(value):
    """
    Convierte un campo de texto JSON en lista de strings.
    Si el valor es None, vacío o inválido, devuelve lista vacía.
    """
    if not value:
        return []
    try:
        data = json.loads(value)
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []

