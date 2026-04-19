# votapp_app/models_simple.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timedelta
from votapp_app.database import Base

class SurveySimple(Base):
    __tablename__ = "surveys_simple"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)

    # Fecha de creación automática
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # Usuario creador (puede ser null si es anónima)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Usuario asignado (amigo destinatario)
    asignado_a = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Guardar multimedia como JSONB (listas nativas)
    imagenes = Column(JSONB, default=list)
    videos = Column(JSONB, default=list)

    # Fecha de expiración: por defecto 24h después de creación
    fecha_expiracion = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=1))

    # Relaciones
    preguntas = relationship(
        "SurveySimpleQuestion",
        back_populates="survey",
        cascade="all, delete-orphan"
    )

    creador = relationship("Usuario", foreign_keys=[usuario_id], backref="surveys_creadas")
    asignado = relationship("Usuario", foreign_keys=[asignado_a], backref="surveys_asignadas")


class SurveySimpleQuestion(Base):
    __tablename__ = "surveys_simple_questions"

    id = Column(Integer, primary_key=True, index=True)
    texto = Column(String, nullable=False)

    survey_simple_id = Column(Integer, ForeignKey("surveys_simple.id"))
    survey = relationship("SurveySimple", back_populates="preguntas")

    # Relación con opciones
    opciones = relationship(
        "SurveySimpleOption",
        back_populates="pregunta",
        cascade="all, delete-orphan"
    )


class SurveySimpleOption(Base):
    __tablename__ = "surveys_simple_options"

    id = Column(Integer, primary_key=True, index=True)
    texto = Column(String, nullable=False)
    votos = Column(Integer, default=0)

    # Relación con pregunta
    pregunta_id = Column(Integer, ForeignKey("surveys_simple_questions.id"))
    pregunta = relationship("SurveySimpleQuestion", back_populates="opciones")


class SimpleVote(Base):
    __tablename__ = "surveys_simple_votes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    survey_simple_id = Column(Integer, ForeignKey("surveys_simple.id"), nullable=False)
    pregunta_id = Column(Integer, ForeignKey("surveys_simple_questions.id"), nullable=False)
    opcion_id = Column(Integer, ForeignKey("surveys_simple_options.id"), nullable=False)

    # Relaciones opcionales
    usuario = relationship("Usuario", backref="simple_votes")
    survey_simple = relationship("SurveySimple", backref="votes")
    pregunta = relationship("SurveySimpleQuestion", backref="votes")
    opcion = relationship("SurveySimpleOption", backref="votes")

