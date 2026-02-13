

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from votapp_app import models, schemas, database
from votapp_app.auth import get_current_user



router = APIRouter(prefix="/comments", tags=["comments"])

# ✅ Crear comentario
@router.post("/", response_model=schemas.CommentOut)
def create_comment(
    comment: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # ✅ Validaciones extra
    if not comment.content.strip():
        raise HTTPException(status_code=400, detail="El comentario no puede estar vacío")
    if len(comment.content) > 500:
        raise HTTPException(status_code=400, detail="El comentario no puede superar los 500 caracteres")

    # 1. Verificar que la encuesta existe
    survey = db.query(models.Survey).filter(models.Survey.id == comment.survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    # 2. Verificar que el usuario participó en la encuesta
    participation = db.query(models.Vote).filter(
        models.Vote.survey_id == comment.survey_id,
        models.Vote.usuario_id == current_user.id
    ).first()
    if not participation:
        raise HTTPException(status_code=403, detail="Solo los participantes pueden comentar")

    # 3. Crear el comentario
    new_comment = models.Comment(
        survey_id=comment.survey_id,
        usuario_id=current_user.id,
        content=comment.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return new_comment



# ✅ Listar comentarios de una encuesta
@router.get("/survey/{survey_id}", response_model=list[schemas.CommentOut])
def get_comments_for_survey(
    survey_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # 1. Verificar que la encuesta existe
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    # 2. Obtener todos los comentarios asociados
    comments = db.query(models.Comment).filter(models.Comment.survey_id == survey_id).all()

    return comments

# ✅ Listar comentarios de un usuario
@router.get("/user/{user_id}", response_model=list[schemas.CommentOut])
def get_comments_for_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # 1. Verificar que el usuario existe
    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 2. Obtener todos los comentarios hechos por ese usuario
    comments = db.query(models.Comment).filter(models.Comment.usuario_id == user_id).all()  # ✅ corregido



    return comments

# ✅ Borrar comentario
@router.delete("/{comment_id}", response_model=schemas.CommentOut)
def delete_comment(
    comment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # 1. Buscar el comentario
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")

    # 2. Verificar que el comentario pertenece al usuario actual
    if comment.usuario_id != current_user.id:   # ✅ corregido

        raise HTTPException(status_code=403, detail="No puedes borrar comentarios de otros usuarios")

    # 3. Borrar el comentario
    db.delete(comment)
    db.commit()

    return comment

# ✅ Editar comentario
@router.put("/{comment_id}", response_model=schemas.CommentOut)
def update_comment(
    comment_id: int,
    updated_comment: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # 1. Buscar el comentario
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")

    # 2. Verificar que el comentario pertenece al usuario actual
    if comment.usuario_id != current_user.id:   # ✅ corregido
        raise HTTPException(status_code=403, detail="No puedes editar comentarios de otros usuarios")

    # ✅ Validaciones extra
    if not updated_comment.content.strip():
        raise HTTPException(status_code=400, detail="El comentario no puede estar vacío")
    if len(updated_comment.content) > 500:
        raise HTTPException(status_code=400, detail="El comentario no puede superar los 500 caracteres")

    # 3. Actualizar el contenido
    comment.content = updated_comment.content
    db.commit()
    db.refresh(comment)

    return comment

# ✅ Listar comentarios de una encuesta con paginación y ordenamiento
@router.get("/survey/{survey_id}", response_model=list[schemas.CommentOut])
def get_comments_for_survey(
    survey_id: int,
    skip: int = 0,              # 👈 número de comentarios a saltar
    limit: int = 10,            # 👈 número máximo de comentarios a devolver
    order: str = "desc",        # 👈 "asc" o "desc" para ordenar por fecha
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # 1. Verificar que la encuesta existe
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    # 2. Construir query con ordenamiento
    query = db.query(models.Comment).filter(models.Comment.survey_id == survey_id)
    if order == "asc":
        query = query.order_by(models.Comment.created_at.asc())
    else:
        query = query.order_by(models.Comment.created_at.desc())

    # 3. Aplicar paginación
    comments = query.offset(skip).limit(limit).all()

    return comments


# ✅ Contar comentarios de una encuesta
@router.get("/survey/{survey_id}/count")
def count_comments_for_survey(
    survey_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # 1. Verificar que la encuesta existe
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    # 2. Contar comentarios asociados
    count = db.query(models.Comment).filter(models.Comment.survey_id == survey_id).count()

    return {"survey_id": survey_id, "comments_count": count}

# ✅ Contar comentarios de un usuario
@router.get("/user/{user_id}/count")
def count_comments_for_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # 1. Verificar que el usuario existe
    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 2. Contar comentarios asociados al usuario
    count = db.query(models.Comment).filter(models.Comment.usuario_id == user_id).count()  # ✅ corregido



    return {"usuario_id": user_id, "comments_count": count}



