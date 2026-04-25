
# votapp_app/routers/survey_simple.py



from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models_simple import SurveySimple, SurveySimpleQuestion, SurveySimpleOption, SimpleVote, SurveyAssignment
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
from pydantic import BaseModel

# 👇 importa la función oficial desde utils
from votapp_app.utils import safe_json_list

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/surveys/simple", tags=["Surveys Simple"])

# -------------------
# Auxiliares
# -------------------

def build_survey_simple_response(survey: SurveySimple, usuario_id: int, db: Session) -> SurveySimpleResponse:
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

    imagenes = safe_json_list(survey.imagenes)
    videos = safe_json_list(survey.videos)

    # 👇 Buscar creador
    creator = db.query(Usuario).filter(Usuario.id == survey.usuario_id).first()

    # 👇 Buscar asignador en SurveyAssignment
    assignment = (
        db.query(SurveyAssignment)
        .filter(SurveyAssignment.survey_id == survey.id,
                SurveyAssignment.asignado_a == usuario_id)
        .order_by(SurveyAssignment.id.desc())
        .first()
    )

    asignador_alias = None
    asignador_avatar = None
    if assignment:
        asignador = db.query(Usuario).filter(Usuario.id == assignment.asignado_por).first()
        if asignador:
            asignador_alias = getattr(asignador, "alias", None)
            asignador_avatar = getattr(asignador, "avatar_url", None)
    elif survey.asignado_por:  # fallback para encuestas viejas
        asignador = db.query(Usuario).filter(Usuario.id == survey.asignado_por).first()
        if asignador:
            asignador_alias = getattr(asignador, "alias", None)
            asignador_avatar = getattr(asignador, "avatar_url", None)

    return SurveySimpleResponse(
        id=survey.id,
        titulo=survey.titulo,
        fecha_expiracion=fecha_exp,
        fecha_creacion=survey.fecha_creacion,
        imagenes=imagenes,
        videos=videos,
        preguntas=preguntas,
        description="",
        media_url=imagenes[0] if imagenes else None,
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
        usuario_id=survey.usuario_id,
        usuario_alias=creator.perfil_publico.alias if creator and creator.perfil_publico else None,
        usuario_avatar_url=creator.perfil_publico.avatar_url if creator and creator.perfil_publico else None,
        asignado_a=[x for x in (survey.asignado_a or []) if x is not None],
        asignado_por=survey.asignado_por,
        asignador_alias=asignador_alias,
        asignador_avatar_url=asignador_avatar,
    )




# -------------------
# Crear encuesta simple (subida a Cloudinary)
# -------------------
from fastapi import Form

@router.post("/", response_model=SurveySimpleResponse)
def crear_encuesta_simple(
    survey: str = Form(...),                  # 👈 survey llega como string JSON
    files: List[UploadFile] = File(None),     # 👈 imágenes como archivos
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    # 👇 parseamos el JSON string a objeto Pydantic
    try:
        survey_obj = SurveySimpleCreate.model_validate_json(survey)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parseando survey: {e}")

    urls = []
    if files:
        for f in files:
            url = upload_avatar(f.file, folder="surveys")
            urls.append(url)

    nueva = SurveySimple(
        titulo=survey_obj.titulo,
        usuario_id=usuario.id,
        asignado_a = survey_obj.asignado_a if survey_obj.asignado_a is not None else [],
        imagenes=urls or survey_obj.imagenes or [],
        videos=survey_obj.videos or [],
        fecha_expiracion=survey_obj.fecha_expiracion or datetime.now(timezone.utc)
    )

    db.add(nueva)
    db.flush()

    # 👇 Crear registro inicial en survey_assignments si hay destinatarios
    if survey_obj.asignado_a:
        for destinatario_id in survey_obj.asignado_a:
            assignment = SurveyAssignment(
                survey_id=nueva.id,
                asignado_a=destinatario_id,
                asignado_por=usuario.id  # el creador como asignador inicial
            )
            db.add(assignment)

    # luego sigues con las preguntas
    for pregunta in survey_obj.preguntas:
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

    return build_survey_simple_response(nueva, db)





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
            ((SurveySimple.fecha_expiracion == None) |
             (SurveySimple.fecha_expiracion > datetime.utcnow()))
            &
            ((SurveySimple.usuario_id == usuario.id) | 
             (SurveySimple.asignado_a.contains([usuario.id])))   # ✅ correcto
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

        disponibles.append(build_survey_simple_response(e, db))

    return disponibles or []

# -------------------
# Listar encuestas personales (simples)
# -------------------
@router.get("/personales", response_model=List[SurveySimpleResponse])
def listar_personales(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    encuestas = (
        db.query(SurveySimple)
        .options(
            selectinload(SurveySimple.preguntas).selectinload(SurveySimpleQuestion.opciones)
        )
        .filter(
            (
                (SurveySimple.usuario_id == usuario.id) |
                (SurveySimple.asignado_a.any(usuario.id))
            )
            &
            (
                (SurveySimple.fecha_expiracion == None) |
                (SurveySimple.fecha_expiracion > datetime.utcnow())
            )
        )
        .order_by(SurveySimple.id.desc())
        .all()
    )

    personales = []
    for e in encuestas:
        # 👇 si ya votaste, no se muestra en personales
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

        personales.append(build_survey_simple_response(e, db))

    return personales or []


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
            votadas.append(build_survey_simple_response(e, db))

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

    return [build_survey_simple_response(e, db) for e in encuestas]



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

    return build_survey_simple_response(encuesta, db)


# -------------------
# Asignar encuesta simple a un amigo
# -------------------
class AssignRequest(BaseModel):
    asignado_por: int | None = None  # 👈 ahora opcional

@router.put("/{survey_id}/assign/{friend_id}", response_model=SurveySimpleResponse)
def assign_simple_survey(
    survey_id: int,
    friend_id: int,
    request: AssignRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)  # 👈 usuario autenticado
):
    survey = db.query(SurveySimple).filter(SurveySimple.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta simple no encontrada")

    friend = db.query(Usuario).filter(Usuario.id == friend_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="Amigo no encontrado")

    # 🚫 Regla 1: No asignar al creador
    if friend_id == survey.usuario_id:
        raise HTTPException(status_code=400, detail="No puedes asignar la encuesta al creador")

    # 🚫 Regla 2: No asignar a alguien que ya la tiene
    if survey.asignado_a and friend_id in survey.asignado_a:
        raise HTTPException(status_code=400, detail="Este usuario ya tiene la encuesta asignada")

    # 👇 Manejo seguro del array asignado_a
    if survey.asignado_a is None:
        survey.asignado_a = []
    survey.asignado_a = survey.asignado_a + [friend_id]

    # 👇 Insertar en SurveyAssignment
    asignador_id = request.asignado_por if request.asignado_por else usuario.id
    assignment = SurveyAssignment(
        survey_id=survey.id,
        asignado_a=friend_id,
        asignado_por=asignador_id
    )
    db.add(assignment)

    db.commit()
    db.refresh(survey)

    # ✅ Pasar usuario.id para que se muestre “Asignada por …”
    return build_survey_simple_response(survey, usuario.id, db)




