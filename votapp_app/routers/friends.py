
# votapp_app/routes/friends.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from ..database import get_db
from ..models import FriendCore, Usuario, Notification

router = APIRouter(prefix="/friends", tags=["friends"])

# -------------------
# SCHEMA PARA SOLICITUD DE AMISTAD
# -------------------
class FriendRequestSchema(BaseModel):
    user_id: int
    friend_id: int

# -------------------
# ENDPOINT: Enviar solicitud de amistad
# -------------------
@router.post("/request")
def send_friend_request(request: FriendRequestSchema, db: Session = Depends(get_db)):
    user_id = request.user_id
    friend_id = request.friend_id

    existing = db.query(FriendCore).filter(
        FriendCore.user_id == user_id,
        FriendCore.friend_id == friend_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="La solicitud ya existe")

    new_request = FriendCore(
        user_id=user_id,
        friend_id=friend_id,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {"message": "Solicitud enviada", "friendship": new_request}
