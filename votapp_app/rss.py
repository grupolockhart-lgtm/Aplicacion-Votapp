from fastapi import APIRouter
import feedparser
import os
import json
from datetime import datetime, timedelta
from typing import List

import cohere
from votapp_app import models
from votapp_app.database import SessionLocal
from googleapiclient.discovery import build
from .schemas import SurveyOut

router = APIRouter()

RSS_URL = "https://www.diariolibre.com/rss/portada.xml"

co = cohere.Client(os.getenv("COHERE_API_KEY"))

def resumir_con_cohere(texto: str) -> str:
    prompt = f"Resume en máximo 2 frases claras y neutrales:\n\n{texto}"
    response = co.chat(
        model="command-r-08-2024",
        message=prompt
    )
    return response.text.strip()

def generar_preguntas_con_cohere(titulo: str, resumen: str):
    prompt = f"""
    Genera exactamente 3 preguntas neutrales y claras en formato JSON,
    basadas únicamente en la siguiente noticia.

    Título: {titulo}
    Resumen: {resumen}

    Devuelve únicamente JSON válido, sin texto adicional, con este formato:
    [
      {{
        "text": "Pregunta 1",
        "options": [
          {{"text": "Opción A"}},
          {{"text": "Opción B"}}
        ]
      }},
      {{
        "text": "Pregunta 2",
        "options": [
          {{"text": "Opción A"}},
          {{"text": "Opción B"}}
        ]
      }},
      {{
        "text": "Pregunta 3",
        "options": [
          {{"text": "Opción A"}},
          {{"text": "Opción B"}}
        ]
      }}
    ]
    """

    response = co.chat(
        model="command-r-08-2024",
        message=prompt
    )

    preguntas_json = response.text
    try:
        preguntas = json.loads(preguntas_json)
        if not isinstance(preguntas, list):
            preguntas = [preguntas]
    except Exception as e:
        print("Error al parsear JSON:", e)
        preguntas = [
            {
                "text": f"¿Qué opinas de la noticia '{titulo}'?",
                "options": [
                    {"text": "Me interesa"},
                    {"text": "No me interesa"},
                    {"text": "Prefiero no opinar"}
                ]
            }
        ]
    return preguntas


@router.get("/rss/diariolibre", response_model=List[SurveyOut])
def obtener_encuestas_diariolibre():
    feed = feedparser.parse(RSS_URL)
    db = SessionLocal()
    encuestas = []

    for entry in feed.entries[:1]:
        titulo = entry.title
        resumen_original = getattr(entry, "summary", getattr(entry, "description", ""))
        resumen = resumir_con_cohere(resumen_original)

        preguntas = generar_preguntas_con_cohere(titulo, resumen)

        encuesta_existente = db.query(models.Survey).filter(models.Survey.source_url == entry.link).first()
        if encuesta_existente:
            print(f"Encuesta ya existente: {titulo}")
            continue

        imagen = None
        if hasattr(entry, "media_content") and entry.media_content:
            imagen = entry.media_content[0].get("url")
        elif hasattr(entry, "enclosures") and entry.enclosures:
            imagen = entry.enclosures[0].get("href")

        if not imagen:
            imagen = "https://mi-cdn.com/imagenes/placeholder.png"

        encuesta = models.Survey(
            title=titulo,
            description=resumen,
            media_url=imagen,
            media_urls=json.dumps([imagen]),
            fecha_expiracion=datetime.utcnow() + timedelta(days=7),
            patrocinada=False,
            patrocinador="Diario Libre Auto",
            recompensa_puntos=10,
            recompensa_dinero=0,
            presupuesto_total=100,
            visibilidad_resultados="publica",
            source_url=entry.link
        )

        db.add(encuesta)
        db.flush()

        for pregunta in preguntas:
            q = models.Question(text=pregunta["text"], survey=encuesta)
            db.add(q)
            for opcion in pregunta.get("options", []):
                db.add(models.Option(text=opcion["text"], question=q))

        encuestas.append({
            "id": encuesta.id,
            "title": titulo,
            "description": resumen,
            "fecha_expiracion": encuesta.fecha_expiracion,
            "questions": preguntas,
            "media_url": imagen,
            "media_urls": [imagen],
            "media_type": "native",   # 👈 nuevo campo
            "patrocinada": encuesta.patrocinada,
            "patrocinador": encuesta.patrocinador,
            "recompensa_puntos": encuesta.recompensa_puntos,
            "recompensa_dinero": encuesta.recompensa_dinero,
            "presupuesto_total": encuesta.presupuesto_total,
            "visibilidad_resultados": encuesta.visibilidad_resultados,
            "source_url": entry.link
        })

    db.commit()
    db.close()

    return encuestas

@router.get("/youtube/diariolibre", response_model=List[SurveyOut])
def obtener_encuestas_youtube():
    API_KEY = os.getenv("YOUTUBE_API_KEY")
    youtube = build("youtube", "v3", developerKey=API_KEY)

    search_response = youtube.search().list(
        part="snippet",
        q="Diario Libre Multimedios",
        type="channel",
        maxResults=1
    ).execute()

    channel_id = search_response["items"][0]["id"]["channelId"]

    channel_response = youtube.channels().list(
        part="contentDetails",
        id=channel_id
    ).execute()

    uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    videos_response = youtube.playlistItems().list(
        part="snippet",
        playlistId=uploads_playlist_id,
        maxResults=3
    ).execute()

    db = SessionLocal()
    encuestas = []

    for item in videos_response["items"]:
        titulo = item["snippet"]["title"]
        resumen_original = item["snippet"].get("description", titulo)
        resumen = resumir_con_cohere(resumen_original)

        preguntas = generar_preguntas_con_cohere(titulo, resumen)

        video_id = item["snippet"]["resourceId"]["videoId"]
        youtube_url = f"https://www.youtube.com/watch?v={video_id}"
        thumbnail_url = item["snippet"]["thumbnails"]["high"]["url"]

        encuesta_existente = db.query(models.Survey).filter(
            models.Survey.source_url == youtube_url
        ).first()
        if encuesta_existente:
            continue

        encuesta = models.Survey(
            title=titulo,
            description=resumen,
            media_url=youtube_url,                 # enlace al video
            media_urls=json.dumps([thumbnail_url]),# thumbnail como apoyo
            media_type="webview",                  # 👈 ahora sí se guarda en DB
            fecha_expiracion=datetime.utcnow() + timedelta(days=7),
            patrocinada=False,
            patrocinador="Diario Libre YouTube",
            recompensa_puntos=10,
            recompensa_dinero=0,
            presupuesto_total=100,
            visibilidad_resultados="publica",
            source_url=youtube_url
        )

        db.add(encuesta)
        db.flush()

        for pregunta in preguntas:
            q = models.Question(text=pregunta["text"], survey=encuesta)
            db.add(q)
            for opcion in pregunta.get("options", []):
                db.add(models.Option(text=opcion["text"], question=q))

        encuestas.append({
            "id": encuesta.id,
            "title": titulo,
            "description": resumen,
            "fecha_expiracion": encuesta.fecha_expiracion,
            "questions": preguntas,
            "media_url": youtube_url,
            "media_urls": [thumbnail_url],
            "media_type": "webview",               # 👈 clave para frontend
            "patrocinada": encuesta.patrocinada,
            "patrocinador": encuesta.patrocinador,
            "recompensa_puntos": encuesta.recompensa_puntos,
            "recompensa_dinero": encuesta.recompensa_dinero,
            "presupuesto_total": encuesta.presupuesto_total,
            "visibilidad_resultados": encuesta.visibilidad_resultados,
            "source_url": youtube_url
        })

    db.commit()
    db.close()

    return encuestas