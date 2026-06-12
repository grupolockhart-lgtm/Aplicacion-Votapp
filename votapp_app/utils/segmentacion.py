import json, logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("segmentacion")

def cumple_segmentacion(survey, usuario) -> bool:
    campos = {
        "sexo": survey.sexo,
        "ciudad": survey.ciudad,
        "ocupacion": survey.ocupacion,
        "profesion": survey.profesion,
        "nivel_educativo": survey.nivel_educativo,
        "religion": survey.religion,
        "nacionalidad": survey.nacionalidad,
        "estado_civil": survey.estado_civil,
    }
    for campo, valores in campos.items():
        lista = json.loads(valores) if valores else []
        valor_usuario = getattr(usuario, campo, "")

        # 👇 Log detallado
        logger.debug(f"[SEGMENTACION] campo={campo}, lista={lista}, usuario={valor_usuario}")

        if lista and valor_usuario not in lista:
            logger.info(f"[SEGMENTACION] ❌ Usuario NO cumple {campo}")
            return False

    logger.info("[SEGMENTACION] ✅ Usuario cumple todos los filtros")
    return True
