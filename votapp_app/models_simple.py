from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
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

    # Guardar multimedia como JSON serializado en texto
    imagenes = Column(Text, default="[]")
    videos = Column(Text, default="[]")

    # Estado de la encuesta: disponible, votada, finalizada
    estado = Column(String, default="disponible")

    # Fecha de expiración: por defecto 24h después de creación
    fecha_expiracion = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=1))

    # Relación con preguntas
    preguntas = relationship(
        "SurveySimpleQuestion",
        back_populates="survey",
        cascade="all, delete-orphan"
    )


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

    pregunta_id = Column(Integer, ForeignKey("surveys_simple_questions.id"))
    pregunta = relationship("SurveySimpleQuestion", back_populates="opciones")