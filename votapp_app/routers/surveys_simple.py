
# votapp_app/routers/survey_simple.py



from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models_simple import SurveySimple, SurveySimpleQuestion, SurveySimpleOption, SimpleVote
from ..schemas_simple import (
    SurveySimpleCreate,
    SurveySimpleVote,        # 👈 este sí existe en schemas_simple
    SurveySimpleResponse
)
from ..auth import get_current_user
from datetime import datetime, timezone
from typing import List
import logging
from sqlalchemy import func
from ..models import Usuario
from services.cloudinary_service import upload_avatar

# 👇 importa la función oficial desde utils
from votapp_app.utils import safe_json_list

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/surveys/simple", tags=["Surveys Simple"])

# -------------------
# Auxiliares
# -------------------
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

    # 👇 deserializar correctamente usando utils
    imagenes = safe_json_list(survey.imagenes)
    videos = safe_json_list(survey.videos)

    return SurveySimpleResponse(
        id=survey.id,
        titulo=survey.titulo,
        fecha_expiracion=fecha_exp,   # ✅ devuelve datetime, no string
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
        estado_civil=None
    )



# -------------------
# Crear encuesta simple (subida a Cloudinary)
# -------------------

@router.post("/", response_model=SurveySimpleResponse)
def crear_encuesta_simple(
    survey: str = Form(...),   # 👈 llega como string en multipart/form-data
    files: List[UploadFile] = None,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    try:
        # 👇 convertir el string JSON a objeto Pydantic
        survey_data = SurveySimpleCreate.parse_raw(survey)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parseando survey: {str(e)}")

    urls = []
    if files:
        for f in files:
            if not f.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="Solo se permiten imágenes")
            url = upload_avatar(f.file)
            urls.append(url)

    nueva = SurveySimple(
        titulo=survey_data.titulo,   # 👈 ahora sí, objeto Pydantic
        usuario_id=usuario.id,
        imagenes=urls or survey_data.imagenes or [],
        videos=survey_data.videos or [],
        fecha_expiracion=survey_data.fecha_expiracion or datetime.now(timezone.utc)
    )

    db.add(nueva)
    db.flush()

    for pregunta in survey_data.preguntas:
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

    db.commit()
    db.refresh(nueva)

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
        opcion = db.query(SurveySimpleOption).filter(
            SurveySimpleOption.id == ans.opcion_id
        ).first()
        if not opcion:
            raise HTTPException(status_code=400, detail=f"Opción inválida: {ans.opcion_id}")

        nuevo_voto = SimpleVote(
            usuario_id=usuario.id,
            survey_simple_id=encuesta.id,
            pregunta_id=ans.pregunta_id,   # ✅ corregido
            opcion_id=ans.opcion_id        # ✅ corregido
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
        {"pregunta_id": v.pregunta_id, "opcion_id": v.opcion_id}   # ✅ corregido
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

    preguntas = []
    for pregunta in encuesta.preguntas:
        conteos = (
            db.query(SimpleVote.opcion_id, func.count(SimpleVote.id))
            .filter(SimpleVote.pregunta_id == pregunta.id)
            .group_by(SimpleVote.opcion_id)
            .all()
        )
        votos_por_opcion = {opcion_id: total for opcion_id, total in conteos}

        opciones = []
        for opcion in pregunta.opciones:
            votos = votos_por_opcion.get(opcion.id, 0)
            opciones.append({
                "id": opcion.id,
                "texto": opcion.texto,
                "votos": votos
            })

        preguntas.append({
            "id": pregunta.id,
            "texto": pregunta.texto,
            "opciones": opciones
        })

    return {
        "id": encuesta.id,
        "titulo": encuesta.titulo,
        "preguntas": preguntas,
        "imagenes": getattr(encuesta, "imagenes", []) or [],
        "videos": getattr(encuesta, "videos", []) or [],
        "fecha_expiracion": encuesta.fecha_expiracion,
        "fecha_creacion": encuesta.fecha_creacion,
        "tipo": "simple"
    }









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




