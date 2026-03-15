from pydantic import BaseModel, field_validator
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

class SurveySimpleResponse(BaseModel):
    id: int
    titulo: str
    preguntas: List[SurveySimpleQuestionResponse]
    imagenes: List[str] = []
    videos: List[str] = []
    estado: Optional[str] = None
    fecha_expiracion: Optional[datetime] = None
    fecha_creacion: datetime

    # -------------------
    # Campos extra para cumplir contrato de Survey
    # -------------------
    description: str = ""
    questions: List[dict] = []
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
    # Validadores defensivos
    # -------------------
    @field_validator("questions", mode="before")
    def map_questions(cls, v, values):
        preguntas = values.get("preguntas") or []
        result = []
        for q in preguntas:
            result.append({
                "id": getattr(q, "id", None),
                "text": getattr(q, "texto", ""),
                "options": [
                    {
                        "id": getattr(o, "id", None),
                        "text": getattr(o, "texto", ""),
                        "count": getattr(o, "votos", 0)
                    }
                    for o in getattr(q, "opciones", []) or []
                ]
            })
        return result

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
    def map_media_urls(cls, v, values):
        imagenes = values.get("imagenes") or []
        return imagenes if imagenes else v or []

# -------------------
# Voto
# -------------------
class SurveySimpleVote(BaseModel):
    opcion_id: int