# votapp_app/controllers/friendsController.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models_social import Friend, Notification
from datetime import datetime

router = APIRouter()

# -------------------
# LISTAR AMIGOS
# -------------------
@router.get("/friends")
def list_friends(user_id: int, db: Session = Depends(get_db)):
    return db.query(Friend).filter(Friend.user_id == user_id, Friend.status == "accepted").all()


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

    # Notificación para el destinatario
    notification = Notification(
        user_id=friend_id,
        type="friend_request",
        message=f"Has recibido una solicitud de amistad de usuario {user_id}",
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
# ACEPTAR / RECHAZAR SOLICITUD + NOTIFICACIÓN
# -------------------
@router.put("/friends/{friendship_id}")
def update_friend_request(friendship_id: int, action: str, db: Session = Depends(get_db)):
    friendship = db.query(Friend).filter(Friend.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if action not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Acción inválida")

    friendship.status = action
    friendship.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(friendship)

    # Crear notificación para el solicitante si se acepta
    if action == "accepted":
        notification = Notification(
            user_id=friendship.user_id,  # el que envió la solicitud
            type="friend_request",
            message=f"Tu solicitud de amistad fue aceptada por usuario {friendship.friend_id}",
            related_id=friendship.id,
            status="unread",
            created_at=datetime.utcnow()
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        return {
            "message": "Solicitud aceptada y notificación creada",
            "friendship": friendship,
            "notification": notification
        }

    return {"message": f"Solicitud {action}", "friendship": friendship}


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