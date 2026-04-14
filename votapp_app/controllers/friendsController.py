# votapp_app/controllers/friendsController.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from ..database import get_db
from ..models_social import Friend, Notification
from ..models import Usuario, PerfilPublico

router = APIRouter()

# -------------------
# Helper para notificaciones de amistad
# -------------------
def build_friend_notification(f: Friend, current_user_id: int, db: Session):
    # Determinar quién es el "otro" usuario en la relación
    other_id = f.friend_id if f.user_id == current_user_id else f.user_id
    other = db.query(Usuario).filter(Usuario.id == other_id).first()

    # Usar nombre como principal, con fallback al ID si está vacío
    nombre_visible = other.nombre or f"Usuario {other.id}"

    if f.status == "accepted":
        return f"Tu solicitud de amistad fue aceptada por {nombre_visible}"
    elif f.status == "pending":
        return f"Tienes una solicitud de amistad pendiente de {nombre_visible}"
    else:
        return f"Tu solicitud de amistad fue rechazada por {nombre_visible}"

# -------------------
# LISTAR AMIGOS
# -------------------
@router.get("/friends")
def list_friends(user_id: int, db: Session = Depends(get_db)):
    friendships = (
        db.query(Friend)
        .options(
            joinedload(Friend.user).joinedload(Usuario.perfil_publico),
            joinedload(Friend.friend).joinedload(Usuario.perfil_publico),
        )
        .filter(
            ((Friend.user_id == user_id) | (Friend.friend_id == user_id)),
            Friend.status == "accepted"
        )
        .all()
    )

    result = []
    for f in friendships:
        # Determinar quién es el "otro" amigo
        other = f.friend if f.user_id == user_id else f.user
        perfil = getattr(other, "perfil_publico", None)

        result.append({
            "id": f.id,
            "friend_id": other.id,
            "status": f.status,
            "nombre": other.nombre,
            "correo": other.correo,
            "alias": perfil.alias if perfil else None,
            "avatar_url": perfil.avatar_url if perfil else None,
            "bio": perfil.bio if perfil else None,
        })
    return result

# -------------------
# ENVIAR SOLICITUD DE AMISTAD + NOTIFICACIÓN
# -------------------
@router.post("/friends/request")
def send_friend_request(user_id: int, friend_id: int, db: Session = Depends(get_db)):
    existing = db.query(Friend).filter(Friend.user_id == user_id, Friend.friend_id == friend_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="La solicitud ya existe")

    new_request = Friend(
        user_id=user_id,
        friend_id=friend_id,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # Notificación al destinatario
    other = db.query(Usuario).filter(Usuario.id == user_id).first()
    nombre_visible = other.nombre or f"Usuario {other.id}"

    notification = Notification(
        user_id=friend_id,
        type="friend_request",
        message=f"Has recibido una solicitud de amistad de {nombre_visible}",
        related_id=new_request.id,
        status="unread",
        created_at=datetime.utcnow()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "message": "Solicitud enviada y notificación creada",
        "friendship": new_request,
        "notification": notification
    }

# -------------------
# ACEPTAR / RECHAZAR SOLICITUD + ACTUALIZAR NOTIFICACIÓN
# -------------------
@router.put("/friends/{friendship_id}")
def update_friend_request(friendship_id: int, action: str, db: Session = Depends(get_db)):
    friendship = db.query(Friend).filter(Friend.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if action not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Acción inválida")

    # Actualizar estado de la solicitud
    friendship.status = action
    friendship.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(friendship)

    # Buscar la notificación original relacionada
    notification = db.query(Notification).filter(Notification.related_id == friendship.id).first()
    if notification:
        mensaje = build_friend_notification(friendship, friendship.user_id, db)
        notification.message = mensaje
        notification.status = "unread"
        db.commit()
        db.refresh(notification)

    return {
        "message": f"Solicitud {action}",
        "friendship": friendship,
        "notification": notification if notification else None
    }

# -------------------
# ELIMINAR AMISTAD
# -------------------
@router.delete("/friends/{friendship_id}")
def delete_friendship(friendship_id: int, db: Session = Depends(get_db)):
    friendship = db.query(Friend).filter(Friend.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Amistad no encontrada")

    db.delete(friendship)
    db.commit()
    return {"message": "Amistad eliminada"}

# -------------------
# BUSCAR AMIGOS POR NOMBRE O CORREO
# -------------------
@router.get("/friends/search")
def search_friends(query: str = Query(...), current_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Debes ingresar un término de búsqueda")

    results = (
        db.query(Usuario)
        .options(joinedload(Usuario.perfil_publico))
        .filter(
            ((Usuario.nombre.ilike(f"%{query}%")) |
             (Usuario.correo.ilike(f"%{query}%"))) &
            (Usuario.id != current_user_id)
        )
        .all()
    )

    if not results:
        return {"message": "No se encontraron usuarios"}

    formatted = []
    for u in results:
        perfil = u.perfil_publico
        formatted.append({
            "id": u.id,
            "nombre": u.nombre,
            "correo": u.correo,
            "alias": perfil.alias if perfil else None,
            "avatar_url": perfil.avatar_url if perfil else None,
            "bio": perfil.bio if perfil else None,
        })

    return {"results": formatted}







