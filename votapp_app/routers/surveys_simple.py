from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models_simple import SurveySimple, SurveySimpleOption
from ..schemas_simple import (
    SurveySimpleCreate,
    SurveySimpleVote,
    SurveySimpleResponse,
    SurveySimpleOptionResponse
)
import json

router = APIRouter(prefix="/surveys/simple", tags=["Surveys Simple"])

# -------------------
# Crear encuesta simple con multimedia
# -------------------
@router.post("/", response_model=SurveySimpleResponse)
def crear_encuesta_simple(survey: SurveySimpleCreate, db: Session = Depends(get_db)):
    nueva = SurveySimple(
        titulo=survey.titulo,
        usuario_id=survey.usuario_id,
        imagenes=json.dumps(survey.imagenes) if survey.imagenes else "[]",
        videos=json.dumps(survey.videos) if survey.videos else "[]"
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    # insertar opciones
    for opcion in survey.opciones:
        opt = SurveySimpleOption(
            texto=opcion.texto,
            votos=0,
            survey_simple_id=nueva.id
        )
        db.add(opt)
    db.commit()

    opciones = db.query(SurveySimpleOption).filter(
        SurveySimpleOption.survey_simple_id == nueva.id
    ).all()

    return SurveySimpleResponse(
        id=nueva.id,
        titulo=nueva.titulo,
        usuario_id=nueva.usuario_id,
        opciones=[SurveySimpleOptionResponse(id=opt.id, texto=opt.texto, votos=opt.votos) for opt in opciones],
        imagenes=json.loads(nueva.imagenes) if nueva.imagenes else [],
        videos=json.loads(nueva.videos) if nueva.videos else []
    )

# -------------------
# Votar en encuesta simple
# -------------------
@router.post("/{survey_id}/vote")
def votar_simple(survey_id: int, voto: SurveySimpleVote, db: Session = Depends(get_db)):
    encuesta = db.query(SurveySimple).filter(SurveySimple.id == survey_id).first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    opcion = db.query(SurveySimpleOption).filter(
        SurveySimpleOption.survey_simple_id == survey_id,
        SurveySimpleOption.texto == voto.opcion
    ).first()

    if not opcion:
        raise HTTPException(status_code=400, detail="Opción inválida")

    opcion.votos += 1
    db.commit()
    db.refresh(opcion)

    return {"mensaje": "Voto registrado", "opcion": opcion}

# -------------------
# Obtener resultados de encuesta simple
# -------------------
@router.get("/{survey_id}/results", response_model=SurveySimpleResponse)
def resultados_simple(survey_id: int, db: Session = Depends(get_db)):
    encuesta = db.query(SurveySimple).filter(SurveySimple.id == survey_id).first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    opciones = db.query(SurveySimpleOption).filter(
        SurveySimpleOption.survey_simple_id == survey_id
    ).all()

    return SurveySimpleResponse(
        id=encuesta.id,
        titulo=encuesta.titulo,
        usuario_id=encuesta.usuario_id,
        opciones=[SurveySimpleOptionResponse(id=opt.id, texto=opt.texto, votos=opt.votos) for opt in opciones],
        imagenes=json.loads(encuesta.imagenes) if encuesta.imagenes else [],
        videos=json.loads(encuesta.videos) if encuesta.videos else []
    )