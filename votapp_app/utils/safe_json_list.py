
# votapp_app/utils/safe_json_list.py

import json

def safe_json_list(value):
    """
    Convierte un string JSON o lista en lista de forma segura.
    - Si el valor es None o vacío, devuelve [].
    - Si ya es lista, la devuelve tal cual.
    - Si es string JSON válido, lo convierte.
    - Si está malformado, devuelve [].
    """
    if not value:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return []
    return []

