from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models_simple import SurveySimple, SurveySimpleQuestion, SurveySimpleOption
from ..schemas_simple import (
    SurveySimpleCreate,
    SurveySimpleVote,
    SurveySimpleResponse,
    SurveySimpleOptionResponse,
    SurveySimpleQuestionResponse
)
from ..auth import get_current_user
import json
from datetime import datetime, timezone
from typing import List  

import logging

def to_iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/surveys/simple", tags=["Surveys Simple"])

# -------------------
# Función auxiliar para normalizar multimedia
# -------------------
def safe_json_list(value) -> list:
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
    
# -------------------
# Función auxiliar para calcular segundos restantes
# -------------------
def calcular_segundos_restantes(fecha_expiracion: datetime) -> int:
    ahora = datetime.now(timezone.utc)
    logger.info(f"[DEBUG] calcular_segundos_restantes: ahora={ahora}, expiracion={fecha_expiracion}")
    delta = fecha_expiracion - ahora
    return int(delta.total_seconds())


# -------------------
# Crear encuesta simple con multimedia
# -------------------
@router.post("/", response_model=SurveySimpleResponse)
def crear_encuesta_simple(
    survey: SurveySimpleCreate,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    nueva = SurveySimple(
        titulo=survey.titulo,
        usuario_id=usuario.id,
        imagenes=json.dumps(survey.imagenes) if survey.imagenes else "[]",
        videos=json.dumps(survey.videos) if survey.videos else "[]",
        estado="disponible",
        fecha_expiracion=survey.fecha_expiracion or datetime.utcnow()
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    for pregunta in survey.preguntas:
        nueva_pregunta = SurveySimpleQuestion(
            texto=pregunta.texto,
            survey_simple_id=nueva.id
        )
        db.add(nueva_pregunta)
        db.commit()
        db.refresh(nueva_pregunta)

        for opcion in pregunta.opciones:
            nueva_opcion = SurveySimpleOption(
                texto=opcion.texto,
                votos=0,
                pregunta_id=nueva_pregunta.id
            )
            db.add(nueva_opcion)
        db.commit()

    return SurveySimpleResponse(
        id=nueva.id,
        titulo=nueva.titulo,
        preguntas=[
            SurveySimpleQuestionResponse(
                id=p.id,
                texto=p.texto,
                opciones=[
                    SurveySimpleOptionResponse(
                        id=o.id,
                        texto=o.texto,
                        votos=o.votos
                    )
                    for o in p.opciones
                ]
            )
            for p in nueva.preguntas
        ],
        imagenes=safe_json_list(nueva.imagenes),
        videos=safe_json_list(nueva.videos),
        estado=nueva.estado,
        fecha_expiracion=nueva.fecha_expiracion,
        fecha_creacion=nueva.fecha_creacion,
        tipo="simple",
        segundos_restantes=calcular_segundos_restantes(nueva.fecha_expiracion)
    )



# -------------------
# Votar en encuesta simple
# -------------------
@router.post("/{survey_id}/vote")
def votar_simple(
    survey_id: int,
    voto: SurveySimpleVote,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    encuesta = db.query(SurveySimple).filter(SurveySimple.id == survey_id).first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    opcion = db.query(SurveySimpleOption).filter(
        SurveySimpleOption.id == voto.opcion_id
    ).first()

    if not opcion:
        raise HTTPException(status_code=400, detail="Opción inválida")

    opcion.votos += 1
    encuesta.estado = "votada"
    db.commit()
    db.refresh(opcion)

    return {"mensaje": "Voto registrado", "opcion": opcion}

# -------------------
# Obtener resultados de encuesta simple
# -------------------
@router.get("/{survey_id}/results", response_model=SurveySimpleResponse)
def resultados_simple(survey_id: int, db: Session = Depends(get_db)):
    encuesta = db.query(SurveySimple).options(
        selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
    ).filter(SurveySimple.id == survey_id).first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    return SurveySimpleResponse(
        id=encuesta.id,
        titulo=encuesta.titulo,
        preguntas=[
            SurveySimpleQuestionResponse(
                id=p.id,
                texto=p.texto,
                opciones=[
                    SurveySimpleOptionResponse(id=o.id, texto=o.texto, votos=o.votos)
                    for o in p.opciones
                ]
            )
            for p in encuesta.preguntas
        ],
        imagenes=safe_json_list(encuesta.imagenes),
        videos=safe_json_list(encuesta.videos),
        estado=encuesta.estado,
        fecha_expiracion=encuesta.fecha_expiracion,
        fecha_creacion=encuesta.fecha_creacion,
        tipo="simple"
    )


# -------------------
# Listar encuestas disponibles
# -------------------

@router.get("/disponibles", response_model=List[SurveySimpleResponse])
def listar_disponibles(db: Session = Depends(get_db)):
    ahora = datetime.utcnow()
    encuestas = db.query(SurveySimple).options(
        selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
    ).filter(
        SurveySimple.estado == "disponible",
        SurveySimple.fecha_expiracion > ahora
    ).all()

    return [
        SurveySimpleResponse(
            id=e.id,
            titulo=e.titulo,
            preguntas=[
                SurveySimpleQuestionResponse(
                    id=q.id,
                    texto=q.texto,
                    opciones=[
                        SurveySimpleOptionResponse(
                            id=o.id,
                            texto=o.texto,
                            votos=o.votos
                        )
                        for o in (q.opciones or [])
                    ]
                )
                for q in (e.preguntas or [])
            ],
            imagenes=safe_json_list(e.imagenes),
            videos=safe_json_list(e.videos),
            estado=e.estado,
            fecha_expiracion=e.fecha_expiracion,
            fecha_creacion=e.fecha_creacion,
            tipo="simple",
            segundos_restantes=calcular_segundos_restantes(e.fecha_expiracion)
        )
        for e in encuestas
    ]







# -------------------
# Listar encuestas votadas
# -------------------
@router.get("/votadas", response_model=list[SurveySimpleResponse])
def listar_votadas(db: Session = Depends(get_db)):
    encuestas = db.query(SurveySimple).options(
        selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
    ).filter(SurveySimple.estado == "votada").all()

    return [
        SurveySimpleResponse(
            id=e.id,
            titulo=e.titulo,
            preguntas=[
                SurveySimpleQuestionResponse(
                    id=q.id,
                    texto=q.texto,
                    opciones=[
                        SurveySimpleOptionResponse(id=o.id, texto=o.texto, votos=o.votos)
                        for o in q.opciones
                    ]
                )
                for q in e.preguntas
            ],
            imagenes=safe_json_list(e.imagenes),
            videos=safe_json_list(e.videos),
            estado=e.estado,
            fecha_expiracion=e.fecha_expiracion,
            fecha_creacion=e.fecha_creacion,
            tipo="simple",
            segundos_restantes=calcular_segundos_restantes(e.fecha_expiracion)
        )
        for e in encuestas
    ]



# -------------------
# Listar encuestas finalizadas (expiradas)
# -------------------
@router.get("/finalizadas", response_model=list[SurveySimpleResponse])
def listar_finalizadas(db: Session = Depends(get_db)):
    ahora = datetime.utcnow()
    encuestas = db.query(SurveySimple).options(
        selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
    ).filter(SurveySimple.fecha_expiracion <= ahora).all()

    for e in encuestas:
        e.estado = "finalizada"
    db.commit()

    return [
        SurveySimpleResponse(
            id=e.id,
            titulo=e.titulo,
            preguntas=[
                SurveySimpleQuestionResponse(
                    id=q.id,
                    texto=q.texto,
                    opciones=[
                        SurveySimpleOptionResponse(id=o.id, texto=o.texto, votos=o.votos)
                        for o in q.opciones
                    ]
                )
                for q in e.preguntas
            ],
            imagenes=safe_json_list(e.imagenes),
            videos=safe_json_list(e.videos),
            estado=e.estado,
            fecha_expiracion=e.fecha_expiracion,
            fecha_creacion=e.fecha_creacion,
            tipo="simple",
            segundos_restantes=calcular_segundos_restantes(e.fecha_expiracion)
        )
        for e in encuestas
    ]


