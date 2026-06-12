from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database, schemas
from ..auth import get_current_user

import json

router = APIRouter(prefix="/admin", tags=["admin"])

# -------------------
# Validación: solo admins pueden acceder
# -------------------
def get_current_admin(usuario: models.Usuario = Depends(get_current_user)):
    if usuario.rol != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    return usuario

# -------------------
# Listar encuestas
# -------------------
@router.get("/surveys")
def listar_encuestas_admin(
    db: Session = Depends(database.get_db),
    admin: models.Usuario = Depends(get_current_admin)
):
    surveys = db.query(models.Survey).order_by(models.Survey.id.desc()).all()
    result = []
    for s in surveys:
        result.append({
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "fecha_expiracion": s.fecha_expiracion,
            "sexo": json.loads(s.sexo) if s.sexo else [],
            "ciudad": json.loads(s.ciudad) if s.ciudad else [],
            "ocupacion": json.loads(s.ocupacion) if s.ocupacion else [],
            "nivel_educativo": json.loads(s.nivel_educativo) if s.nivel_educativo else [],
            "religion": json.loads(s.religion) if s.religion else [],
            "nacionalidad": json.loads(s.nacionalidad) if s.nacionalidad else [],
            "estado_civil": json.loads(s.estado_civil) if s.estado_civil else [],
            "media_url": s.media_url,
            "media_urls": json.loads(s.media_urls) if s.media_urls else [],
            "visibilidad_resultados": s.visibilidad_resultados.value,
            "es_patrocinada": s.patrocinada,
            "patrocinador": s.patrocinador,
            "recompensa_puntos": s.recompensa_puntos,
            "recompensa_dinero": s.recompensa_dinero,
            "presupuesto_total": s.presupuesto_total,
        })
    return result


# -------------------
# Modificar encuesta (solo cambios seguros si ya tiene votos)
# -------------------
@router.put("/surveys/{survey_id}")
def modificar_encuesta(
    survey_id: int,
    datos: schemas.SurveyUpdate,
    db: Session = Depends(database.get_db),
    admin: models.Usuario = Depends(get_current_admin)
):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    # ⚠️ Validar si ya tiene votos
    votos_existentes = db.query(models.Vote).filter(models.Vote.survey_id == survey_id).count()

    if votos_existentes > 0:
        # Solo cambios seguros
        if datos.titulo is not None:
            survey.titulo = datos.titulo
        if datos.descripcion is not None:
            survey.descripcion = datos.descripcion
        if datos.estado is not None:
            survey.estado = datos.estado
        # Aquí puedes añadir otros metadatos seguros como fecha_expiracion, patrocinio, visibilidad_resultados
    else:
        # Si no tiene votos, se pueden permitir más cambios
        if datos.titulo is not None:
            survey.titulo = datos.titulo
        if datos.descripcion is not None:
            survey.descripcion = datos.descripcion
        if datos.estado is not None:
            survey.estado = datos.estado
        # Aquí podrías permitir modificar preguntas/opciones si lo deseas

    db.commit()
    db.refresh(survey)

    return {
        "message": f"Encuesta {survey_id} modificada correctamente",
        "id": survey.id,
        "titulo": survey.titulo,
        "descripcion": survey.descripcion,
        "estado": survey.estado
    }

# -------------------
# Eliminar encuesta
# -------------------
@router.delete("/surveys/{survey_id}")
def eliminar_encuesta(
    survey_id: int,
    db: Session = Depends(database.get_db),
    admin: models.Usuario = Depends(get_current_admin)
):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    # Borrar votos asociados
    db.query(models.Vote).filter(models.Vote.survey_id == survey_id).delete()

    # Borrar opciones y preguntas asociadas
    for question in survey.questions:
        db.query(models.Option).filter(models.Option.question_id == question.id).delete()
        db.delete(question)

    # Finalmente borrar la encuesta
    db.delete(survey)
    db.commit()

    return {
        "message": f"Encuesta {survey_id} eliminada correctamente",
        "titulo": survey.titulo,
        "es_patrocinada": survey.patrocinada,
        "visibilidad_resultados": survey.visibilidad_resultados.value
    }

# -------------------
# Duplicar encuesta (para cambios estructurales)
# -------------------
@router.post("/surveys/{survey_id}/duplicate")
def duplicar_encuesta(
    survey_id: int,
    db: Session = Depends(database.get_db),
    admin: models.Usuario = Depends(get_current_admin)
):
    original = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    # Calcular versión nueva
    nueva_version = (original.version or 1) + 1

    nueva = models.Survey(
        titulo = original.titulo + f" (versión {nueva_version})",
        descripcion = original.descripcion,
        estado = "activa",
        patrocinada = original.patrocinada,
        patrocinador = original.patrocinador,
        recompensa_puntos = original.recompensa_puntos,
        recompensa_dinero = original.recompensa_dinero,
        presupuesto_total = original.presupuesto_total,
        visibilidad_resultados = original.visibilidad_resultados,
        id_original = original.id,
        version = nueva_version
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return {
        "message": "Encuesta duplicada correctamente",
        "id_original": original.id,
        "id_nueva": nueva.id,
        "version_nueva": nueva.version,
        "titulo_nueva": nueva.titulo
    }



# -------------------
# Historial de versiones de una encuesta
# -------------------
@router.get("/surveys/history/{original_id}")
def historial_encuestas(
    original_id: int,
    db: Session = Depends(database.get_db),
    admin: models.Usuario = Depends(get_current_admin)
):
    encuestas = (
        db.query(models.Survey)
        .filter(
            (models.Survey.id == original_id) | 
            (models.Survey.id_original == original_id)
        )
        .order_by(models.Survey.version.asc())
        .all()
    )

    if not encuestas:
        raise HTTPException(status_code=404, detail="No se encontró historial para esta encuesta")

    result = []
    for s in encuestas:
        result.append({
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "fecha_expiracion": s.fecha_expiracion,
            "version": s.version,
            "sexo": json.loads(s.sexo) if s.sexo else [],
            "ciudad": json.loads(s.ciudad) if s.ciudad else [],
            "ocupacion": json.loads(s.ocupacion) if s.ocupacion else [],
            "nivel_educativo": json.loads(s.nivel_educativo) if s.nivel_educativo else [],
            "religion": json.loads(s.religion) if s.religion else [],
            "nacionalidad": json.loads(s.nacionalidad) if s.nacionalidad else [],
            "estado_civil": json.loads(s.estado_civil) if s.estado_civil else [],
            "media_url": s.media_url,
            "media_urls": json.loads(s.media_urls) if s.media_urls else [],
            "visibilidad_resultados": s.visibilidad_resultados.value,
            "es_patrocinada": s.patrocinada,
            "patrocinador": s.patrocinador,
            "recompensa_puntos": s.recompensa_puntos,
            "recompensa_dinero": s.recompensa_dinero,
            "presupuesto_total": s.presupuesto_total,
        })
    return result




