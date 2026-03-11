from pydantic import BaseModel, computed_field, Field, EmailStr

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, date
from sqlalchemy.ext.declarative import declarative_base
from typing import List, Optional, Literal


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
    comments = relationship(
        "Comment",
        back_populates="user",
        foreign_keys="Comment.usuario_id"
    )




# -----------------------------
# Modelo de Comentarios
# -----------------------------
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


# -------------------
# Encuestas
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



from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class OptionOut(BaseModel):
    id: Optional[int] = None    # 👈 ahora opcional
    text: str
    count: Optional[int] = None
    percentage: Optional[float] = None

    class Config:
        from_attributes = True


class QuestionOut(BaseModel):
    id: Optional[int] = None    # 👈 ahora opcional
    text: str
    options: List[OptionOut]
    total_votes: Optional[int] = None

    class Config:
        from_attributes = True




# -----------------------------
# Schema SurveyOut
# -----------------------------
class SurveyOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    fecha_expiracion: Optional[datetime] = None
    questions: List[QuestionOut]
    media_url: Optional[str] = None
    media_urls: List[str] = Field(default_factory=list)
    media_type: Optional[str] = None   # 👈 nuevo campo

    # -----------------------------
    # Segmentación
    # -----------------------------
    sexo: Optional[str] = None
    ciudad: Optional[str] = None
    ocupacion: Optional[str] = None
    nivel_educativo: Optional[str] = None
    religion: Optional[str] = None
    nacionalidad: Optional[str] = None
    estado_civil: Optional[str] = None

    # -----------------------------
    # Patrocinio
    # -----------------------------
    patrocinada: bool
    patrocinador: Optional[str] = None
    recompensa_puntos: Optional[int] = None   # 👈 ahora opcional
    recompensa_dinero: Optional[int] = None   # 👈 ahora opcional
    presupuesto_total: Optional[int] = None   # 👈 ahora opcional
    visibilidad_resultados: Literal["publica", "privada"]

    # -----------------------------
    # Campo derivado calculado
    # -----------------------------
    @property
    def es_patrocinada(self) -> bool:
        return self.patrocinada and bool(self.patrocinador)

    class Config:
        from_attributes = True

# -----------------------------
# Comentarios
# -----------------------------
class CommentOut(BaseModel):
    id: int
    content: str
    user_id: int
    survey_id: int
    created_at: str

    class Config:
        from_attributes = True   # ✅ en Pydantic v2


# -----------------------------
# Encuestas detalladas
# -----------------------------
class SurveyDetailOut(SurveyOut):
    comments: List[CommentOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


# -----------------------------
# Resolver referencias
# -----------------------------
SurveyOut.model_rebuild()
SurveyDetailOut.model_rebuild()












# -------------------
# Votos
# -------------------
class Answer(BaseModel):
    question_id: int
    option_id: int


class VoteCreate(BaseModel):
    answers: List[Answer]


# ✅ Alias para compatibilidad
class VoteBatchCreate(BaseModel):
    answers: List[Answer]


# -------------------
# Resultados
# -------------------
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
class MovimientoWalletOut(BaseModel):
    id: int
    tipo: str
    monto: int
    fecha: datetime

    class Config:
        from_attributes = True


class WalletOut(BaseModel):
    id: int
    balance: int
    actualizado_en: datetime
    movimientos: List[MovimientoWalletOut] = Field(default_factory=list)

    class Config:
        from_attributes = True



# -------------------
# Encuestas (actualización y salida)
# -------------------

class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    estado: Optional[str] = None







# ✅ Nuevo schema con comentarios embebidos
from typing import List

class SurveyDetailOut(SurveyOut):
    comments: List[CommentOut] = []




# -----------------------------
# Schemas de Comentarios
# -----------------------------


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




# -------------------
# Survey History Schema
# -------------------
class SurveyHistoryOut(BaseModel):
    id: int
    title: str
    completed_at: datetime

    class Config:
        from_attributes = True









