# votapp_app/controllers/usersControllers.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Usuario
from ..models_social import Friend  # 👈 importamos Friend desde models_social

router = APIRouter()

@router.get("/usuarios/{usuario_id}")
def get_usuario(
    usuario_id: int,
    current_user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    perfil = usuario.perfil_publico

    # Buscar estado de amistad
    friendship = db.query(Friend).filter(
        ((Friend.user_id == current_user_id) & (Friend.friend_id == usuario_id)) |
        ((Friend.user_id == usuario_id) & (Friend.friend_id == current_user_id))
    ).first()

    status = friendship.status if friendship else None
    friendship_id = friendship.id if friendship else None   # 👈 nuevo campo
    role = None
    if friendship:
        if current_user_id == friendship.user_id:
            role = "sent"
        elif current_user_id == friendship.friend_id:
            role = "received"

    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "correo": usuario.correo,
        "ciudad": usuario.ciudad,
        "profesion": usuario.profesion,
        "alias": perfil.alias if perfil else None,
        "avatar_url": perfil.avatar_url if perfil else None,
        "bio": perfil.bio if perfil else None,
        "nivel": perfil.nivel if perfil else None,
        "puntos": perfil.puntos if perfil else None,
        "racha_dias": perfil.racha_dias if perfil else None,
        "status": status,
        "friendship_id": friendship_id,   # 👈 agregado
        "role": role
    }




