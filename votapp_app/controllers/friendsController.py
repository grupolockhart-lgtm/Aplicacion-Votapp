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
    other_id = f.friend_id if f.user_id == current_user_id else f.user_id
    other = db.query(Usuario).filter(Usuario.id == other_id).first()
    nombre_visible = other.nombre or f"Usuario {other.id}"

    if f.status == "accepted":
        return f"Tu solicitud de amistad fue aceptada por {nombre_visible}"
    elif f.status == "pending":
        if current_user_id == f.user_id:
            # El usuario actual es el remitente
            return f"Has enviado una solicitud de amistad a {nombre_visible}, pendiente de respuesta"
        else:
            # El usuario actual es el destinatario
            return f"Has recibido una solicitud de amistad de {nombre_visible}"
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
# LISTAR SOLICITUDES PENDIENTES
# -------------------
@router.get("/friends/pending")
def list_pending_requests(current_user_id: int, db: Session = Depends(get_db)):
    requests = (
        db.query(Friend)
        .filter(
            ((Friend.user_id == current_user_id) | (Friend.friend_id == current_user_id)),
            Friend.status == "pending"
        )
        .all()
    )

    result = []
    for f in requests:
        other_id = f.friend_id if f.user_id == current_user_id else f.user_id
        other = db.query(Usuario).filter(Usuario.id == other_id).first()
        perfil = getattr(other, "perfil_publico", None)

        result.append({
            "id": f.id,
            "status": f.status,
            "otro_usuario_id": other.id,
            "nombre": other.nombre,
            "correo": other.correo,
            "alias": perfil.alias if perfil else None,
            "avatar_url": perfil.avatar_url if perfil else None,
            "bio": perfil.bio if perfil else None,
            "mensaje": build_friend_notification(f, current_user_id, db)
        })
    return result

# -------------------
# ENVIAR SOLICITUD DE AMISTAD + NOTIFICACIONES
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

    # Obtener nombres visibles
    remitente = db.query(Usuario).filter(Usuario.id == user_id).first()
    destinatario = db.query(Usuario).filter(Usuario.id == friend_id).first()
    nombre_remitente = remitente.nombre or f"Usuario {remitente.id}"
    nombre_destinatario = destinatario.nombre or f"Usuario {destinatario.id}"

    # Notificación al destinatario
    notif_dest = Notification(
        user_id=friend_id,
        type="friend_request",
        message=f"Has recibido una solicitud de amistad de {nombre_remitente}",
        related_id=new_request.id,
        status="unread",
        created_at=datetime.utcnow()
    )

    # Notificación al remitente
    notif_rem = Notification(
        user_id=user_id,
        type="friend_request",
        message=f"Has enviado una solicitud de amistad a {nombre_destinatario}",
        related_id=new_request.id,
        status="unread",
        created_at=datetime.utcnow()
    )

    db.add_all([notif_dest, notif_rem])
    db.commit()
    db.refresh(notif_dest)
    db.refresh(notif_rem)

    return {
        "message": "Solicitud enviada y notificaciones creadas",
        "friendship": new_request,
        "notifications": [notif_dest, notif_rem]
    }

# -------------------
# ACEPTAR / RECHAZAR SOLICITUD + NOTIFICACIÓN AL REMITENTE
# -------------------
@router.put("/friends/{friendship_id}")
def update_friend_request(friendship_id: int, action: str, db: Session = Depends(get_db)):
    friendship = db.query(Friend).filter(Friend.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if action not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Acción inválida")

    # Actualizar estado de la amistad
    friendship.status = action
    friendship.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(friendship)

    # Marcar notificaciones previas como leídas
    db.query(Notification).filter(
        Notification.related_id == friendship_id,
        Notification.type == "friend_request",
        Notification.status == "unread"
    ).update({"status": "read"})
    db.commit()

    # Crear notificación para el remitente
    remitente_id = friendship.user_id
    destinatario = db.query(Usuario).filter(Usuario.id == friendship.friend_id).first()
    nombre_destinatario = destinatario.nombre or f"Usuario {destinatario.id}"

    if action == "accepted":
        mensaje = f"Tu solicitud de amistad fue aceptada por {nombre_destinatario}"
    else:
        mensaje = f"Tu solicitud de amistad fue rechazada por {nombre_destinatario}"

    notif_rem = Notification(
        user_id=remitente_id,
        type="friend_request",
        message=mensaje,
        related_id=friendship.id,
        status="unread",
        created_at=datetime.utcnow()
    )

    db.add(notif_rem)
    db.commit()
    db.refresh(notif_rem)

    return {
        "message": f"Solicitud {action}",
        "friendship": friendship,
        "notification": notif_rem
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
