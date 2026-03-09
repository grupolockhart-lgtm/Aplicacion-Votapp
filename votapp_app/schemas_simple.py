
from pydantic import BaseModel
from typing import List, Optional

# -------------------
# Opciones
# -------------------
class SurveySimpleOptionCreate(BaseModel):
    texto: str

class SurveySimpleOptionResponse(BaseModel):
    id: int
    texto: str
    votos: int

    class Config:
        orm_mode = True

# -------------------
# Encuesta Simple
# -------------------
class SurveySimpleCreate(BaseModel):
    titulo: str
    usuario_id: Optional[int] = None
    opciones: List[SurveySimpleOptionCreate]
    imagenes: Optional[List[str]] = []
    videos: Optional[List[str]] = []

class SurveySimpleResponse(BaseModel):
    id: int
    titulo: str
    usuario_id: Optional[int]
    opciones: List[SurveySimpleOptionResponse]
    imagenes: Optional[List[str]]
    videos: Optional[List[str]]

    class Config:
        orm_mode = True

# -------------------
# Voto
# -------------------
class SurveySimpleVote(BaseModel):
    opcion: str
    usuario_id: Optional[int] = None