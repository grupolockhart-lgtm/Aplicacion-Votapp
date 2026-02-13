import json
from datetime import datetime, timedelta
from votapp_app import models
from votapp_app.database import SessionLocal
import logging

logger = logging.getLogger("uvicorn")  # usa el logger de Uvicorn

def generar_encuestas_desde_noticias(noticias):
    db = SessionLocal()
    encuestas_creadas = 0

    for noticia in noticias:
        titulo = noticia.get("titulo") or noticia.get("title") or "Encuesta automática"
        descripcion = noticia.get("descripcion") or noticia.get("description") or "Sin descripción disponible"
        imagen = noticia.get("urlToImage") or "https://mi-cdn.com/imagenes/placeholder.png"

        # 👇 Verificación de duplicados por título
        encuesta_existente = db.query(models.Survey).filter(models.Survey.source_url == noticia.get("url")).first()

        if encuesta_existente:
            logger.info(f"Encuesta ya existente (NewsAPI): {titulo}")
            continue

        encuesta = models.Survey(
            title=titulo,
            description=descripcion,
            media_url=imagen,
            media_urls=json.dumps([imagen]),
            fecha_expiracion=datetime.utcnow() + timedelta(days=7),
            patrocinada=True,
            patrocinador="NewsAPI Auto",
            recompensa_puntos=10,
            recompensa_dinero=0,
            presupuesto_total=100,
            visibilidad_resultados="publica",
            source_url=noticia.get("url")  # 👈 nuevo campo

        )

        pregunta = models.Question(
            text=f"¿Qué opinas de esta noticia sobre {titulo}?",
            survey=encuesta
        )

        opcion1 = models.Option(text="Me interesa", question=pregunta)
        opcion2 = models.Option(text="No me interesa", question=pregunta)
        opcion3 = models.Option(text="Prefiero no opinar", question=pregunta)

        db.add(encuesta)
        db.add(pregunta)
        db.add_all([opcion1, opcion2, opcion3])

        encuestas_creadas += 1

    db.commit()
    db.close()

    # 👇 log final resumido
    logger.info(f"{encuestas_creadas} encuestas nuevas creadas automáticamente desde NewsAPI")









