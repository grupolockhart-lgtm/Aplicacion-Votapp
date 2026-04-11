

# votapp_app/routes/friends.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FriendCore   # <-- cambio aquí

router = APIRouter(prefix="/friends", tags=["friends"])

# -------------------
# ENDPOINT: Enviar solicitud de amistad
# -------------------
@router.post("/")
def send_friend_request(user_id: int, friend_id: int, db: Session = Depends(get_db)):
    existing = (
        db.query(FriendCore)   # <-- cambio aquí
        .filter(FriendCore.user_id == user_id, FriendCore.friend_id == friend_id)
        .first()
    )
    if existing:
        return {"message": "Ya existe una solicitud o amistad"}

    new_request = FriendCore(user_id=user_id, friend_id=friend_id, status="pending")  # <-- cambio aquí
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return {"message": "Solicitud enviada", "friendship": new_request}

