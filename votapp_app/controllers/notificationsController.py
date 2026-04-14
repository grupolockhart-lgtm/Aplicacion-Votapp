# votapp_app/controllers/notificationsController.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models_social import Notification, Friend
from ..models import Usuario
from datetime import datetime

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
        return f"Tienes una solicitud de amistad pendiente de {nombre_visible}"
    else:
        return f"Tu solicitud de amistad fue rechazada por {nombre_visible}"

# -------------------
# LISTAR NOTIFICACIONES
# -------------------
@router.get("/notifications")
def list_notifications(user_id: int, db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter(Notification.user_id == user_id).all()
    result = []

    for n in notifications:
        message = n.message
        from_user = None
        to_user = None

        # Si es notificación de amistad, reconstruir mensaje con nombre
        if n.type in ["friend_request", "friendship"] and n.related_id:
            friendship = db.query(Friend).filter(Friend.id == n.related_id).first()
            if friendship:
                message = build_friend_notification(friendship, user_id, db)
                # Identificar remitente y destinatario
                remitente = db.query(Usuario).filter(Usuario.id == friendship.user_id).first()
                destinatario = db.query(Usuario).filter(Usuario.id == friendship.friend_id).first()
                from_user = remitente.nombre or f"Usuario {remitente.id}"
                to_user = destinatario.nombre or f"Usuario {destinatario.id}"

        result.append({
            "id": n.id,
            "user_id": n.user_id,   # dueño de la notificación
            "type": n.type,
            "message": message,
            "related_id": n.related_id,
            "status": n.status,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "from_user": from_user,
            "to_user": to_user,
        })

    return result


# -------------------
# CREAR NOTIFICACIÓN
# -------------------
@router.post("/notifications")
def create_notification(
    user_id: int,
    type: str,
    message: str,
    related_id: int = None,
    db: Session = Depends(get_db)
):
    new_notification = Notification(
        user_id=user_id,
        type=type,
        message=message,
        related_id=related_id,
        status="unread",
        created_at=datetime.utcnow()
    )
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return {
        "message": "Notificación creada",
        "notification": {
            "id": new_notification.id,
            "user_id": new_notification.user_id,
            "type": new_notification.type,
            "message": new_notification.message,
            "related_id": new_notification.related_id,
            "status": new_notification.status,
            "created_at": new_notification.created_at.isoformat() if new_notification.created_at else None,
        }
    }

# -------------------
# MARCAR COMO LEÍDA
# -------------------
@router.put("/notifications/{notification_id}/read")
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    notification.status = "read"
    db.commit()
    db.refresh(notification)
    return {"message": "Notificación marcada como leída", "notification": notification}

# -------------------
# ELIMINAR NOTIFICACIÓN
# -------------------
@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    db.delete(notification)
    db.commit()
    return {"message": "Notificación eliminada"}

# -------------------
# MARCAR TODAS COMO LEÍDAS
# -------------------
@router.put("/notifications/read_all")
def mark_all_as_read(user_id: int, db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter(Notification.user_id == user_id, Notification.status == "unread").all()
    for n in notifications:
        n.status = "read"
    db.commit()
    return {"message": f"{len(notifications)} notificaciones marcadas como leídas"}

# -------------------
# ELIMINAR TODAS LAS NOTIFICACIONES DE UN USUARIO
# -------------------
@router.delete("/notifications/all")
def delete_all_notifications(user_id: int, db: Session = Depends(get_db)):
    deleted_count = db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.commit()
    return {"message": f"Se eliminaron {deleted_count} notificaciones del usuario {user_id}"}

# -------------------
# CONTAR NOTIFICACIONES NO LEÍDAS
# -------------------
@router.get("/notifications/unread_count")
def unread_notifications_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.status == "unread"
    ).count()
    return {"unread_count": count}
