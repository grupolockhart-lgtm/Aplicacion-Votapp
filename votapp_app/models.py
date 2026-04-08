from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint, Boolean, Enum
)
from sqlalchemy.orm import relationship
from datetime import datetime
from votapp_app.database import Base

from sqlalchemy import Date
from sqlalchemy.sql import func

from .database import Base

import enum


# -----------------------------
# Utilidades / Enum
# -----------------------------

class VisibilidadResultados(enum.Enum):
    publica = "publica"
    privada = "privada"



# -----------------------------
# Usuarios
# -----------------------------
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=True)
    correo = Column(String, unique=True, index=True, nullable=False)
    contraseña_hash = Column(String, nullable=False)

    # Datos personales
    cedula = Column(String, unique=True, index=True, nullable=True)
    telefono_movil = Column(String, nullable=True)

    # Información demográfica
    edad = Column(Integer, nullable=True)
    sexo = Column(String, nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=True)
    nacionalidad = Column(String, nullable=True)
    ciudad = Column(String, nullable=True)
    estado_civil = Column(String, nullable=True)

    # Formación / ocupación
    nivel_educativo = Column(String, nullable=True)
    profesion = Column(String, nullable=True)
    ocupacion = Column(String, nullable=True)

    # Preferencias
    religion = Column(String, nullable=True)

    # Trazabilidad
    creado_en = Column(DateTime, default=datetime.utcnow)

    # Gamificación
    puntos = Column(Integer, default=0)

    # Roles (admin / user / sponsor)
    rol = Column(String, default="user")

    # Relaciones
    votos = relationship("Vote", back_populates="usuario")
    perfil_publico = relationship("PerfilPublico", back_populates="usuario", uselist=False)
    billetera = relationship("Wallet", back_populates="usuario", uselist=False)
    logros = relationship("UsuarioLogro", back_populates="usuario")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    participaciones = relationship("Participacion", back_populates="user", cascade="all, delete-orphan")

    # 👇 relación con encuestas
    surveys = relationship("Survey", back_populates="usuario", cascade="all, delete-orphan")

# -----------------------------
# Wallet
# -----------------------------
class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    balance = Column(Integer, default=0)
    actualizado_en = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="billetera")
    movimientos = relationship("MovimientoWallet", back_populates="wallet")


# -----------------------------
# Perfil público
# -----------------------------
class PerfilPublico(Base):
    __tablename__ = "perfil_publico"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    alias = Column(String, unique=True, index=True, nullable=False)
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    nivel = Column(Integer, default=1)
    puntos = Column(Integer, default=0)
    racha_dias = Column(Integer, default=0)
    ultima_participacion = Column(Date, nullable=True)   # 👈 nuevo campo

    usuario = relationship("Usuario", back_populates="perfil_publico")



# -----------------------------
# Encuestas
# -----------------------------

class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    fecha_expiracion = Column(DateTime, nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now(), nullable=False)

    # Relación con el usuario creador (sponsor)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    usuario = relationship("Usuario", back_populates="surveys")

    # Relación única con transacciones patrocinadas
    sponsor_transactions = relationship("SponsorTransaction", back_populates="survey")

    # Filtros de segmentación
    sexo = Column(Text, nullable=True)
    ciudad = Column(Text, nullable=True)
    ocupacion = Column(Text, nullable=True)
    nivel_educativo = Column(Text, nullable=True)
    religion = Column(Text, nullable=True)
    nacionalidad = Column(Text, nullable=True)
    estado_civil = Column(String, nullable=True)

    # Multimedia
    media_url = Column(String, nullable=True)
    media_urls = Column(Text, nullable=True)  # JSON serializado
    media_type = Column(String, default="none")

    # Patrocinio
    patrocinada = Column(Boolean, default=False)
    patrocinador = Column(String, nullable=True)
    recompensa_puntos = Column(Integer, default=0)
    recompensa_dinero = Column(Integer, default=0)
    presupuesto_total = Column(Integer, default=0)
    visibilidad_resultados = Column(Enum(VisibilidadResultados), default=VisibilidadResultados.publica)
    source_url = Column(String, unique=True, nullable=True)

    # Relaciones
    questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="survey")
    comments = relationship("Comment", back_populates="survey", cascade="all, delete-orphan")
    participaciones = relationship("Participacion", back_populates="survey", cascade="all, delete-orphan")
    active = Column(Boolean, default=True)




class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)

    survey = relationship("Survey", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan")

class Option(Base):
    __tablename__ = "options"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)

    question = relationship("Question", back_populates="options")
    votes = relationship("Vote", back_populates="option")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("options.id"), nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow)

    survey = relationship("Survey", back_populates="votes")
    question = relationship("Question")
    option = relationship("Option", back_populates="votes")
    usuario = relationship("Usuario", back_populates="votos")

    __table_args__ = (
        UniqueConstraint("usuario_id", "question_id", name="unique_vote_per_question"),
    )



# -----------------------------
# Transacciones de patrocinio
# -----------------------------
class SponsorTransaction(Base):
    __tablename__ = "sponsor_transactions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)  # sponsor
    beneficiario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)  # votante
    monto_dinero = Column(Integer, nullable=False, default=0)
    puntos = Column(Integer, nullable=False, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relación inversa con Survey
    survey = relationship("Survey", back_populates="sponsor_transactions")

    # Relación inversa con movimientos
    movimientos = relationship("MovimientoWallet", back_populates="sponsor_transaction")




# -----------------------------
# Movimientos de billetera
# -----------------------------
class MovimientoWallet(Base):
    __tablename__ = "wallet_movements"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    sponsor_transaction_id = Column(Integer, ForeignKey("sponsor_transactions.id"), nullable=False)
    tipo = Column(String, nullable=False)  # ingreso / retiro
    monto = Column(Integer, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False)

    wallet = relationship("Wallet", back_populates="movimientos")
    sponsor_transaction = relationship("SponsorTransaction", back_populates="movimientos")

    # 👇 propiedades derivadas para Pydantic
    @property
    def patrocinado(self) -> bool:
        # True si el movimiento está ligado a una transacción de sponsor
        return self.sponsor_transaction_id is not None

    @property
    def survey(self):
        # Devuelve la encuesta asociada a la transacción de sponsor
        return self.sponsor_transaction.survey if self.sponsor_transaction else None



# -----------------------------
# Gamificación
# -----------------------------
class Logro(Base):
    __tablename__ = "logros"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text)
    icono = Column(String)

class UsuarioLogro(Base):
    __tablename__ = "usuario_logros"

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), primary_key=True)
    logro_id = Column(Integer, ForeignKey("logros.id"), primary_key=True)
    fecha_obtenido = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="logros")
    logro = relationship("Logro")



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



# -----------------------------
# Modelo de Participaciones
# -----------------------------
class Participacion(Base):
    __tablename__ = "participaciones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    fecha_participacion = Column(DateTime, default=datetime.utcnow)
    creado_en = Column(DateTime, default=datetime.utcnow)  # <-- nuevo campo

    # Relaciones
    survey = relationship("Survey", back_populates="participaciones")
    user = relationship("Usuario", back_populates="participaciones")



