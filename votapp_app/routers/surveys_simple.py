from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models_simple import SurveySimple, SurveySimpleQuestion, SurveySimpleOption, SimpleVote
from ..schemas_simple import (
    SurveySimpleCreate,
    SurveySimpleVote,        # 👈 este sí existe en schemas_simple
    SurveySimpleResponse
)
from ..auth import get_current_user
import json
from datetime import datetime, timezone
from typing import List
import logging
from sqlalchemy import func




logger = logging.getLogger(__name__)
router = APIRouter(prefix="/surveys/simple", tags=["Surveys Simple"])

# -------------------
# Auxiliares
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

def build_survey_simple_response(survey: SurveySimple) -> SurveySimpleResponse:
    ahora = datetime.now(timezone.utc)
    fecha_exp = survey.fecha_expiracion
    if fecha_exp and fecha_exp.tzinfo is None:
        fecha_exp = fecha_exp.replace(tzinfo=timezone.utc)
    segundos_restantes = int((fecha_exp - ahora).total_seconds()) if fecha_exp else 0

    preguntas = []
    for p in survey.preguntas or []:
        opciones = [
            {"id": o.id, "texto": o.texto, "votos": o.votos if o.votos is not None else 0}
            for o in (p.opciones or [])
        ]
        preguntas.append({"id": p.id, "texto": p.texto, "opciones": opciones})

    # 👇 deserializar correctamente
    imagenes = safe_json_list(survey.imagenes)
    videos = safe_json_list(survey.videos)

    return SurveySimpleResponse(
        id=survey.id,
        titulo=survey.titulo,
        fecha_expiracion=fecha_exp.isoformat() if fecha_exp else None,
        fecha_creacion=survey.fecha_creacion,
        imagenes=imagenes,
        videos=videos,
        preguntas=preguntas,
        description="",
        # 👇 usar la primera imagen como media_url
        media_url=imagenes[0] if imagenes else None,
        # 👇 incluir imágenes y videos en media_urls
        media_urls=imagenes + videos,
        media_type="native",
        segundos_restantes=max(segundos_restantes, 0),
        patrocinada=False,
        patrocinador=None,
        es_patrocinada=False,
        recompensa_puntos=0,
        recompensa_dinero=0,
        presupuesto_total=0,
        visibilidad_resultados="publica",
        tipo="simple",
        sexo=None,
        ciudad=None,
        ocupacion=None,
        nivel_educativo=None,
        religion=None,
        nacionalidad=None,
        estado_civil=None,
        questions=[
            {
                "id": q["id"],
                "text": q["texto"],
                "options": [
                    {"id": o["id"], "text": o["texto"], "count": o["votos"]}
                    for o in q["opciones"]
                ],
                "total_votes": None
            }
            for q in preguntas
        ]
    )




# -------------------
# Crear encuesta simple
# -------------------
@router.post("/", response_model=SurveySimpleResponse)
def crear_encuesta_simple(
    survey: SurveySimpleCreate,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    nueva = SurveySimple(
        titulo=survey.titulo,
        usuario_id=usuario.id,
        imagenes=survey.imagenes or [],
        videos=survey.videos or [],
        fecha_expiracion=survey.fecha_expiracion or datetime.now(timezone.utc)
    )

    db.add(nueva)
    db.flush()   # 👈 asegura que nueva.id exista

    for pregunta in survey.preguntas:
        nueva_pregunta = SurveySimpleQuestion(
            texto=pregunta.texto,
            survey_simple_id=nueva.id
        )
        db.add(nueva_pregunta)
        db.flush()

        for opcion in pregunta.opciones:
            nueva_opcion = SurveySimpleOption(
                texto=opcion.texto,
                votos=0,
                pregunta_id=nueva_pregunta.id
            )
            db.add(nueva_opcion)

    db.commit()   # 👈 un solo commit al final
    db.refresh(nueva)

    print("Encuesta creada con ID:", nueva.id)  # 👈 log para confirmar

    return build_survey_simple_response(nueva)




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
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    encuesta = db.query(SurveySimple).filter(SurveySimple.id == survey_id).first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    if not voto.answers or len(voto.answers) == 0:
        raise HTTPException(status_code=400, detail="No se recibió ninguna respuesta")

    resultados = []
    for ans in voto.answers:
        opcion = db.query(SurveySimpleOption).filter(SurveySimpleOption.id == ans.option_id).first()
        if not opcion:
            raise HTTPException(status_code=400, detail=f"Opción inválida: {ans.option_id}")

        nuevo_voto = SimpleVote(
            usuario_id=usuario.id,
            survey_simple_id=encuesta.id,
            opcion_id=opcion.id
        )
        db.add(nuevo_voto)
        opcion.votos += 1
        resultados.append({"id": opcion.id, "texto": opcion.texto, "votos": opcion.votos})

    db.commit()

    return {
        "mensaje": "Votos registrados",
        "opciones": resultados
    }


# -------------------
# Consultar si el usuario ya votó en encuesta simple
# -------------------
@router.get("/{survey_id}/my-vote")
def mi_voto_simple(
    survey_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    encuesta = db.query(SurveySimple).filter(SurveySimple.id == survey_id).first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    votos = db.query(SimpleVote).filter(
        SimpleVote.usuario_id == usuario.id,
        SimpleVote.survey_simple_id == survey_id
    ).all()

    answers = [
        {"question_id": v.opcion.pregunta_id, "option_id": v.opcion_id}
        for v in votos
    ]

    return {"answers": answers}





# -------------------
# Resultados de encuesta simple
# -------------------
@router.get("/{survey_id}/results", response_model=SurveySimpleResponse)
def resultados_simple(survey_id: int, db: Session = Depends(get_db)):
    encuesta = db.query(SurveySimple).options(
        selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
    ).filter(SurveySimple.id == survey_id).first()

    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    return build_survey_simple_response(encuesta)



# -------------------
# Listar encuestas disponibles (simples)
# -------------------
@router.get("/disponibles", response_model=List[SurveySimpleResponse])
def listar_disponibles(db: Session = Depends(get_db), usuario = Depends(get_current_user)):
    encuestas = (
        db.query(SurveySimple)
        .options(
            selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
        )
            .filter(
                (SurveySimple.fecha_expiracion == None) |
                (SurveySimple.fecha_expiracion > datetime.utcnow())
            )


        .order_by(SurveySimple.id.desc())
        .all()
    )

    logger.info(f"Usuario actual: {usuario.id}")
    logger.info(f"Encuestas encontradas: {[e.id for e in encuestas]}")

    disponibles = []
    for e in encuestas:
        ya_voto = (
            db.query(SimpleVote)
            .filter(
                SimpleVote.usuario_id == usuario.id,
                SimpleVote.survey_simple_id == e.id,
            )
            .first()
        )
        if ya_voto:
            continue

        disponibles.append(build_survey_simple_response(e))

    return disponibles or []



# -------------------
# Listar encuestas votadas (simples)
# -------------------
@router.get("/votadas", response_model=List[SurveySimpleResponse])
def listar_votadas(db: Session = Depends(get_db), usuario = Depends(get_current_user)):
    encuestas = (
        db.query(SurveySimple)
        .options(
            selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
        )
        .order_by(SurveySimple.id.desc())
        .all()
    )

    votadas = []
    for e in encuestas:
        ya_voto = (
            db.query(SimpleVote)
            .filter(
                SimpleVote.usuario_id == usuario.id,
                SimpleVote.survey_simple_id == e.id,
            )
            .first()
        )
        if ya_voto:
            votadas.append(build_survey_simple_response(e))

    return votadas or []


# -------------------
# Listar encuestas finalizadas (simples)
# -------------------
@router.get("/finalizadas", response_model=List[SurveySimpleResponse])
def listar_finalizadas(db: Session = Depends(get_db)):
    encuestas = (
        db.query(SurveySimple)
        .options(
            selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
        )
        .filter(SurveySimple.fecha_expiracion <= func.now())
        .order_by(SurveySimple.id.desc())
        .all()
    )

    return [build_survey_simple_response(e) for e in encuestas]



# -------------------
# Obtener encuesta simple por ID
# -------------------
@router.get("/{survey_id}", response_model=SurveySimpleResponse)
def obtener_encuesta_simple(
    survey_id: int,
    db: Session = Depends(get_db)
):
    encuesta = db.query(SurveySimple).options(
        selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
    ).filter(SurveySimple.id == survey_id).first()

    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    return build_survey_simple_response(encuesta)