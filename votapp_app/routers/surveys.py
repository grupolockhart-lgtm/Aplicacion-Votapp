
# votapp_app/routers/surveys.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func


from typing import List, Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import logging
import os
import shutil
import json
import uuid

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv


# Imports internos


from .. import models, schemas, database
from ..auth import (
    get_current_user,
    get_current_admin,
    get_current_sponsor,
    get_current_user_only   # ✅ ahora sí disponible
)

from ..database import get_db
from .logros import verificar_logros

from votapp_app.schemas import WalletOut, MovimientoWalletOut, SurveyWalletOut, SurveyOut, SurveyResultsOut, VoteResponse
from votapp_app import models_simple   # 👈 importa tus modelos de encuestas simples
from votapp_app.models_simple import SurveySimple, SurveyAssignment
from votapp_app.models import Usuario
from votapp_app.utils.segmentacion import cumple_segmentacion
from votapp_app.models import Survey, Vote







# Configura el logger de uvicorn
logger = logging.getLogger("uvicorn.error")




router = APIRouter(prefix="/surveys", tags=["surveys"])
UPLOAD_DIR = "uploads"


# -------------------
# Helper: convertir modelo SQLAlchemy → SurveyOut
# -------------------
def to_survey_out(encuesta: models.Survey) -> SurveyOut:
    return SurveyOut(
        id=encuesta.id,
        title=encuesta.title,              # 👈 usa title
        description=encuesta.description,  # 👈 usa description
        fecha_expiracion=encuesta.fecha_expiracion,
        fecha_creacion=encuesta.fecha_creacion,
        sexo=json.loads(encuesta.sexo) if encuesta.sexo else [],
        ciudad=json.loads(encuesta.ciudad) if encuesta.ciudad else [],
        ocupacion=json.loads(encuesta.ocupacion) if encuesta.ocupacion else [],
        profesion=json.loads(encuesta.profesion) if encuesta.profesion else [],
        nivel_educativo=json.loads(encuesta.nivel_educativo) if encuesta.nivel_educativo else [],
        religion=json.loads(encuesta.religion) if encuesta.religion else [],
        nacionalidad=json.loads(encuesta.nacionalidad) if encuesta.nacionalidad else [],
        estado_civil=json.loads(encuesta.estado_civil) if encuesta.estado_civil else [],
        media_url=encuesta.media_url,
        media_urls=json.loads(encuesta.media_urls) if encuesta.media_urls else [],
        patrocinada=encuesta.patrocinada,
        patrocinador=encuesta.patrocinador,
        recompensa_puntos=encuesta.recompensa_puntos,
        recompensa_dinero=encuesta.recompensa_dinero,
        presupuesto_total=encuesta.presupuesto_total,
        visibilidad_resultados=(
            encuesta.visibilidad_resultados.value
            if hasattr(encuesta.visibilidad_resultados, "value")
            else encuesta.visibilidad_resultados
        ),
        active=encuesta.active,
        closed_at=encuesta.closed_at,
        closed_reason=encuesta.closed_reason,
        questions=[],   # 👈 aquí, no "preguntas"
    )





# -------------------
# Zona horaria
# -------------------

santo_domingo_tz = ZoneInfo("America/Santo_Domingo")

def calcular_segundos_restantes(fecha_expiracion: datetime):
    if not fecha_expiracion:
        return None
    ahora = datetime.now(santo_domingo_tz)
    diferencia = fecha_expiracion.astimezone(santo_domingo_tz) - ahora
    return max(int(diferencia.total_seconds()), 0)


@router.get("/surveys", response_model=List[schemas.SurveyOut])
def get_surveys(db: Session = Depends(database.get_db)):
    surveys = db.query(models.Survey).all()
    survey_out_list = []
    for survey in surveys:
        survey_out = schemas.SurveyOut(
            id=survey.id,
            title=survey.title,
            description=survey.description,
            fecha_expiracion=survey.fecha_expiracion,
            fecha_creacion=survey.fecha_creacion,
            segundos_restantes=None,
            preguntas=[],  # mapear preguntas si lo necesitas
            imagenes=[],
            videos=[],
            media_url=survey.media_url,
            media_urls=json.loads(survey.media_urls) if survey.media_urls else [],
            media_type=survey.media_type,
            sexo=json.loads(survey.sexo) if survey.sexo else [],
            ciudad=json.loads(survey.ciudad) if survey.ciudad else [],
            ocupacion=json.loads(survey.ocupacion) if survey.ocupacion else [],
            profesion=json.loads(survey.profesion) if survey.profesion else [],  # 👈 nuevo campo
            nivel_educativo=json.loads(survey.nivel_educativo) if survey.nivel_educativo else [],
            religion=json.loads(survey.religion) if survey.religion else [],
            nacionalidad=json.loads(survey.nacionalidad) if survey.nacionalidad else [],
            estado_civil=json.loads(survey.estado_civil) if survey.estado_civil else [],
            patrocinada=survey.patrocinada,
            patrocinador=survey.patrocinador,
            recompensa_puntos=survey.recompensa_puntos,
            recompensa_dinero=survey.recompensa_dinero,
            presupuesto_total=survey.presupuesto_total,
            visibilidad_resultados=survey.visibilidad_resultados.value,
        )
        survey_out_list.append(survey_out)
    return survey_out_list






# -------------------
# Crear encuesta
# -------------------
@router.post("/", response_model=schemas.SurveyOut)
def create_survey(
    survey: schemas.SurveyCreate,
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    # Validaciones de patrocinio
    if survey.patrocinada and usuario.rol != "sponsor":
        raise HTTPException(status_code=403, detail="Solo sponsors pueden crear encuestas patrocinadas")

    if survey.patrocinada and (survey.recompensa_dinero <= 0 and survey.recompensa_puntos <= 0):
        raise HTTPException(status_code=400, detail="Debes asignar al menos una recompensa")

    try:
        # Ajuste de fecha (manejo de "Z")
        fecha_dt = survey.fecha_expiracion
        if isinstance(fecha_dt, str):
            fecha_dt = datetime.fromisoformat(fecha_dt.replace("Z", "+00:00"))

        # Validar wallet y presupuesto si es patrocinada
        wallet = None
        if survey.patrocinada:
            wallet = db.query(models.Wallet).filter_by(usuario_id=usuario.id).first()
            if not wallet:
                raise HTTPException(status_code=400, detail="El sponsor no tiene wallet configurado")
            if survey.presupuesto_total > wallet.balance:
                raise HTTPException(status_code=400, detail="Presupuesto excede balance disponible")

        # Crear encuesta en DB
        db_survey = models.Survey(
            title=survey.title,
            description=survey.description,
            fecha_expiracion=fecha_dt,
            sexo=json.dumps(survey.sexo or []),
            ciudad=json.dumps(survey.ciudad or []),
            ocupacion=json.dumps(survey.ocupacion or []),
            profesion=json.dumps(survey.profesion or []),
            nivel_educativo=json.dumps(survey.nivel_educativo or []),
            religion=json.dumps(survey.religion or []),
            nacionalidad=json.dumps(survey.nacionalidad or []),
            estado_civil=json.dumps(survey.estado_civil or []),
            media_url=survey.media_url,
            media_urls=json.dumps(survey.media_urls or []),
            patrocinada=survey.patrocinada,
            patrocinador=survey.patrocinador,
            recompensa_puntos=survey.recompensa_puntos,
            recompensa_dinero=survey.recompensa_dinero,
            presupuesto_total=survey.presupuesto_total,
            visibilidad_resultados=survey.visibilidad_resultados,
            usuario_id=usuario.id
        )

        db.add(db_survey)
        db.flush()
        db.refresh(db_survey)

        # Crear preguntas y opciones
        preguntas_out = []
        for q in survey.questions:
            db_question = models.Question(text=q.text, survey_id=db_survey.id)
            db.add(db_question)
            db.flush()
            db.refresh(db_question)

            opciones_out = []
            for opt in q.options:
                db_option = models.Option(text=opt.text, question_id=db_question.id)
                db.add(db_option)
                db.flush()
                db.refresh(db_option)
                opciones_out.append({"id": db_option.id, "text": db_option.text})

            preguntas_out.append({
                "id": db_question.id,
                "text": db_question.text,
                "options": opciones_out,
                "total_votes": 0
            })

        db.commit()
        db.refresh(db_survey)

        # Si es patrocinada, crear sponsor_transaction y wallet_movement
        if survey.patrocinada:
            db_transaction = models.SponsorTransaction(
                survey_id=db_survey.id,
                sponsor_id=usuario.id,
                monto_dinero=survey.recompensa_dinero,
                puntos=survey.recompensa_puntos,
                timestamp=datetime.utcnow()
            )
            db.add(db_transaction)
            db.commit()
            db.refresh(db_transaction)

            db_movement = models.MovimientoWallet(
                wallet_id=wallet.id,
                tipo="gasto",
                monto=survey.presupuesto_total,
                fecha=datetime.utcnow(),
                sponsor_transaction_id=db_transaction.id
            )
            db.add(db_movement)

            # Descontar del balance
            wallet.balance -= survey.presupuesto_total
            db.add(wallet)

            db.commit()
            db.refresh(db_movement)
            db.refresh(wallet)

        # Respuesta final
        return schemas.SurveyOut(
            id=db_survey.id,
            title=db_survey.title,
            description=db_survey.description,
            fecha_expiracion=db_survey.fecha_expiracion,
            fecha_creacion=db_survey.fecha_creacion,
            sexo=json.loads(db_survey.sexo),
            ciudad=json.loads(db_survey.ciudad),
            ocupacion=json.loads(db_survey.ocupacion),
            profesion=json.loads(db_survey.profesion),
            nivel_educativo=json.loads(db_survey.nivel_educativo),
            religion=json.loads(db_survey.religion),
            nacionalidad=json.loads(db_survey.nacionalidad),
            estado_civil=json.loads(db_survey.estado_civil),
            media_url=db_survey.media_url,
            media_urls=json.loads(db_survey.media_urls),
            patrocinada=db_survey.patrocinada,
            patrocinador=db_survey.patrocinador,
            recompensa_puntos=db_survey.recompensa_puntos,
            recompensa_dinero=db_survey.recompensa_dinero,
            presupuesto_total=db_survey.presupuesto_total,
            visibilidad_resultados=(
                db_survey.visibilidad_resultados
                if isinstance(db_survey.visibilidad_resultados, str)
                else db_survey.visibilidad_resultados.value
            ),
            questions=preguntas_out
        )

    except Exception as e:
        db.rollback()
        import traceback
        print("❌ Error en create_survey:", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Error interno en create_survey")



# -------------------
# Crear encuesta con archivos (upload + Cloudinary)
# -------------------

# Cargar variables de entorno
load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

logger.setLevel(logging.DEBUG)

@router.post("/upload-survey", response_model=schemas.SurveyOut)
async def create_survey_with_files(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    fecha_expiracion: str = Form(...),
    patrocinada: str = Form(...),
    patrocinador: str = Form(...),
    recompensa_puntos: str = Form(...),
    recompensa_dinero: str = Form(...),
    presupuesto_total: str = Form(...),
    visibilidad_resultados: str = Form(...),
    sexo: str = Form("[]"),
    ciudad: str = Form("[]"),
    ocupacion: str = Form("[]"),
    profesion: str = Form("[]"),
    nivel_educativo: str = Form("[]"),
    religion: str = Form("[]"),
    nacionalidad: str = Form("[]"),
    estado_civil: str = Form("[]"),
    questions: str = Form("[]"),   # 👈 llega como JSON string
    media_url: UploadFile = File(None),          # 👈 portada
    media_urls: List[UploadFile] = File(None),   # 👈 galería
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    logger.info("➡️ Entramos a create_survey_with_files")

    # Capturar lo que llega en el FormData
    form = await request.form()
    logger.info("📥 FormData recibido: %s", dict(form))

    # Conversión manual
    patrocinada = patrocinada.lower() == "true"
    recompensa_puntos = int(recompensa_puntos) if recompensa_puntos else 0
    recompensa_dinero = int(recompensa_dinero) if recompensa_dinero else 0
    presupuesto_total = int(presupuesto_total) if presupuesto_total else 0

    # Validaciones
    if patrocinada and usuario.rol != "sponsor":
        raise HTTPException(status_code=403, detail="Solo sponsors pueden crear encuestas patrocinadas")
    if patrocinada and (recompensa_dinero <= 0 and recompensa_puntos <= 0):
        raise HTTPException(status_code=400, detail="Debes asignar al menos una recompensa")

    # Fecha
    if not fecha_expiracion:
        raise HTTPException(status_code=400, detail="fecha_expiracion es obligatoria")

    try:
        fecha_dt = datetime.fromisoformat(fecha_expiracion.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Formato de fecha inválido: {fecha_expiracion}")

    # Subir portada
    portada_url = None
    if media_url:
        result = cloudinary.uploader.upload(
            media_url.file,
            resource_type="auto",
            folder="surveys",
            public_id=str(uuid.uuid4())
        )
        portada_url = result["secure_url"]

    # Subir galería
    urls = []
    if media_urls:
        for file in media_urls:
            result = cloudinary.uploader.upload(
                file.file,
                resource_type="auto",
                folder="surveys",
                public_id=str(uuid.uuid4())
            )
            urls.append(result["secure_url"])
        logger.info("📤 Archivos subidos a Cloudinary: %s", urls)


    # Validar wallet
    if patrocinada:
        wallet = db.query(models.Wallet).filter_by(usuario_id=usuario.id).first()
        if not wallet:
            raise HTTPException(status_code=400, detail="El sponsor no tiene wallet configurado")
        if presupuesto_total > wallet.balance:
            raise HTTPException(status_code=400, detail="Presupuesto excede balance disponible")

    # Guardar encuesta
    db_survey = models.Survey(
        title=title,
        description=description,
        fecha_expiracion=fecha_dt,
        patrocinada=patrocinada,
        patrocinador=patrocinador,
        recompensa_puntos=recompensa_puntos,
        recompensa_dinero=recompensa_dinero,
        presupuesto_total=presupuesto_total,
        visibilidad_resultados=visibilidad_resultados,
        media_url=portada_url,          # 👈 portada
        media_urls=json.dumps(urls),    # 👈 galería
        usuario_id=usuario.id,
        sexo=sexo,
        ciudad=ciudad,
        ocupacion=ocupacion,
        profesion=profesion,
        nivel_educativo=nivel_educativo,
        religion=religion,
        nacionalidad=nacionalidad,
        estado_civil=estado_civil
    )

    db.add(db_survey)
    db.commit()
    db.refresh(db_survey)
    logger.info("🗂 Encuesta guardada en DB con id=%s", db_survey.id)

    # Guardar preguntas y opciones
    try:
        questions_data = json.loads(questions)
    except Exception:
        questions_data = []

    survey_questions_out = []
    for q in questions_data:
        db_question = models.Question(
            survey_id=db_survey.id,
            text=q["text"]
        )
        db.add(db_question)
        db.flush()
        db.refresh(db_question)

        options_out = []
        for opt in q.get("options", []):
            db_option = models.Option(
                question_id=db_question.id,
                text=opt["text"]
            )
            db.add(db_option)
            db.flush()
            db.refresh(db_option)
            options_out.append({"id": db_option.id, "text": db_option.text})

        survey_questions_out.append({
            "id": db_question.id,
            "text": db_question.text,
            "options": options_out
        })

    db.commit()

    # Transacciones si es patrocinada
    if patrocinada:
        db_transaction = models.SponsorTransaction(
            survey_id=db_survey.id,
            sponsor_id=usuario.id,
            monto_dinero=recompensa_dinero,
            puntos=recompensa_puntos,
            timestamp=datetime.utcnow()
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)

        db_movement = models.MovimientoWallet(
            wallet_id=wallet.id,
            tipo="gasto",
            monto=presupuesto_total,
            fecha=datetime.utcnow(),
            sponsor_transaction_id=db_transaction.id
        )
        db.add(db_movement)

        wallet.balance -= presupuesto_total
        db.add(wallet)

        db.commit()
        db.refresh(db_movement)
        db.refresh(wallet)

        logger.info("💰 Wallet y transacciones actualizadas para sponsor_id=%s", usuario.id)

    # Construir SurveyOut con preguntas
    survey_out = schemas.SurveyOut(
        id=db_survey.id,
        title=db_survey.title,
        description=db_survey.description,
        fecha_expiracion=fecha_dt,
        fecha_creacion=db_survey.fecha_creacion,
        sexo=json.loads(db_survey.sexo),
        ciudad=json.loads(db_survey.ciudad),
        ocupacion=json.loads(db_survey.ocupacion),
        profesion=json.loads(db_survey.profesion),
        nivel_educativo=json.loads(db_survey.nivel_educativo),
        religion=json.loads(db_survey.religion),
        nacionalidad=json.loads(db_survey.nacionalidad),
        estado_civil=json.loads(db_survey.estado_civil),
        media_url=db_survey.media_url,
        media_urls=json.loads(db_survey.media_urls),
        patrocinada=patrocinada,
        patrocinador=db_survey.patrocinador,
        recompensa_puntos=db_survey.recompensa_puntos,
        recompensa_dinero=db_survey.recompensa_dinero,
        presupuesto_total=db_survey.presupuesto_total,
        visibilidad_resultados=(
            db_survey.visibilidad_resultados.value
            if hasattr(db_survey.visibilidad_resultados, "value")
            else db_survey.visibilidad_resultados
        ),
        questions=survey_questions_out   # 👈 ahora sí con datos
    )

    logger.info("✅ SurveyOut construido: %s", survey_out.dict())
    return survey_out


# -------------------
# Update survey with files (PUT + Cloudinary)
# -------------------

def normalize_segment(value: str) -> str:
    """
    Convierte el valor recibido en una lista JSON válida.
    - Si viene vacío o como "[]", devuelve [].
    - Si viene como string JSON válido, lo mantiene.
    - Si falla, devuelve [].
    """
    try:
        parsed = json.loads(value) if value else []
        if isinstance(parsed, str) and parsed.strip() == "[]":
            parsed = []
        return json.dumps(parsed)
    except Exception:
        return json.dumps([])

@router.put("/{survey_id}", response_model=schemas.SurveyOut)
async def update_survey_with_files(
    survey_id: int,
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    fecha_expiracion: str = Form(...),
    recompensa_puntos: str = Form(...),
    recompensa_dinero: str = Form(...),
    presupuesto_total: str = Form(...),
    visibilidad_resultados: str = Form(...),
    sexo: str = Form("[]"),
    ciudad: str = Form("[]"),
    ocupacion: str = Form("[]"),
    profesion: str = Form("[]"),
    nivel_educativo: str = Form("[]"),
    religion: str = Form("[]"),
    nacionalidad: str = Form("[]"),
    estado_civil: str = Form("[]"),
    portada_url: str = Form(None),              # 👈 nuevo campo para URL portada   
    media_url: UploadFile = File(None),          # portada
    media_files: List[UploadFile] = File(None),  # galería
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    # 👇 Log de depuración
    form = await request.form()
    logger.info("📥 FormData recibido en update: %s", dict(form))   

    db_survey = db.query(models.Survey).filter_by(id=survey_id, usuario_id=usuario.id).first()
    if not db_survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    recompensa_puntos = int(recompensa_puntos) if recompensa_puntos else 0
    recompensa_dinero = int(recompensa_dinero) if recompensa_dinero else 0
    presupuesto_total = int(presupuesto_total) if presupuesto_total else 0

    try:
        fecha_dt = datetime.fromisoformat(fecha_expiracion.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Formato de fecha inválido: {fecha_expiracion}")

    # Subir portada como archivo
    if media_url:
        result = cloudinary.uploader.upload(
            media_url.file,
            resource_type="auto",
            folder="surveys",
            public_id=str(uuid.uuid4())
        )
        db_survey.media_url = result["secure_url"]

    # Usar portada como URL existente
    elif portada_url:
        db_survey.media_url = portada_url

    # Subir nuevas imágenes
    new_urls = []
    if media_files:
        for file in media_files:
            result = cloudinary.uploader.upload(
                file.file,
                resource_type="auto",
                folder="surveys",
                public_id=str(uuid.uuid4())
            )
            new_urls.append(result["secure_url"])

    # Tomar las URLs que el frontend mandó (las que se mantienen)
    existing_urls = []
    if "media_urls" in form:
        try:
            existing_urls = json.loads(form.get("media_urls"))
        except Exception:
            existing_urls = []

    # Estado final = las que se mantienen + las nuevas subidas
    final_urls = existing_urls + new_urls
    db_survey.media_urls = json.dumps(final_urls)



    # Actualizar campos
    db_survey.title = title
    db_survey.description = description
    db_survey.fecha_expiracion = fecha_dt
    db_survey.recompensa_puntos = recompensa_puntos
    db_survey.recompensa_dinero = recompensa_dinero
    db_survey.presupuesto_total = presupuesto_total
    db_survey.visibilidad_resultados = visibilidad_resultados
    db_survey.sexo = normalize_segment(sexo)
    db_survey.ciudad = normalize_segment(ciudad)
    db_survey.ocupacion = normalize_segment(ocupacion)
    db_survey.profesion = normalize_segment(profesion)
    db_survey.nivel_educativo = normalize_segment(nivel_educativo)
    db_survey.religion = normalize_segment(religion)
    db_survey.nacionalidad = normalize_segment(nacionalidad)
    db_survey.estado_civil = normalize_segment(estado_civil)

    # 🔎 Lógica de reactivación solo para encuestas cerradas por fondos
    if db_survey.closed_reason == "funds":
        puede_reabrir = False

        # Verificar fecha válida
        if db_survey.fecha_expiracion and db_survey.fecha_expiracion > datetime.utcnow():
            puede_reabrir = True

        # Verificar fondos suficientes
        if db_survey.presupuesto_total and db_survey.presupuesto_total >= max(db_survey.recompensa_dinero, 1):
            puede_reabrir = True

        if puede_reabrir:
            db_survey.active = True
            db_survey.closed_reason = None
            db_survey.closed_at = None




    db.commit()
    db.refresh(db_survey)

    return schemas.SurveyOut(
        id=db_survey.id,
        title=db_survey.title,
        description=db_survey.description,
        fecha_expiracion=db_survey.fecha_expiracion,
        fecha_creacion=db_survey.fecha_creacion,
        sexo=json.loads(db_survey.sexo),
        ciudad=json.loads(db_survey.ciudad),
        ocupacion=json.loads(db_survey.ocupacion),
        profesion=json.loads(db_survey.profesion),
        nivel_educativo=json.loads(db_survey.nivel_educativo),
        religion=json.loads(db_survey.religion),
        nacionalidad=json.loads(db_survey.nacionalidad),
        estado_civil=json.loads(db_survey.estado_civil),
        media_url=db_survey.media_url,
        media_urls=json.loads(db_survey.media_urls) if db_survey.media_urls else [],
        patrocinada=db_survey.patrocinada,
        patrocinador=db_survey.patrocinador,
        recompensa_puntos=db_survey.recompensa_puntos,
        recompensa_dinero=db_survey.recompensa_dinero,
        presupuesto_total=db_survey.presupuesto_total,
        visibilidad_resultados=(
            db_survey.visibilidad_resultados.value
            if hasattr(db_survey.visibilidad_resultados, "value")
            else db_survey.visibilidad_resultados
        ),
        questions=[]
    )




import json


# -----------------------------
# ENDPOINT: Listar encuestas publicadas del sponsor autenticado
# -----------------------------
@router.get("/me/published", response_model=list[schemas.SurveyOut])
def listar_encuestas_publicadas(
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    encuestas = (
        db.query(models.Survey)
        .filter(models.Survey.usuario_id == current_user.id)
        .all()
    )

    result = []
    for e in encuestas:
        # 👇 Normaliza campos JSON igual que en create_survey_with_files
        def parse_list(value):
            if not value:
                return []
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except Exception:
                    return []
            return value

        survey_out = schemas.SurveyOut(
            id=e.id,
            usuario_id=e.usuario_id,   # 👈 asegúrate de incluirlo
            title=e.title,
            description=e.description,
            fecha_expiracion=e.fecha_expiracion,
            fecha_creacion=e.fecha_creacion,
            sexo=parse_list(e.sexo),
            ciudad=parse_list(e.ciudad),
            ocupacion=parse_list(e.ocupacion),
            profesion=parse_list(e.profesion),
            nivel_educativo=parse_list(e.nivel_educativo),
            religion=parse_list(e.religion),
            nacionalidad=parse_list(e.nacionalidad),
            estado_civil=parse_list(e.estado_civil),
            media_url=e.media_url,
            media_urls=parse_list(e.media_urls),
            patrocinada=e.patrocinada,
            patrocinador=e.patrocinador,
            recompensa_puntos=e.recompensa_puntos,
            recompensa_dinero=e.recompensa_dinero,
            presupuesto_total=e.presupuesto_total,
            visibilidad_resultados=(
                e.visibilidad_resultados.value
                if hasattr(e.visibilidad_resultados, "value")
                else e.visibilidad_resultados
            ),
            active=e.active,              # 👈 añadir
            closed_reason=e.closed_reason, # 👈 añadir
            closed_at=e.closed_at,         # 👈 añadir           
            questions=[{
                "id": q.id,
                "text": q.text,
                "options": [{"id": o.id, "text": o.text} for o in q.options]
            } for q in e.questions]
        )
        result.append(survey_out)

    return result

# -------------------
# ENDPOINT: Pausar encuesta patrocinada
# -------------------

@router.patch("/{survey_id}/pause", response_model=SurveyOut)
def pausar_encuesta(survey_id: int,
                    db: Session = Depends(database.get_db),
                    user = Depends(get_current_user)):
    encuesta = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    if not encuesta.patrocinada:
        raise HTTPException(status_code=400, detail="Solo encuestas patrocinadas pueden pausarse")
    if encuesta.usuario_id != user.id and user.rol != "admin":
        raise HTTPException(status_code=403, detail="No autorizado para pausar esta encuesta")

    encuesta.active = False
    encuesta.closed_at = datetime.utcnow()
    encuesta.closed_reason = "paused"   # 👈 diferencia clave
    db.commit()
    db.refresh(encuesta)

    return to_survey_out(encuesta)   # 👈 aquí




# -------------------
# ENDPOINT: Reanudar encuesta patrocinada (pausada)
# -------------------

@router.patch("/{survey_id}/resume", response_model=SurveyOut)
def reanudar_encuesta(survey_id: int,
                      db: Session = Depends(database.get_db),
                      user = Depends(get_current_user)):
    encuesta = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    if encuesta.closed_reason != "paused":
        raise HTTPException(status_code=400, detail="Solo encuestas pausadas pueden reanudarse")

    if encuesta.usuario_id != user.id and user.rol != "admin":
        raise HTTPException(status_code=403, detail="No autorizado para reanudar esta encuesta")

    # Validar que no esté expirada y tenga fondos
    ahora = datetime.utcnow()
    if encuesta.fecha_expiracion and encuesta.fecha_expiracion <= ahora:
        raise HTTPException(status_code=400, detail="La encuesta está expirada")
    if encuesta.presupuesto_total < encuesta.recompensa_dinero:
        raise HTTPException(status_code=400, detail="Fondos insuficientes")

    encuesta.active = True
    encuesta.closed_reason = None
    encuesta.closed_at = None
    db.commit()
    db.refresh(encuesta)

    return to_survey_out(encuesta)   # 👈 aquí también



# -------------------
# ENDPOINT: Resultados de encuesta (Sponsor Dashboard - WEB)
# -------------------

@router.get("/web/{survey_id}/results", response_model=SurveyResultsOut)
async def get_survey_results(survey_id: int, db: Session = Depends(get_db)):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    # Total participantes (usuarios únicos que votaron)
    total_participants = (
        db.query(Vote.usuario_id)
        .filter(Vote.survey_id == survey_id)
        .distinct()
        .count()
    )

    # Total votos
    total_votes = db.query(Vote).filter(Vote.survey_id == survey_id).count()

    # Presupuesto gastado basado en recompensa
    if survey.recompensa_dinero and survey.recompensa_dinero > 0:
        spent_budget = total_votes * survey.recompensa_dinero
    elif survey.recompensa_puntos and survey.recompensa_puntos > 0:
        # si decides convertir puntos a dinero, define la tasa
        spent_budget = total_votes * (survey.recompensa_puntos * 0.1)  # ejemplo
    else:
        # si no hay recompensa definida, se considera 0
        spent_budget = 0

    # Balance restante (evita negativos)
    balance_restante = max((survey.presupuesto_total or 0) - spent_budget, 0)

    # Opciones con conteo
    options = []
    for question in survey.questions:
        for option in question.options:
            votes_count = db.query(Vote).filter(Vote.option_id == option.id).count()
            options.append({"text": option.text, "votes": votes_count})

    # Timeline agrupado por fecha (usando creado_en)
    rows = (
        db.query(func.date(Vote.creado_en).label("fecha"), func.count(Vote.id).label("votos"))
        .filter(Vote.survey_id == survey_id)
        .group_by(func.date(Vote.creado_en))
        .order_by(func.date(Vote.creado_en))
        .all()
    )
    timeline = [{"date": str(r.fecha), "votes": r.votos} for r in rows]

    return {
        "id": survey.id,
        "title": survey.title,
        "active": survey.active,
        "closed_reason": survey.closed_reason,
        "total_participants": total_participants,
        "total_votes": total_votes,
        "spent_budget": spent_budget,
        "balance_restante": balance_restante,   # 👈 ahora sí lo devuelves
        "options": options,
        "timeline": timeline,
        "fecha_creacion": survey.fecha_creacion.isoformat() if survey.fecha_creacion else None,
        "fecha_expiracion": survey.fecha_expiracion.isoformat() if survey.fecha_expiracion else None,
        "patrocinador": survey.patrocinador,
        "visibilidad_resultados": survey.visibilidad_resultados.value if survey.visibilidad_resultados else None,
        # 👇 nuevos campos para KPIs extendidos
        "presupuesto_total": survey.presupuesto_total,
        "recompensa_dinero": survey.recompensa_dinero,
        "recompensa_puntos": survey.recompensa_puntos,


    }





































# -------------------
# Listar encuestas
# -------------------
@router.get("/")
def list_surveys(
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    ahora = datetime.now(santo_domingo_tz)
    surveys = db.query(models.Survey).filter(
        (models.Survey.fecha_expiracion == None) | (models.Survey.fecha_expiracion >= ahora)
    ).all()

    result = []
    for s in surveys:
        preguntas = []
        for q in s.questions:
            opciones = [{"id": o.id, "text": o.text} for o in q.options]
            preguntas.append({
                "id": q.id,
                "text": q.text,
                "options": opciones,
                "total_votes": None
            })

        result.append({
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "fecha_expiracion": s.fecha_expiracion,
            "segundos_restantes": calcular_segundos_restantes(s.fecha_expiracion),
            "questions": preguntas,
            "media_url": s.media_url,
            "media_urls": json.loads(s.media_urls) if s.media_urls else [],
            "sexo": json.loads(s.sexo) if s.sexo else [],
            "ciudad": json.loads(s.ciudad) if s.ciudad else [],
            "ocupacion": json.loads(s.ocupacion) if s.ocupacion else [],
            "profesion": json.loads(s.profesion) if s.profesion else [],  # 👈 nuevo campo
            "nivel_educativo": json.loads(s.nivel_educativo) if s.nivel_educativo else [],
            "religion": json.loads(s.religion) if s.religion else [],
            "nacionalidad": json.loads(s.nacionalidad) if s.nacionalidad else [],
            "estado_civil": json.loads(s.estado_civil) if s.estado_civil else [],
            "patrocinada": s.patrocinada,
            "patrocinador": s.patrocinador,
            "recompensa_puntos": s.recompensa_puntos,
            "recompensa_dinero": s.recompensa_dinero,
            "presupuesto_total": s.presupuesto_total,
            "visibilidad_resultados": s.visibilidad_resultados.value,
        })
    return result


# -------------------
# Disponibles, votadas, finalizadas
# -------------------
#def cumple_segmentacion(survey: models.Survey, usuario: models.Usuario) -> bool:
    sexo = [s.lower() for s in json.loads(survey.sexo)] if survey.sexo else []
    ciudad = [c.lower() for c in json.loads(survey.ciudad)] if survey.ciudad else []
    ocupacion = [o.lower() for o in json.loads(survey.ocupacion)] if survey.ocupacion else []
    profesion = [p.lower() for p in json.loads(survey.profesion)] if survey.profesion else []   # 👈 nuevo campo
    nivel_educativo = [n.lower() for n in json.loads(survey.nivel_educativo)] if survey.nivel_educativo else []
    religion = [r.lower() for r in json.loads(survey.religion)] if survey.religion else []
    nacionalidad = [n.lower() for n in json.loads(survey.nacionalidad)] if survey.nacionalidad else []
    estado_civil = [e.lower() for e in json.loads(survey.estado_civil)] if survey.estado_civil else []

    return (not sexo or (usuario.sexo and usuario.sexo.lower() in sexo)) and \
        (not ciudad or (usuario.ciudad and usuario.ciudad.lower() in ciudad)) and \
        (not ocupacion or (usuario.ocupacion and usuario.ocupacion.lower() in ocupacion)) and \
        (not profesion or (usuario.profesion and usuario.profesion.lower() in profesion)) and \
        (not nivel_educativo or (usuario.nivel_educativo and usuario.nivel_educativo.lower() in nivel_educativo)) and \
        (not religion or (usuario.religion and usuario.religion.lower() in religion)) and \
        (not nacionalidad or (usuario.nacionalidad and usuario.nacionalidad.lower() in nacionalidad)) and \
        (not estado_civil or (usuario.estado_civil and usuario.estado_civil.lower() in estado_civil))



@router.get("/disponibles")
def surveys_disponibles(
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    ahora = datetime.now(santo_domingo_tz)
    surveys = db.query(models.Survey).filter(
        ((models.Survey.fecha_expiracion == None) | (models.Survey.fecha_expiracion >= ahora)),
        models.Survey.active == True,              # 👈 solo activas
        models.Survey.closed_reason == None        # 👈 no cerradas      
    ).order_by(models.Survey.id.desc()).all()   # 👈 usar id si no existe fecha_creacion

    disponibles = []
    for s in surveys:
        try:
            if not cumple_segmentacion(s, usuario):
                continue

            ya_voto = db.query(models.Vote).filter(
                models.Vote.usuario_id == usuario.id,
                models.Vote.survey_id == s.id
            ).first()
            if ya_voto:
                continue

            preguntas = []
            for q in (s.questions or []):
                opciones = [{"id": o.id, "text": o.text} for o in (q.options or [])]
                preguntas.append({
                    "id": q.id,
                    "text": q.text,
                    "options": opciones,
                    "total_votes": None
                })

            media_urls = []
            if s.media_urls:
                try:
                    media_urls = json.loads(s.media_urls)
                except Exception:
                    media_urls = []

            visibilidad = getattr(s.visibilidad_resultados, "value", "publica")

            segundos_restantes = calcular_segundos_restantes(s.fecha_expiracion) if s.fecha_expiracion else 0

            disponibles.append({
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "fecha_expiracion": s.fecha_expiracion.isoformat() if s.fecha_expiracion else None,
                "segundos_restantes": segundos_restantes,
                "questions": preguntas,
                "media_url": s.media_url,
                "media_urls": media_urls,
                "visibilidad_resultados": visibilidad,
                "es_patrocinada": s.patrocinada,
                "patrocinador": s.patrocinador,
                "recompensa_puntos": s.recompensa_puntos,
                "recompensa_dinero": s.recompensa_dinero,
                "presupuesto_total": s.presupuesto_total,
                # 👇 campos de segmentación parseados
                "sexo": json.loads(s.sexo) if s.sexo else [],
                "ciudad": json.loads(s.ciudad) if s.ciudad else [],
                "ocupacion": json.loads(s.ocupacion) if s.ocupacion else [],
                "profesion": json.loads(s.profesion) if s.profesion else [],   # 👈 nuevo campo
                "nivel_educativo": json.loads(s.nivel_educativo) if s.nivel_educativo else [],
                "religion": json.loads(s.religion) if s.religion else [],
                "nacionalidad": json.loads(s.nacionalidad) if s.nacionalidad else [],
                "estado_civil": json.loads(s.estado_civil) if s.estado_civil else [],
            })




        except Exception as e:
            print(f"Error procesando encuesta {getattr(s, 'id', 'sin_id')}: {e}")
            continue

    return disponibles or []



# -------------------
# Endpoint: Encuestas Personales (simples + complejas normalizadas)
# -------------------

from votapp_app import models_simple

def build_survey_simple_response(s: models_simple.SurveySimple, usuario_id: int, db: Session):
    # Datos del creador
    creator = db.query(Usuario).filter(Usuario.id == s.usuario_id).first()

    # Buscar asignador en survey_assignments
    assignment = (
        db.query(SurveyAssignment)
        .filter(SurveyAssignment.survey_id == s.id,
                SurveyAssignment.asignado_a == usuario_id)
        .order_by(SurveyAssignment.id.desc())
        .first()
    )

    asignador_alias = None
    asignador_avatar_url = None

    if assignment:
        asignador = db.query(Usuario).filter(Usuario.id == assignment.asignado_por).first()
        if asignador:
            asignador_alias = getattr(asignador, "alias", None)
            asignador_avatar_url = getattr(asignador, "avatar_url", None)
    elif s.asignado_por:  # fallback para encuestas viejas
        asignador = db.query(Usuario).filter(Usuario.id == s.asignado_por).first()
        if asignador:
            asignador_alias = getattr(asignador, "alias", None)
            asignador_avatar_url = getattr(asignador, "avatar_url", None)

    return {
        "id": s.id,
        "title": s.titulo,
        "description": "",
        "fecha_creacion": s.fecha_creacion.isoformat() if s.fecha_creacion else None,
        "usuario_id": s.usuario_id,
        "current_user_id": usuario_id,
        "asignado_a": [x for x in (s.asignado_a or []) if x is not None],
        "fecha_expiracion": s.fecha_expiracion.isoformat() if s.fecha_expiracion else None,
        "segundos_restantes": calcular_segundos_restantes(s.fecha_expiracion) if s.fecha_expiracion else 0,
        "questions": [
            {
                "id": q.id,
                "text": q.texto,
                "options": [
                    {"id": o.id, "text": o.texto, "count": o.votos}
                    for o in q.opciones
                ],
                "total_votes": None,
            }
            for q in s.preguntas
        ],
        "media_urls": s.imagenes or [],
        "media_url": s.imagenes[0] if s.imagenes else None,
        "media_type": "image",
        "visibilidad_resultados": "publica",
        "patrocinada": False,
        "es_patrocinada": False,
        "patrocinador": None,
        "recompensa_puntos": 0,
        "recompensa_dinero": 0,
        "presupuesto_total": 0,
        "tipo": "simple",
        "usuario_alias": getattr(creator, "alias", None) if creator else None,
        "usuario_avatar_url": getattr(creator, "avatar_url", None) if creator else None,
        "asignador_alias": asignador_alias,
        "asignador_avatar_url": asignador_avatar_url,
    }



@router.get("/surveys/personales")
def surveys_personales(
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    ahora = datetime.now(santo_domingo_tz)
    personales = []

    # Encuestas complejas (propias o asignadas)
    propias = db.query(models.Survey).filter(models.Survey.usuario_id == usuario.id)
    asignadas = db.query(models.Survey).join(models.SurveyAssignment).filter(
        models.SurveyAssignment.assigned_user_id == usuario.id
    )
    surveys = propias.union(asignadas).order_by(models.Survey.id.desc()).all()

    for s in surveys:
        try:
            if s.fecha_expiracion and s.fecha_expiracion < ahora:
                continue
            if not cumple_segmentacion(s, usuario):
                continue
            ya_voto = db.query(models.Vote).filter(
                models.Vote.usuario_id == usuario.id,
                models.Vote.survey_id == s.id
            ).first()
            if ya_voto:
                continue

            preguntas = []
            for q in (s.questions or []):
                opciones = [{"id": o.id, "text": o.text} for o in (q.options or [])]
                preguntas.append({
                    "id": q.id,
                    "text": q.text,
                    "options": opciones,
                    "total_votes": None
                })

            media_urls = []
            if s.media_urls:
                try:
                    media_urls = json.loads(s.media_urls)
                except Exception:
                    media_urls = []

            visibilidad = getattr(s.visibilidad_resultados, "value", "publica")
            segundos_restantes = calcular_segundos_restantes(s.fecha_expiracion) if s.fecha_expiracion else 0

            personales.append({
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "fecha_expiracion": s.fecha_expiracion.isoformat() if s.fecha_expiracion else None,
                "segundos_restantes": segundos_restantes,
                "questions": preguntas,
                "media_url": s.media_url,
                "media_urls": media_urls,
                "media_type": s.media_type,
                "visibilidad_resultados": visibilidad,
                "patrocinada": s.patrocinada,
                "es_patrocinada": s.patrocinada,
                "patrocinador": s.patrocinador,
                "recompensa_puntos": s.recompensa_puntos,
                "recompensa_dinero": s.recompensa_dinero,
                "presupuesto_total": s.presupuesto_total,
                "usuario_id": s.usuario_id,
                "current_user_id": usuario.id,
                "tipo": "normal",
                # 👇 campos de segmentación parseados
                "sexo": json.loads(s.sexo) if s.sexo else [],
                "ciudad": json.loads(s.ciudad) if s.ciudad else [],
                "ocupacion": json.loads(s.ocupacion) if s.ocupacion else [],
                "profesion": json.loads(s.profesion) if s.profesion else [],   # 👈 nuevo campo
                "nivel_educativo": json.loads(s.nivel_educativo) if s.nivel_educativo else [],
                "religion": json.loads(s.religion) if s.religion else [],
                "nacionalidad": json.loads(s.nacionalidad) if s.nacionalidad else [],
                "estado_civil": json.loads(s.estado_civil) if s.estado_civil else [],
            })

        except Exception as e:
            print(f"Error procesando encuesta {getattr(s, 'id', 'sin_id')}: {e}")
            continue

    # Encuestas simples (propias o asignadas)
    print("Usuario actual:", usuario.id)

    simples = db.query(models_simple.SurveySimple).filter(
        (models_simple.SurveySimple.usuario_id == usuario.id) |
        (models_simple.SurveySimple.asignado_a.any(usuario.id))
    ).order_by(models_simple.SurveySimple.id.desc()).all()


    print("Encuestas simples encontradas:", [(s.id, s.titulo, s.asignado_a) for s in simples])


    for s in simples:
        try:
            personales.append(build_survey_simple_response(s, usuario.id, db))
        except Exception as e:
            print(f"Error procesando encuesta simple {getattr(s, 'id', 'sin_id')}: {e}")
            continue

    return personales or []



@router.get("/votadas")
def surveys_votadas(
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    ahora = datetime.now(santo_domingo_tz)
    surveys = db.query(models.Survey).filter(
        (models.Survey.fecha_expiracion == None) | (models.Survey.fecha_expiracion >= ahora)
    ).order_by(models.Survey.id.desc()).all()   # 👈 orden descendente

    votadas = []
    for s in surveys:
        try:
            if not cumple_segmentacion(s, usuario):
                continue

            ya_voto = db.query(models.Vote).filter(
                models.Vote.usuario_id == usuario.id,
                models.Vote.survey_id == s.id
            ).first()

            if ya_voto:
                preguntas = []
                for q in (s.questions or []):
                    try:
                        total_votes = db.query(models.Vote).filter(models.Vote.question_id == q.id).count() or 0
                    except Exception:
                        total_votes = 0

                    opciones = []
                    for o in (q.options or []):
                        try:
                            votes_count = db.query(models.Vote).filter(models.Vote.option_id == o.id).count() or 0
                        except Exception:
                            votes_count = 0
                        percentage = (votes_count / total_votes * 100) if total_votes > 0 else 0
                        opciones.append({
                            "id": o.id,
                            "text": o.text,
                            "count": votes_count,
                            "percentage": round(percentage, 1)
                        })

                    preguntas.append({
                        "id": q.id,
                        "text": q.text,
                        "options": opciones,
                        "total_votes": total_votes
                    })

                media_urls = []
                if s.media_urls:
                    try:
                        media_urls = json.loads(s.media_urls)
                    except Exception:
                        media_urls = []

                visibilidad = getattr(s.visibilidad_resultados, "value", "publica")

                segundos_restantes = calcular_segundos_restantes(s.fecha_expiracion) if s.fecha_expiracion else 0

                votadas.append({
                    "id": s.id,
                    "title": s.title,
                    "description": s.description,
                    "fecha_expiracion": s.fecha_expiracion.isoformat() if s.fecha_expiracion else None,
                    "segundos_restantes": segundos_restantes,
                    "questions": preguntas,
                    "media_url": s.media_url,
                    "media_urls": media_urls,
                    "visibilidad_resultados": visibilidad,
                    "es_patrocinada": s.patrocinada,
                    "patrocinador": s.patrocinador,
                    "recompensa_puntos": s.recompensa_puntos,
                    "recompensa_dinero": s.recompensa_dinero,
                    "presupuesto_total": s.presupuesto_total,
                    # 👇 campos de segmentación parseados
                    "sexo": json.loads(s.sexo) if s.sexo else [],
                    "ciudad": json.loads(s.ciudad) if s.ciudad else [],
                    "ocupacion": json.loads(s.ocupacion) if s.ocupacion else [],
                    "profesion": json.loads(s.profesion) if s.profesion else [],   # 👈 nuevo campo
                    "nivel_educativo": json.loads(s.nivel_educativo) if s.nivel_educativo else [],
                    "religion": json.loads(s.religion) if s.religion else [],
                    "nacionalidad": json.loads(s.nacionalidad) if s.nacionalidad else [],
                    "estado_civil": json.loads(s.estado_civil) if s.estado_civil else [],
                })

        except Exception as e:
            print(f"Error procesando encuesta {getattr(s, 'id', 'sin_id')}: {e}")
            continue

    return votadas or []


@router.get("/finalizadas")
def surveys_finalizadas(
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    ahora = datetime.now(santo_domingo_tz)
    limite = ahora - timedelta(days=7)   # 👈 solo últimos 15 días

    surveys = (
        db.query(models.Survey)
        .filter(models.Survey.fecha_expiracion < ahora)          # ya expiradas
        .filter(models.Survey.fecha_expiracion >= limite)        # no más de 15 días atrás
        .order_by(models.Survey.id.desc())
        .all()
    )

    finalizadas = []
    for s in surveys:
        try:
            if not cumple_segmentacion(s, usuario):
                continue

            preguntas = []
            for q in (s.questions or []):
                try:
                    total_votes = db.query(models.Vote).filter(models.Vote.question_id == q.id).count() or 0
                except Exception:
                    total_votes = 0

                opciones = []
                for o in (q.options or []):
                    try:
                        votes_count = db.query(models.Vote).filter(models.Vote.option_id == o.id).count() or 0
                    except Exception:
                        votes_count = 0
                    percentage = (votes_count / total_votes * 100) if total_votes > 0 else 0
                    opciones.append({
                        "id": o.id,
                        "text": o.text,
                        "count": votes_count,
                        "percentage": round(percentage, 1)
                    })

                preguntas.append({
                    "id": q.id,
                    "text": q.text,
                    "options": opciones,
                    "total_votes": total_votes
                })

            media_urls = []
            if s.media_urls:
                try:
                    media_urls = json.loads(s.media_urls)
                except Exception:
                    media_urls = []

            visibilidad = getattr(s.visibilidad_resultados, "value", "publica")

            finalizadas.append({
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "fecha_expiracion": s.fecha_expiracion.isoformat() if s.fecha_expiracion else None,
                "segundos_restantes": 0,
                "questions": preguntas,
                "media_url": s.media_url,
                "media_urls": media_urls,
                "visibilidad_resultados": visibilidad,
                "es_patrocinada": s.patrocinada,
                "patrocinador": s.patrocinador,
                "recompensa_puntos": s.recompensa_puntos,
                "recompensa_dinero": s.recompensa_dinero,
                "presupuesto_total": s.presupuesto_total,
                # 👇 campos de segmentación parseados
                "sexo": json.loads(s.sexo) if s.sexo else [],
                "ciudad": json.loads(s.ciudad) if s.ciudad else [],
                "ocupacion": json.loads(s.ocupacion) if s.ocupacion else [],
                "profesion": json.loads(s.profesion) if s.profesion else [],   # 👈 nuevo campo
                "nivel_educativo": json.loads(s.nivel_educativo) if s.nivel_educativo else [],
                "religion": json.loads(s.religion) if s.religion else [],
                "nacionalidad": json.loads(s.nacionalidad) if s.nacionalidad else [],
                "estado_civil": json.loads(s.estado_civil) if s.estado_civil else [],
            })


        except Exception as e:
            print(f"Error procesando encuesta {getattr(s, 'id', 'sin_id')}: {e}")
            continue

    return finalizadas or []



@router.get("/{survey_id}", response_model=schemas.SurveyDetailOut)
def get_survey_detail(
    survey_id: int,
    db: Session = Depends(get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    comments = db.query(models.Comment).filter(models.Comment.survey_id == survey_id).all()

    # ✅ Construcción parseando campos
    return schemas.SurveyDetailOut(
        id=survey.id,
        title=survey.title,
        description=survey.description,
        fecha_expiracion=survey.fecha_expiracion,
        fecha_creacion=survey.fecha_creacion,
        segundos_restantes=None,
        preguntas=[],  # mapear preguntas si lo necesitas
        imagenes=[],
        videos=[],
        media_url=survey.media_url,
        media_urls=json.loads(survey.media_urls) if survey.media_urls else [],
        media_type=survey.media_type,
        sexo=json.loads(survey.sexo) if survey.sexo else [],
        ciudad=json.loads(survey.ciudad) if survey.ciudad else [],
        ocupacion=json.loads(survey.ocupacion) if survey.ocupacion else [],
        profesion=json.loads(survey.profesion) if survey.profesion else [],   # 👈 nuevo campo
        nivel_educativo=json.loads(survey.nivel_educativo) if survey.nivel_educativo else [],
        religion=json.loads(survey.religion) if survey.religion else [],
        nacionalidad=json.loads(survey.nacionalidad) if survey.nacionalidad else [],
        estado_civil=json.loads(survey.estado_civil) if survey.estado_civil else [],
        patrocinada=survey.patrocinada,
        patrocinador=survey.patrocinador,
        recompensa_puntos=survey.recompensa_puntos,
        recompensa_dinero=survey.recompensa_dinero,
        presupuesto_total=survey.presupuesto_total,
        visibilidad_resultados=survey.visibilidad_resultados.value,
        comments=comments
    )





# -------------------
# Endpoint ADMIN: ver todas las encuestas
# -------------------
@router.get("/admin")
def get_all_surveys(db: Session = Depends(database.get_db)):
    surveys = db.query(models.Survey).all()

    result = []
    for s in surveys:
        preguntas = []
        for q in s.questions:
            opciones = [{"id": o.id, "text": o.text} for o in q.options]
            preguntas.append({
                "id": q.id,
                "text": q.text,
                "options": opciones,
                "total_votes": None
            })

            result.append({
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "fecha_expiracion": s.fecha_expiracion,
                "sexo": json.loads(s.sexo) if s.sexo else [],
                "ocupacion": json.loads(s.ocupacion) if s.ocupacion else [],
                "profesion": json.loads(s.profesion) if s.profesion else [],   # 👈 nuevo campo
                "nivel_educativo": json.loads(s.nivel_educativo) if s.nivel_educativo else [],
                "nacionalidad": json.loads(s.nacionalidad) if s.nacionalidad else [],
                "estado_civil": json.loads(s.estado_civil) if s.estado_civil else [],
                "religion": json.loads(s.religion) if s.religion else [],
                "ciudad": json.loads(s.ciudad) if s.ciudad else [],
                "media_url": s.media_url,
                "media_urls": json.loads(s.media_urls) if s.media_urls else [],
                "questions": preguntas,
                "visibilidad_resultados": s.visibilidad_resultados.value,
                "es_patrocinada": s.patrocinada,
                "patrocinador": s.patrocinador,
                "recompensa_puntos": s.recompensa_puntos,
                "recompensa_dinero": s.recompensa_dinero,
                "presupuesto_total": s.presupuesto_total,
            })


    return result


# -------------------
# Votar en encuesta
# -------------------
@router.post("/{survey_id}/vote", response_model=VoteResponse)
def vote(
    survey_id: int,
    vote: schemas.VoteBatchCreate,
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user_only)
):
    logging.info(f"➡️ Entrando a /vote con survey_id={survey_id}, usuario_id={usuario.id}")

    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    if survey.patrocinada and (survey.presupuesto_total or 0) <= 0:
        raise HTTPException(status_code=400, detail="Presupuesto agotado para esta encuesta patrocinada")

    sponsor = None
    perfil = None
    transaccion = None
    

    # -------------------
    # Bloque 1: Votos + Participación
    # -------------------
    if True:   # cambia a False para desactivar
        try:
            # Registrar votos
            for answer in vote.answers:
                logging.info(f"➡️ Procesando answer: question_id={answer.question_id}, option_id={answer.option_id}")
                option = db.query(models.Option).filter(models.Option.id == answer.option_id).first()
                if not option or option.question_id != answer.question_id:
                    logging.error("❌ Opción inválida detectada")
                    raise HTTPException(status_code=400, detail="Opción inválida")

                voto_existente = db.query(models.Vote).filter(
                    models.Vote.usuario_id == usuario.id,
                    models.Vote.question_id == answer.question_id
                ).first()

                if voto_existente:
                    logging.warning(f"❌ Ya existe voto previo en question_id={answer.question_id}")
                    raise HTTPException(status_code=400, detail=f"Ya votaste en la pregunta {answer.question_id}")

                db_vote = models.Vote(
                    survey_id=survey_id,
                    question_id=answer.question_id,
                    option_id=answer.option_id,
                    usuario_id=usuario.id,
                    creado_en=datetime.utcnow()
                )
                db.add(db_vote)
                logging.debug("➡️ Voto preparado: %s", db_vote.__dict__)

            # Registrar participación si no existe
            participacion_existente = db.query(models.Participacion).filter(
                models.Participacion.usuario_id == usuario.id,
                models.Participacion.survey_id == survey_id
            ).first()

            if not participacion_existente:
                nueva_participacion = models.Participacion(
                    usuario_id=usuario.id,
                    survey_id=survey_id,
                    fecha_participacion=datetime.utcnow(),
                    creado_en=datetime.utcnow()
                )
                db.add(nueva_participacion)
                logging.debug("➡️ Participación preparada: %s", nueva_participacion.__dict__)
            else:
                logging.info("ℹ️ Participación ya existente, no se crea nueva")

            # Intentar commit
            logging.info("➡️ Intentando commit de votos y participación...")
            db.commit()
            logging.info("✅ Commit ejecutado correctamente")

        except Exception as e:
            db.rollback()
            logging.exception("❌ Error en Bloque 1 durante commit")
            raise HTTPException(status_code=500, detail="Error interno en Bloque 1")



    # -------------------
    # Bloque 2: Patrocinio + Presupuesto
    # -------------------
    # Solo ejecutar si la encuesta está activa y no está pausada
    if survey.active and survey.closed_reason != "paused":
        transaccion = None
        if survey.patrocinada:
            sponsor_id = db.query(models.Survey.usuario_id).filter(models.Survey.id == survey_id).scalar()
            sponsor = db.query(models.Usuario).filter(models.Usuario.id == sponsor_id).first()

            if not sponsor or sponsor.rol != "sponsor":
                raise HTTPException(status_code=400, detail="Sponsor inválido para encuesta patrocinada")

            transaccion = models.SponsorTransaction(
                survey_id=survey.id,
                sponsor_id=sponsor.id,
                beneficiario_id=usuario.id,
                monto_dinero=survey.recompensa_dinero or 0,
                puntos=survey.recompensa_puntos or 0,
                timestamp=datetime.utcnow()
            )
            db.add(transaccion)
            db.flush()
            print("Transacción creada con ID:", transaccion.id)

            # Garantizar billeteras
            if not usuario.billetera:
                nueva_wallet = models.Wallet(usuario_id=usuario.id, balance=0)
                db.add(nueva_wallet)
                db.flush()
                db.refresh(nueva_wallet)
                usuario.billetera = nueva_wallet

            if not sponsor.billetera:
                nueva_wallet_sponsor = models.Wallet(usuario_id=sponsor.id, balance=0)
                db.add(nueva_wallet_sponsor)
                db.flush()
                db.refresh(nueva_wallet_sponsor)
                sponsor.billetera = nueva_wallet_sponsor

            # Merge para asegurar persistencia en la sesión
            usuario = db.merge(usuario)
            sponsor = db.merge(sponsor)

            if not usuario.billetera or not sponsor.billetera:
                raise HTTPException(status_code=500, detail="Error al cargar billeteras")

            # Crédito al votante
            wallet_votante = usuario.billetera
            wallet_votante.balance = (wallet_votante.balance or 0) + (survey.recompensa_dinero or 0)
            movimiento_ingreso = models.MovimientoWallet(
                wallet_id=wallet_votante.id,
                tipo="ingreso",
                monto=survey.recompensa_dinero or 0,
                fecha=datetime.utcnow(),
                sponsor_transaction_id=transaccion.id
            )
            db.add(movimiento_ingreso)

            # Débito al sponsor
            wallet_sponsor = sponsor.billetera
            wallet_sponsor.balance = (wallet_sponsor.balance or 0) - (survey.recompensa_dinero or 0)
            movimiento_egreso = models.MovimientoWallet(
                wallet_id=wallet_sponsor.id,
                tipo="egreso",
                monto=survey.recompensa_dinero or 0,
                fecha=datetime.utcnow(),
                sponsor_transaction_id=transaccion.id
            )
            db.add(movimiento_egreso)

    

        # Guardar presupuesto inicial antes de descontar
        presupuesto_inicial = survey.presupuesto_total or 0
        recompensa_dinero = survey.recompensa_dinero or 0

        # Descuento proporcional
        survey.presupuesto_total -= recompensa_dinero * len(vote.answers)

        # Calcular gasto acumulado
        total_votes = db.query(models.Vote).filter(models.Vote.survey_id == survey.id).count()
        spent_budget = total_votes * recompensa_dinero

        # Validar contra presupuesto inicial
        if spent_budget >= presupuesto_inicial:
            survey.presupuesto_total = 0
            survey.active = False
            survey.closed_at = datetime.utcnow()
            survey.closed_reason = "funds"
            logging.warning(f"💰 Encuesta {survey.id} cerrada automáticamente por presupuesto agotado")

        db.commit()
        db.refresh(survey)


    # -------------------
    # Bloque 3: Perfil + Logros
    # -------------------
    if True:   # cambia a False para desactivar
        perfil = db.query(models.PerfilPublico).filter_by(usuario_id=usuario.id).first()
        if perfil:
            hoy = datetime.utcnow().date()
            ultima = perfil.ultima_participacion if perfil.ultima_participacion else None

            if ultima == hoy - timedelta(days=1):
                perfil.racha_dias += 1
            elif ultima != hoy:
                perfil.racha_dias = 1

            perfil.ultima_participacion = hoy

            puntos_recompensa = survey.recompensa_puntos or 0
            perfil.puntos = (perfil.puntos or 0) + puntos_recompensa
            perfil.nivel = 1 + (perfil.puntos // 100)

            verificar_logros(db, usuario.id, perfil)

    # -------------------
    # Commit y respuesta
    # -------------------
    try:
        db.commit()
        usuario = db.merge(usuario)
        if usuario.billetera:
            db.refresh(usuario.billetera)

        if 'sponsor' in locals() and sponsor:
            sponsor = db.merge(sponsor)
            if sponsor.billetera:
                db.refresh(sponsor.billetera)
    except Exception as e:
        db.rollback()
        import traceback
        print("❌ Error inesperado:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error interno en el servidor")

    if 'perfil' in locals() and perfil:
        perfil = db.merge(perfil)
        db.refresh(perfil)

    balance = usuario.billetera.balance if usuario.billetera else None

    return {
        "message": "Votos y participación registrados correctamente",
        "survey_id": survey.id,
        "presupuesto_restante": survey.presupuesto_total,
        "usuario_puntos": perfil.puntos if 'perfil' in locals() and perfil else 0,
        "usuario_balance": balance,
        "usuario_nivel": perfil.nivel if 'perfil' in locals() and perfil else 0,
        "usuario_racha": perfil.racha_dias if 'perfil' in locals() and perfil else 0
    }



# -------------------
# Resultados de encuesta (APP-movil)
# -------------------


@router.get("/{survey_id}/results")
def get_results(
    survey_id: int,
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    # Control de visibilidad
    if survey.visibilidad_resultados.value == "privada":
        if not usuario.rol:
            raise HTTPException(status_code=403, detail="Tu rol no está definido")
        if usuario.rol != "admin" and (not survey.patrocinador or usuario.nombre != survey.patrocinador):
            raise HTTPException(status_code=403, detail="Resultados privados")

    results = []
    for question in survey.questions:
        options_data = []
        total_votes = db.query(models.Vote).filter(models.Vote.question_id == question.id).count()

        for option in question.options:
            votes_count = db.query(models.Vote).filter(models.Vote.option_id == option.id).count()
            percentage = (votes_count / total_votes * 100) if total_votes > 0 else 0
            options_data.append({
                "id": option.id,
                "text": option.text,
                "votes": votes_count,
                "percentage": round(percentage, 1),
            })

        results.append({
            "question_id": question.id,
            "question_text": question.text,
            "options": options_data,
            "total_votes": total_votes
        })

    return {
    "survey_id": survey.id,
    "title": survey.title,
    "media_url": survey.media_url,
    "media_urls": json.loads(survey.media_urls) if survey.media_urls else [],
    "visibilidad_resultados": survey.visibilidad_resultados.value,
    "es_patrocinada": survey.patrocinada,
    "patrocinador": survey.patrocinador,
    "recompensa_puntos": survey.recompensa_puntos,
    "recompensa_dinero": survey.recompensa_dinero,
    "presupuesto_total": survey.presupuesto_total,
    "results": results
}








# -------------------
# transactions en encuesta
# -------------------

@router.get("/{survey_id}/transactions")
def get_transactions(
    survey_id: int,
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    if usuario.rol != "admin" and usuario.nombre != survey.patrocinador:
        raise HTTPException(status_code=403, detail="Solo el patrocinador o admin pueden ver transacciones")

    transactions = db.query(models.SponsorTransaction).filter(
        models.SponsorTransaction.survey_id == survey_id
    ).all()

    return {
    "survey_id": survey.id,
    "title": survey.title,
    "patrocinador": survey.patrocinador,
    "es_patrocinada": survey.patrocinada,
    "visibilidad_resultados": survey.visibilidad_resultados.value,
    "recompensa_puntos": survey.recompensa_puntos,
    "recompensa_dinero": survey.recompensa_dinero,
    "presupuesto_total": survey.presupuesto_total,
    "transactions": [
        {
            "usuario_id": t.usuario_id,
            "monto_dinero": t.monto_dinero,
            "puntos": t.puntos,
            "timestamp": t.timestamp
        }
        for t in transactions
    ]
}




# -------------------
# Ver mis votos en una encuesta
# -------------------
@router.get("/{survey_id}/my-vote")
def get_my_vote(
    survey_id: int,
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    votes = db.query(models.Vote).filter(
        models.Vote.usuario_id == usuario.id,
        models.Vote.survey_id == survey_id
    ).all()

    return {
    "survey_id": survey.id,
    "title": survey.title,
    "es_patrocinada": survey.patrocinada,
    "patrocinador": survey.patrocinador,
    "visibilidad_resultados": survey.visibilidad_resultados.value,
    "recompensa_puntos": survey.recompensa_puntos,
    "recompensa_dinero": survey.recompensa_dinero,
    "presupuesto_total": survey.presupuesto_total,
    "answers": [
        {"question_id": v.question_id, "option_id": v.option_id}
        for v in votes
    ]
}

# -----------------------------
# Endpoint: Participar en Encuesta
# -----------------------------
@router.post("/surveys/{survey_id}/participate")
def participate(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    participacion = models.Participacion(
        usuario_id=current_user.id,
        survey_id=survey_id,
        fecha_participacion=datetime.utcnow()
    )
    db.add(participacion)
    db.commit()
    db.refresh(participacion)
    return {"message": "Participación registrada", "id": participacion.id}



# -------------------
# Historial de encuestas
# -------------------
@router.get("/mis-encuestas")
def historial_encuestas(
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user_only)
):
    participaciones = db.query(models.Participacion).filter(
        models.Participacion.usuario_id == usuario.id
    ).all()

    resultado = []
    for p in participaciones:
        resultado.append({
            "participacion_id": p.id,
            "fecha_participacion": p.fecha_participacion,
            "survey_id": p.survey.id,
            "survey_title": p.survey.title,
            "survey_description": p.survey.description,
        })

    return {"usuario_id": usuario.id, "historial": resultado}


# -----------------------------
# Historial de billetera (movimientos reales con encuestas patrocinadas)
# -----------------------------
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, Depends
from votapp_app import models
from votapp_app.schemas import WalletOut, MovimientoWalletOut, SurveyWalletOut, PreguntaOut
from votapp_app.database import get_db

@router.get("/users/me/wallet/history", response_model=WalletOut)
def get_wallet_history(
    db: Session = Depends(get_db),
    usuario: models.Usuario = Depends(get_current_user_only)
):
    # 👇 aquí imprimes el usuario que llega del token
    print("[BILLETERA] Usuario autenticado:", usuario.id)

    wallet = db.query(models.Wallet).filter(models.Wallet.usuario_id == usuario.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Billetera no encontrada")

    # ✅ Query devolviendo modelos completos con relaciones
    movimientos = (
        db.query(models.MovimientoWallet)
        .join(
            models.SponsorTransaction,
            models.SponsorTransaction.id == models.MovimientoWallet.sponsor_transaction_id
        )
        .join(
            models.Survey,
            models.Survey.id == models.SponsorTransaction.survey_id
        )
        .options(
            joinedload(models.MovimientoWallet.sponsor_transaction)
            .joinedload(models.SponsorTransaction.survey)
            .joinedload(models.Survey.questions)
        )
        .filter(models.MovimientoWallet.wallet_id == wallet.id)
        .all()
    )

    # 👇 Depuración: imprime cada movimiento y sus relaciones
    for m in movimientos:
        print("[DEBUG] Movimiento:", m.id, m.monto, m.fecha)
        print("[DEBUG] SponsorTransaction:", m.sponsor_transaction)
        if m.sponsor_transaction:
            print("[DEBUG] Survey:", m.sponsor_transaction.survey)

    # ✅ Construcción de la respuesta usando relaciones con validaciones
    movimientos_out = []
    for m in movimientos:
        survey = m.sponsor_transaction.survey if m.sponsor_transaction else None

        # 👇 convertir preguntas ORM a Pydantic
        preguntas_out = [PreguntaOut.from_orm(q) for q in survey.questions] if survey else []

        movimientos_out.append(
            MovimientoWalletOut(
                id=m.id,
                monto=m.monto,
                fecha=m.fecha,
                patrocinado=True,
                survey=SurveyWalletOut(
                    id=survey.id if survey else None,
                    title=survey.title if survey else None,
                    description=survey.description if survey else None,
                    media_url=survey.media_url if survey else None,
                    media_urls=survey.media_urls if survey else [],
                    questions=preguntas_out,
                    usuario_id=survey.usuario_id if survey else None
                ) if survey else None
            )
        )

    return WalletOut(
        id=wallet.id,
        balance=wallet.balance,
        actualizado_en=wallet.actualizado_en,
        movimientos=movimientos_out
    )





