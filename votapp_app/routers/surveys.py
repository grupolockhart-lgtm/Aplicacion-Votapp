from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database
from ..auth import (
    get_current_user,
    get_current_admin,
    get_current_sponsor,
    get_current_user_only   # ✅ ahora sí disponible
)


import json
from datetime import datetime, timedelta


from zoneinfo import ZoneInfo
from sqlalchemy.exc import IntegrityError
from ..database import get_db
from .logros import verificar_logros








router = APIRouter(prefix="/surveys", tags=["surveys"])

# Zona horaria
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
        survey_out = schemas.SurveyOut.from_orm(survey)
        survey_out.media_urls = json.loads(survey.media_urls) if survey.media_urls else []
        survey_out.visibilidad_resultados = survey.visibilidad_resultados.value

        # 👇 asignación explícita de recompensas
        survey_out.recompensa_puntos = survey.recompensa_puntos
        survey_out.recompensa_dinero = survey.recompensa_dinero
        survey_out.presupuesto_total = survey.presupuesto_total

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

    # Validación: si es patrocinada, debe tener recompensa_dinero > 0
    if survey.patrocinada and (not survey.recompensa_dinero or survey.recompensa_dinero <= 0):
        raise HTTPException(
            status_code=400,
            detail="Las encuestas patrocinadas deben tener una recompensa_dinero mayor a 0"
        )

    try:
        # Log del payload recibido
        print("Payload recibido:", survey.dict())

        db_survey = models.Survey(
            title=survey.title,
            description=survey.description,
            fecha_expiracion=survey.fecha_expiracion,
            sexo=survey.sexo,
            ciudad=survey.ciudad,
            ocupacion=survey.ocupacion,
            nivel_educativo=survey.nivel_educativo,
            religion=survey.religion,
            nacionalidad=survey.nacionalidad,
            estado_civil=survey.estado_civil,
            media_url=survey.media_url,
            media_urls=json.dumps(survey.media_urls) if survey.media_urls else "[]",
            patrocinada=survey.patrocinada,
            patrocinador=survey.patrocinador,
            recompensa_puntos=survey.recompensa_puntos,
            recompensa_dinero=survey.recompensa_dinero,
            presupuesto_total=survey.presupuesto_total,
            visibilidad_resultados=models.VisibilidadResultados(survey.visibilidad_resultados),
        )

        db.add(db_survey)
        db.flush()

        for q in survey.questions:
            db_question = models.Question(text=q.text, survey_id=db_survey.id)
            db.add(db_question)
            db.flush()
            for opt in q.options:
                db_option = models.Option(text=opt.text, question_id=db_question.id)
                db.add(db_option)

        db.commit()
        db.refresh(db_survey)

        # Log de lo que realmente quedó en la DB
        print("Persistido en DB:", db_survey.recompensa_puntos, db_survey.recompensa_dinero, db_survey.presupuesto_total)

        # salida basada en lo que quedó en DB
        survey_out = schemas.SurveyOut(
            id=db_survey.id,
            title=db_survey.title,
            description=db_survey.description,
            fecha_expiracion=db_survey.fecha_expiracion,
            questions=db_survey.questions,
            media_url=db_survey.media_url,
            media_urls=json.loads(db_survey.media_urls) if db_survey.media_urls else [],
            sexo=db_survey.sexo,
            ciudad=db_survey.ciudad,
            ocupacion=db_survey.ocupacion,
            nivel_educativo=db_survey.nivel_educativo,
            religion=db_survey.religion,
            nacionalidad=db_survey.nacionalidad,
            estado_civil=db_survey.estado_civil,
            patrocinada=db_survey.patrocinada,
            patrocinador=db_survey.patrocinador,
            recompensa_puntos=db_survey.recompensa_puntos,   # 👈 ahora viene de DB
            recompensa_dinero=db_survey.recompensa_dinero,
            presupuesto_total=db_survey.presupuesto_total,
            visibilidad_resultados=db_survey.visibilidad_resultados.value,
        )

        return survey_out

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

# -------------------
# Listar encuestas
# -------------------
@router.get("/")
def list_surveys(db: Session = Depends(database.get_db), usuario: models.Usuario = Depends(get_current_user)):
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
            "media_urls": json.loads(s.media_urls) if s.media_urls else []
        })
    return result

# -------------------
# Disponibles, votadas, finalizadas
# -------------------
def cumple_segmentacion(survey: models.Survey, usuario: models.Usuario) -> bool:
    sexo = [s.lower() for s in json.loads(survey.sexo)] if survey.sexo else []
    ciudad = [c.lower() for c in json.loads(survey.ciudad)] if survey.ciudad else []
    ocupacion = [o.lower() for o in json.loads(survey.ocupacion)] if survey.ocupacion else []
    nivel_educativo = [n.lower() for n in json.loads(survey.nivel_educativo)] if survey.nivel_educativo else []
    religion = [r.lower() for r in json.loads(survey.religion)] if survey.religion else []
    nacionalidad = [n.lower() for n in json.loads(survey.nacionalidad)] if survey.nacionalidad else []
    estado_civil = [e.lower() for e in json.loads(survey.estado_civil)] if survey.estado_civil else []

    return (not sexo or (usuario.sexo and usuario.sexo.lower() in sexo)) and \
        (not ciudad or (usuario.ciudad and usuario.ciudad.lower() in ciudad)) and \
        (not ocupacion or (usuario.ocupacion and usuario.ocupacion.lower() in ocupacion)) and \
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
        (models.Survey.fecha_expiracion == None) | (models.Survey.fecha_expiracion >= ahora)
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
            })



        except Exception as e:
            print(f"Error procesando encuesta {getattr(s, 'id', 'sin_id')}: {e}")
            continue

    return disponibles or []



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
            })

        except Exception as e:
            print(f"Error procesando encuesta {getattr(s, 'id', 'sin_id')}: {e}")
            continue

    return finalizadas or []



@router.get("/{survey_id}", response_model=schemas.SurveyDetailOut)
def get_survey_detail(
    survey_id: int,
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user)
):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    comments = db.query(models.Comment).filter(models.Comment.survey_id == survey_id).all()

    # 👇 construcción simplificada
    survey_out = schemas.SurveyDetailOut.from_orm(survey)
    survey_out.media_urls = json.loads(survey.media_urls) if survey.media_urls else []
    survey_out.visibilidad_resultados = survey.visibilidad_resultados.value
    survey_out.comments = comments

    return survey_out





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
            "ocupacion": json.loads(s.ocupacion) if s.ocupacion else [],
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
@router.post("/{survey_id}/vote")
def vote(
    survey_id: int,
    vote: schemas.VoteBatchCreate,
    db: Session = Depends(database.get_db),
    usuario: models.Usuario = Depends(get_current_user_only)
):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    if survey.patrocinada and (survey.presupuesto_total or 0) <= 0:
        raise HTTPException(status_code=400, detail="Presupuesto agotado para esta encuesta patrocinada")

    # Registrar votos
    for answer in vote.answers:
        option = db.query(models.Option).filter(models.Option.id == answer.option_id).first()
        if not option or option.question_id != answer.question_id:
            raise HTTPException(status_code=400, detail="Opción inválida")

        if db.query(models.Vote).filter(
            models.Vote.usuario_id == usuario.id,
            models.Vote.question_id == answer.question_id
        ).first():
            raise HTTPException(status_code=400, detail=f"Ya votaste en la pregunta {answer.question_id}")

        db_vote = models.Vote(
            survey_id=survey_id,
            question_id=answer.question_id,
            option_id=answer.option_id,
            usuario_id=usuario.id
        )
        db.add(db_vote)

    # Registrar participación si no existe
    participacion_existente = db.query(models.Participacion).filter(
        models.Participacion.usuario_id == usuario.id,
        models.Participacion.survey_id == survey_id
    ).first()

    if not participacion_existente:
        nueva_participacion = models.Participacion(
            usuario_id=usuario.id,
            survey_id=survey_id,
            fecha_participacion=datetime.utcnow()
        )
        db.add(nueva_participacion)

    # Mantener billetera intacta
    if usuario.billetera and survey.recompensa_dinero:
        wallet = db.query(models.Wallet).filter_by(id=usuario.billetera.id).first()
        wallet.balance = (wallet.balance or 0) + survey.recompensa_dinero
        movimiento = models.MovimientoWallet(
            wallet_id=wallet.id,
            tipo="ingreso",
            monto=survey.recompensa_dinero
        )
        db.add(movimiento)

    if survey.patrocinada:
        transaccion = models.SponsorTransaction(
            survey_id=survey.id,
            usuario_id=usuario.id,
            monto_dinero=survey.recompensa_dinero or 0,
            puntos=survey.recompensa_puntos or 0,
        )
        db.add(transaccion)

    # Ajustar presupuesto
    survey.presupuesto_total = survey.presupuesto_total or 0
    recompensa_dinero = survey.recompensa_dinero or 0
    survey.presupuesto_total -= recompensa_dinero
    if survey.presupuesto_total < 0:
        survey.presupuesto_total = 0

    # Bloque de perfil SIEMPRE se ejecuta
    perfil = db.query(models.PerfilPublico).filter_by(usuario_id=usuario.id).first()
    if perfil:
        hoy = datetime.utcnow().date()
        if perfil.ultima_participacion == hoy - timedelta(days=1):
            perfil.racha_dias += 1
        elif perfil.ultima_participacion != hoy:
            perfil.racha_dias = 1
        perfil.ultima_participacion = hoy

        puntos_recompensa = survey.recompensa_puntos or 0
        perfil.puntos = (perfil.puntos or 0) + puntos_recompensa
        perfil.nivel = 1 + (perfil.puntos // 100)

        verificar_logros(db, usuario.id, perfil)

    db.commit()
    db.refresh(perfil)

    try:
        db.expire_all()
        usuario = db.query(models.Usuario).filter_by(id=usuario.id).first()
        balance = usuario.billetera.balance if usuario.billetera else None
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Ya existe un voto registrado para esta pregunta")
    except Exception as e:
        db.rollback()
        print(f"Error inesperado en /vote (survey_id={survey_id}, usuario_id={usuario.id}): {e}")
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")

    return {
        "message": "Votos y participación registrados correctamente",
        "survey_id": survey.id,
        "presupuesto_restante": survey.presupuesto_total,
        "usuario_puntos": perfil.puntos,
        "usuario_balance": balance,
        "usuario_nivel": perfil.nivel,
        "usuario_racha": perfil.racha_dias
    }













# -------------------
# Resultados de encuesta
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


