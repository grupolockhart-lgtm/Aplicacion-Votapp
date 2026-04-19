# votapp_app/schemas_simple.py

from pydantic import BaseModel, field_validator, ValidationInfo
from typing import List, Optional
from datetime import datetime
import json

# -------------------
# Opciones
# -------------------
class SurveySimpleOptionCreate(BaseModel):
    texto: str   # ✅ solo texto, sin votos

class SurveySimpleOptionResponse(BaseModel):
    id: int
    texto: str
    votos: int

    class Config:
        from_attributes = True   # ✅ reemplazo de orm_mode en Pydantic v2

# -------------------
# Preguntas
# -------------------
class SurveySimpleQuestionCreate(BaseModel):
    texto: str
    opciones: List[SurveySimpleOptionCreate]

class SurveySimpleQuestionResponse(BaseModel):
    id: int
    texto: str
    opciones: List[SurveySimpleOptionResponse]

    class Config:
        from_attributes = True

# -------------------
# Encuesta Simple (Create y Response)
# -------------------
class SurveySimpleCreate(BaseModel):
    titulo: str
    preguntas: List[SurveySimpleQuestionCreate]
    imagenes: Optional[List[str]] = []
    videos: Optional[List[str]] = []
    fecha_expiracion: Optional[datetime] = None
    asignado_a: Optional[int] = None   # 👈 nuevo campo


class SurveySimpleResponse(BaseModel):
    id: int
    titulo: str
    preguntas: List[SurveySimpleQuestionResponse]
    imagenes: List[str] = []
    videos: List[str] = []
    fecha_expiracion: Optional[datetime] = None
    fecha_creacion: Optional[datetime] = None

    # 👇 añadimos creador y asignado
    usuario_id: Optional[int] = None
    asignado_a: Optional[int] = None

    # -------------------
    # Campos extra para cumplir contrato de Survey
    # -------------------
    description: str = ""
    media_url: Optional[str] = None
    media_urls: List[str] = []
    media_type: str = "native"
    segundos_restantes: int = 0
    patrocinada: bool = False
    patrocinador: Optional[str] = None
    es_patrocinada: bool = False
    recompensa_puntos: int = 0
    recompensa_dinero: int = 0
    presupuesto_total: int = 0
    visibilidad_resultados: str = "publica"
    tipo: str = "simple"

    # -------------------
    # Segmentación
    # -------------------
    sexo: Optional[str] = None
    ciudad: Optional[str] = None
    ocupacion: Optional[str] = None
    nivel_educativo: Optional[str] = None
    religion: Optional[str] = None
    nacionalidad: Optional[str] = None
    estado_civil: Optional[str] = None

    class Config:
        from_attributes = True


    # -------------------
    # Validadores defensivos (Pydantic v2)
    # -------------------
    @field_validator("preguntas", mode="before")
    def map_preguntas(cls, v, info: ValidationInfo):
        return v or []

    @field_validator("imagenes", mode="before")
    def parse_imagenes(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    @field_validator("videos", mode="before")
    def parse_videos(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    @field_validator("media_urls", mode="before")
    def map_media_urls(cls, v, info: ValidationInfo):
        imagenes = info.data.get("imagenes") or []
        return imagenes if imagenes else v or []

# -------------------
# Voto
# -------------------
class SurveySimpleAnswer(BaseModel):
    pregunta_id: int   # ✅ corregido: coincide con SimpleVote.pregunta_id
    opcion_id: int     # ✅ corregido: coincide con SimpleVote.opcion_id

class SurveySimpleVote(BaseModel):
    answers: List[SurveySimpleAnswer]