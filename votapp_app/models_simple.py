from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from votapp_app.database import Base

class SurveySimple(Base):
    __tablename__ = "surveys_simple"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Guardar multimedia como texto (JSON serializado)
    imagenes = Column(Text, default="[]")
    videos = Column(Text, default="[]")

    # Nuevo: estado de la encuesta
    estado = Column(String, default="disponible")
    # valores posibles: disponible, votada, finalizada

    # Nuevo: fecha de expiración (por defecto 24 horas después de creación)
    fecha_expiracion = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=1))

    # Relación con opciones
    opciones = relationship(
        "SurveySimpleOption",
        back_populates="survey",
        cascade="all, delete-orphan"
    )


class SurveySimpleOption(Base):
    __tablename__ = "surveys_simple_options"

    id = Column(Integer, primary_key=True, index=True)
    texto = Column(String, nullable=False)
    votos = Column(Integer, default=0)

    survey_simple_id = Column(Integer, ForeignKey("surveys_simple.id"))
    survey = relationship("SurveySimple", back_populates="opciones")