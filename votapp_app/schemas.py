



from pydantic import BaseModel, computed_field, Field, field_validator, EmailStr

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, date
from sqlalchemy.ext.declarative import declarative_base
from typing import List, Optional, Literal

import json

Base = declarative_base()


# -------------------
# Usuarios
# -------------------

class UserCreate(BaseModel):
    nombre: str
    apellido: Optional[str] = None
    correo: str
    contraseña: str
    cedula: Optional[str] = None           # 👈 nuevo campo
    telefono_movil: Optional[str] = None   # 👈 nuevo campo
    edad: Optional[int] = None
    sexo: Optional[str] = None
    fecha_nacimiento: Optional[datetime] = None
    nacionalidad: Optional[str] = None
    nivel_educativo: Optional[str] = None
    profesion: Optional[str] = None
    ocupacion: Optional[str] = None
    religion: Optional[str] = None
    ciudad: Optional[str] = None
    estado_civil: Optional[str] = None     # 👈 nuevo campo
    rol: str = "user"


class UserLogin(BaseModel):
    correo: str
    contraseña: str


class UserOut(BaseModel):
    id: int
    nombre: str
    apellido: Optional[str] = None
    correo: str
    cedula: Optional[str] = None           # 👈 nuevo campo
    telefono_movil: Optional[str] = None   # 👈 nuevo campo
    sexo: Optional[str] = None
    fecha_nacimiento: Optional[datetime] = None
    nacionalidad: Optional[str] = None
    nivel_educativo: Optional[str] = None
    profesion: Optional[str] = None
    ocupacion: Optional[str] = None
    religion: Optional[str] = None
    ciudad: Optional[str] = None
    estado_civil: Optional[str] = None     # 👈 nuevo campo
    puntos: int = 0
    rol: str = "user"
    billetera: Optional["WalletOut"] = None

    class Config:
        from_attributes = True

    @computed_field
    @property
    def edad(self) -> Optional[int]:
        fn = self.fecha_nacimiento
        if fn:
            hoy = date.today()
            return hoy.year - fn.year - ((hoy.month, hoy.day) < (fn.month, fn.day))
        return None


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo: Optional[EmailStr] = None
    cedula: Optional[str] = None
    telefono_movil: Optional[str] = None
    sexo: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    nacionalidad: Optional[str] = None
    ciudad: Optional[str] = None
    estado_civil: Optional[str] = None
    nivel_educativo: Optional[str] = None
    profesion: Optional[str] = None
    ocupacion: Optional[str] = None
    religion: Optional[str] = None

    class Config:
        from_attributes = True



# -----------------------------
# Modelo de Usuario
# -----------------------------
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=True)
    correo = Column(String, unique=True, index=True)
    contraseña = Column(String, nullable=False)

    # Campos internos privados
    cedula = Column(String, nullable=True)
    telefono_movil = Column(String, nullable=True)
    sexo = Column(String, nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=True)
    nacionalidad = Column(String, nullable=True)
    nivel_educativo = Column(String, nullable=True)
    profesion = Column(String, nullable=True)
    ocupacion = Column(String, nullable=True)
    religion = Column(String, nullable=True)
    ciudad = Column(String, nullable=True)
    estado_civil = Column(String, nullable=True)

    # Gamificación / rol
    puntos = Column(Integer, default=0)
    rol = Column(String, default="user")

    # Relaciones
    comments = relationship("Comment", back_populates="user", foreign_keys="Comment.usuario_id")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    survey = relationship("Survey", back_populates="comments")
    user = relationship("Usuario", back_populates="comments")


# -------------------
# Perfil público
# -------------------
class PublicProfileOut(BaseModel):
    alias: Optional[str] = None   # <-- ahora opcional
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    nivel: int
    puntos: int
    racha_dias: int

    class Config:
        from_attributes = True


# ✅ Nuevo: schema para actualizar perfil público
class PublicProfileUpdate(BaseModel):
    alias: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None




################################################################################




# -------------------
# Encuestas (creacion y salida)
# -------------------

class OptionCreate(BaseModel):
    text: str


class QuestionCreate(BaseModel):
    text: str
    options: List[OptionCreate]


class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    fecha_expiracion: Optional[datetime] = None
    questions: List[QuestionCreate]

    media_url: Optional[str] = None
    media_urls: List[str] = Field(default_factory=list)

    # Segmentación
    sexo: Optional[str] = None
    ciudad: Optional[str] = None
    ocupacion: Optional[str] = None
    nivel_educativo: Optional[str] = None
    religion: Optional[str] = None
    nacionalidad: Optional[str] = None
    estado_civil: Optional[str] = None   # 👈 nuevo campo


    # Patrocinio
    patrocinada: bool = False
    patrocinador: Optional[str] = None
    recompensa_puntos: Optional[int] = None
    recompensa_dinero: Optional[int] = None
    presupuesto_total: Optional[int] = None


    visibilidad_resultados: Literal["publica", "privada"] = "publica"


class OpcionOut(BaseModel):
    id: Optional[int] = None
    texto: str = Field(alias="text")
    votos: Optional[int] = None
    porcentaje: Optional[float] = None

    class Config:
        from_attributes = True
        allow_population_by_field_name = True


class PreguntaOut(BaseModel):
    id: Optional[int] = None
    texto: str = Field(alias="text")
    opciones: List[OpcionOut] = Field(alias="options")
    total_votos: Optional[int] = None

    class Config:
        from_attributes = True
        allow_population_by_field_name = True





class SurveyOut(BaseModel):
    id: int
    titulo: str = Field(alias="title")
    descripcion: Optional[str] = Field(alias="description", default=None)
    fecha_expiracion: Optional[datetime] = None
    fecha_creacion: Optional[datetime] = None
    segundos_restantes: Optional[int] = None
    preguntas: List[PreguntaOut] = Field(alias="questions")
    imagenes: List[str] = Field(default_factory=list)
    videos: List[str] = Field(default_factory=list)
    media_url: Optional[str] = None
    media_urls: List[str] = Field(default_factory=list)
    media_type: Optional[str] = None

    # Segmentación
    sexo: Optional[str] = None
    ciudad: Optional[str] = None
    ocupacion: Optional[str] = None
    nivel_educativo: Optional[str] = None
    religion: Optional[str] = None
    nacionalidad: Optional[str] = None
    estado_civil: Optional[str] = None

    # Patrocinio
    patrocinada: bool
    patrocinador: Optional[str] = None
    recompensa_puntos: Optional[int] = None
    recompensa_dinero: Optional[int] = None
    presupuesto_total: Optional[int] = None
    visibilidad_resultados: Literal["publica", "privada"]

    @property
    def es_patrocinada(self) -> bool:
        return self.patrocinada and bool(self.patrocinador)

    class Config:
        from_attributes = True
        allow_population_by_field_name = True




# ✅ Para crear un comentario
class CommentCreate(BaseModel):
    survey_id: int
    content: str

class CommentOut(BaseModel):
    id: int
    survey_id: int
    usuario_id: int   # 👈 igual que en el modelo Comment
    content: str
    created_at: datetime

    class Config:
        from_attributes = True   # reemplaza orm_mode



class SurveyDetailOut(SurveyOut):
    comments: List[CommentOut] = Field(default_factory=list)

    class Config:
        from_attributes = True



# Resolver referencias

SurveyOut.model_rebuild()
SurveyDetailOut.model_rebuild()



class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None   # 👈 usar el campo real de la tabla




class SurveyHistoryOut(BaseModel):
    id: int
    titulo: str
    description: Optional[str] = None
    completed_at: Optional[datetime] = None
    imagenes: List[str] = Field(default_factory=list)
    preguntas: List[PreguntaOut] = Field(default_factory=list)

    # 👇 Campos de patrocinio
    patrocinada: bool = False
    patrocinador: Optional[str] = None
    recompensa_puntos: int = 0
    recompensa_dinero: int = 0
    presupuesto_total: int = 0

    # 👇 Transacciones de patrocinio
    patrocinadores: List[dict] = Field(default_factory=list)

    class Config:
        from_attributes = True















#########################################################################





# -------------------
# Votos y resultados
# -------------------

class Answer(BaseModel):
    question_id: int
    option_id: int


class VoteCreate(BaseModel):
    answers: List[Answer]


# ✅ Alias para compatibilidad
class VoteBatchCreate(BaseModel):
    answers: List[Answer]


class OptionResult(BaseModel):
    id: int
    text: str
    votes: int
    percentage: Optional[float] = None


class QuestionResult(BaseModel):
    question_id: int
    question_text: str
    options: List[OptionResult]


class SurveyResult(BaseModel):
    title: str
    media_url: Optional[str] = None
    media_urls: Optional[List[str]] = Field(default_factory=list)
    results: List[QuestionResult]



# -------------------
# Gamificación
# -------------------
class LogroOut(BaseModel):
    id: int
    nombre: str
    description: Optional[str] = None
    icono: Optional[str] = None

    class Config:
        from_attributes = True


class UsuarioLogroOut(BaseModel):
    logro: LogroOut
    fecha_obtenido: datetime

    class Config:
        from_attributes = True



# -------------------
# Billetera
# -------------------

class SurveyWalletOut(BaseModel):
    title: str   # 👈 usar el campo real de la tabla
    media_urls: Optional[List[str]] = None

    @field_validator("media_urls", mode="before")
    def parse_media_urls(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        return v

    class Config:
        from_attributes = True




class MovimientoWalletOut(BaseModel):
    id: int
    monto: int
    fecha: datetime
    patrocinado: bool
    survey: Optional[SurveyWalletOut]   # 👈 aquí se usa el esquema simplificado

    class Config:
        from_attributes = True


class WalletOut(BaseModel):
    id: int
    balance: int
    actualizado_en: datetime
    movimientos: List[MovimientoWalletOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


















































