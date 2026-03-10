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
from datetime import datetime

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
        videos=json.dumps(survey.videos) if survey.videos else "[]",
        estado="disponible",
        fecha_expiracion=survey.fecha_expiracion  # opcional, si lo incluyes en el schema
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
    encuesta.estado = "votada"
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

# -------------------
# Listar todas las encuestas simples
# -------------------
@router.get("/", response_model=list[SurveySimpleResponse])
def listar_encuestas_simple(db: Session = Depends(get_db)):
    encuestas = db.query(SurveySimple).all()
    respuestas = []
    for e in encuestas:
        opciones = db.query(SurveySimpleOption).filter(
            SurveySimpleOption.survey_simple_id == e.id
        ).all()
        respuestas.append(SurveySimpleResponse(
            id=e.id,
            titulo=e.titulo,
            usuario_id=e.usuario_id,
            opciones=[SurveySimpleOptionResponse(id=o.id, texto=o.texto, votos=o.votos) for o in opciones],
            imagenes=json.loads(e.imagenes) if e.imagenes else [],
            videos=json.loads(e.videos) if e.videos else []
        ))
    return respuestas

# -------------------
# Listar encuestas disponibles
# -------------------
@router.get("/disponibles", response_model=list[SurveySimpleResponse])
def listar_disponibles(db: Session = Depends(get_db)):
    ahora = datetime.utcnow()
    encuestas = db.query(SurveySimple).filter(
        SurveySimple.estado == "disponible",
        SurveySimple.fecha_expiracion > ahora
    ).all()
    return [
        SurveySimpleResponse(
            id=e.id,
            titulo=e.titulo,
            usuario_id=e.usuario_id,
            opciones=[SurveySimpleOptionResponse(id=o.id, texto=o.texto, votos=o.votos) for o in e.opciones],
            imagenes=json.loads(e.imagenes) if e.imagenes else [],
            videos=json.loads(e.videos) if e.videos else []
        )
        for e in encuestas
    ]

# -------------------
# Listar encuestas votadas
# -------------------
@router.get("/votadas", response_model=list[SurveySimpleResponse])
def listar_votadas(db: Session = Depends(get_db)):
    encuestas = db.query(SurveySimple).filter(SurveySimple.estado == "votada").all()
    return [
        SurveySimpleResponse(
            id=e.id,
            titulo=e.titulo,
            usuario_id=e.usuario_id,
            opciones=[SurveySimpleOptionResponse(id=o.id, texto=o.texto, votos=o.votos) for o in e.opciones],
            imagenes=json.loads(e.imagenes) if e.imagenes else [],
            videos=json.loads(e.videos) if e.videos else []
        )
        for e in encuestas
    ]

# -------------------
# Listar encuestas finalizadas (expiradas)
# -------------------
@router.get("/finalizadas", response_model=list[SurveySimpleResponse])
def listar_finalizadas(db: Session = Depends(get_db)):
    ahora = datetime.utcnow()
    encuestas = db.query(SurveySimple).filter(
        SurveySimple.fecha_expiracion <= ahora
    ).all()
    # marcar como finalizadas
    for e in encuestas:
        e.estado = "finalizada"
    db.commit()
    return [
        SurveySimpleResponse(
            id=e.id,
            titulo=e.titulo,
            usuario_id=e.usuario_id,
            opciones=[SurveySimpleOptionResponse(id=o.id, texto=o.texto, votos=o.votos) for o in e.opciones],
            imagenes=json.loads(e.imagenes) if e.imagenes else [],
            videos=json.loads(e.videos) if e.videos else []
        )
        for e in encuestas
    ]