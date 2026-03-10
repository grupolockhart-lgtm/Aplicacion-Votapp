from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# -------------------
# Opciones
# -------------------
class SurveySimpleOptionCreate(BaseModel):
    texto: str
    votos: int = 0

class SurveySimpleOptionResponse(BaseModel):
    id: int
    texto: str
    votos: int

    class Config:
        orm_mode = True

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
        orm_mode = True

# -------------------
# Encuesta Simple
# -------------------
class SurveySimpleCreate(BaseModel):
    titulo: str
    usuario_id: Optional[int] = None
    preguntas: List[SurveySimpleQuestionCreate]
    imagenes: Optional[List[str]] = []
    videos: Optional[List[str]] = []
    fecha_expiracion: Optional[datetime] = None  # nuevo campo opcional

class SurveySimpleResponse(BaseModel):
    id: int
    titulo: str
    usuario_id: Optional[int]
    preguntas: List[SurveySimpleQuestionResponse]
    imagenes: Optional[List[str]]
    videos: Optional[List[str]]
    estado: Optional[str] = None                # ciclo de vida: disponible, votada, finalizada
    fecha_expiracion: Optional[datetime] = None # mostrar expiración en respuesta
    fecha_creacion: datetime

    class Config:
        orm_mode = True

# -------------------
# Voto
# -------------------
class SurveySimpleVote(BaseModel):
    opcion_id: int
    usuario_id: Optional[int] = None