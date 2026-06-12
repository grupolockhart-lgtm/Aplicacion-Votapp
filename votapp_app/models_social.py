
# votapp_app/models_social.py

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Friend(Base):
    __tablename__ = "friends"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    friend_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "friend_id", name="unique_friendship"),)

    # Relaciones
    user = relationship("Usuario", foreign_keys=[user_id])
    friend = relationship("Usuario", foreign_keys=[friend_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)   # destinatario
    type = Column(String(50), nullable=False)  # 'friend_request', 'survey_assigned', 'survey_expired'
    message = Column(String(255), nullable=False)
    related_id = Column(Integer, nullable=True)  # id de encuesta o amistad relacionada
    status = Column(String(20), default="unread")  # unread, read
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    user = relationship("Usuario", foreign_keys=[user_id])



