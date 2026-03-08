

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Survey
from ..schemas import SurveyCreate, SurveyVote



router = APIRouter(prefix="/surveys/simple", tags=["Surveys Simple"])

# -------------------
# Crear encuesta simple con multimedia
# -------------------
@router.post("/")
def crear_encuesta_simple(survey: SurveyCreate, db: Session = Depends(get_db)):
    nueva = Survey(
        titulo=survey.titulo,
        opciones=survey.opciones,
        tipo="simple",
        imagenes=survey.imagenes,
        videos=survey.videos
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

# -------------------
# Votar en encuesta simple
# -------------------
@router.post("/{survey_id}/vote")
def votar_simple(survey_id: int, voto: SurveyVote, db: Session = Depends(get_db)):
    encuesta = db.query(Survey).filter(Survey.id == survey_id, Survey.tipo == "simple").first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    # Actualizar conteo de votos en opciones
    opciones = encuesta.opciones
    if voto.opcion not in [opt["texto"] for opt in opciones]:
        raise HTTPException(status_code=400, detail="Opción inválida")

    # Incrementar contador
    for opt in opciones:
        if opt["texto"] == voto.opcion:
            opt["votos"] += 1

    encuesta.opciones = opciones
    db.commit()
    db.refresh(encuesta)
    return {"mensaje": "Voto registrado", "encuesta": encuesta}

# -------------------
# Obtener resultados de encuesta simple
# -------------------
@router.get("/{survey_id}/results")
def resultados_simple(survey_id: int, db: Session = Depends(get_db)):
    encuesta = db.query(Survey).filter(Survey.id == survey_id, Survey.tipo == "simple").first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    return {
        "titulo": encuesta.titulo,
        "opciones": encuesta.opciones,
        "imagenes": encuesta.imagenes,
        "videos": encuesta.videos
    }