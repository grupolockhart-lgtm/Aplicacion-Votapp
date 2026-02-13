from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Request
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os, shutil

from .. import models, schemas, database
from ..auth import get_current_user   # ✅ importa la función que valida el token

# 👇 importa las clases y funciones específicas
from ..models import Usuario
from ..schemas import UserOut, UserUpdate
from ..database import get_db


router = APIRouter(prefix="/users", tags=["users"])

# -----------------------------
# Configuración de seguridad
# -----------------------------
SECRET_KEY = "supersecretkey"   # ⚠️ cámbialo por algo seguro en producción
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# -----------------------------
# Registro de usuarios
# -----------------------------
@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.Usuario).filter(models.Usuario.correo == user.correo).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    db_user = models.Usuario(
    nombre=user.nombre,
    apellido=user.apellido,
    correo=user.correo,
    contraseña_hash=hash_password(user.contraseña),
    cedula=user.cedula,                     # 👈 nuevo campo
    telefono_movil=user.telefono_movil,     # 👈 nuevo campo
    sexo=user.sexo,
    fecha_nacimiento=user.fecha_nacimiento,
    nacionalidad=user.nacionalidad,
    ciudad=user.ciudad,
    estado_civil=user.estado_civil,         # 👈 nuevo campo
    nivel_educativo=user.nivel_educativo,
    profesion=user.profesion,
    ocupacion=user.ocupacion,
    religion=user.religion,
    rol=user.rol if user.rol in ["user", "sponsor", "admin"] else "user"
)


    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 👇 Crear billetera inicial
    nueva_billetera = models.Wallet(usuario_id=db_user.id, balance=0)
    db.add(nueva_billetera)
    db.commit()
    db.refresh(nueva_billetera)

# 👇 Crear perfil público inicial con datos de gamificación
    nuevo_perfil = models.PerfilPublico(
        usuario_id=db_user.id,
        alias=user.nombre,   # puedes generar un alias único si prefieres
        avatar_url=None,
        bio=None,
        puntos=0,
        nivel=1,
        racha_dias=0,
        ultima_participacion=None
    )
    db.add(nuevo_perfil)
    db.commit()
    db.refresh(nuevo_perfil)


    return db_user



# -----------------------------
# Login de usuarios
# -----------------------------
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == form_data.username).first()
    if not usuario or not verify_password(form_data.password, usuario.contraseña_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    access_token = create_access_token(data={"sub": str(usuario.id)})
    return {"access_token": access_token, "token_type": "bearer"}

# -----------------------------
# Usuario autenticado (/me)
# -----------------------------
@router.get("/me")
def read_users_me(
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    user_out = schemas.UserOut.model_validate(current_user)

    perfil_out = None
    if current_user.perfil_publico:
        perfil_out = schemas.PublicProfileOut.model_validate(current_user.perfil_publico)

    wallet_out = None
    if current_user.billetera:
        wallet_out = schemas.WalletOut.model_validate(current_user.billetera)

    logros_out = [
        schemas.UsuarioLogroOut.model_validate(logro)
        for logro in current_user.logros
    ]

    return {
        "user": user_out,
        "public_profile": perfil_out,
        "wallet": wallet_out,
        "logros": logros_out
    }
# -----------------------------
# Actualizar datos privados (/me)
# -----------------------------
@router.put("/me", response_model=UserOut)
def update_user_me(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    user = db.query(Usuario).filter(Usuario.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Validar correo único si se intenta cambiar
    if update.correo and update.correo != user.correo:
        existing_user = db.query(Usuario).filter(Usuario.correo == update.correo).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="El correo ya está en uso")

    # Actualizar solo campos válidos y no nulos
    for field, value in update.dict(exclude_unset=True, exclude_none=True).items():
        if hasattr(user, field):
            setattr(user, field, value)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user




# -----------------------------
# Actualizar perfil público (/me/public)
# -----------------------------
@router.put("/me/public", response_model=schemas.PublicProfileOut)
def update_public_profile(
    profile_update: schemas.PublicProfileUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    perfil = db.query(models.PerfilPublico).filter_by(usuario_id=current_user.id).first()
    if not perfil:
        perfil = models.PerfilPublico(usuario_id=current_user.id)
        db.add(perfil)

    # Validar alias único si se envía
    if profile_update.alias is not None:
        exists = db.query(models.PerfilPublico).filter(
            models.PerfilPublico.alias == profile_update.alias,
            models.PerfilPublico.usuario_id != current_user.id
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail="Alias ya registrado")
        perfil.alias = profile_update.alias

    if profile_update.bio is not None:
        perfil.bio = profile_update.bio

    if profile_update.avatar_url and profile_update.avatar_url.strip():
        perfil.avatar_url = profile_update.avatar_url.strip()

    db.add(perfil)
    db.commit()
    db.refresh(perfil)

    return perfil


# -----------------------------
# Obtener perfil público (/me/public)
# -----------------------------
@router.get("/me/public", response_model=schemas.PublicProfileOut)
def get_public_profile(
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    perfil = db.query(models.PerfilPublico).filter_by(usuario_id=current_user.id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil público no encontrado")
    return perfil












# -----------------------------
# Subir avatar (/upload/avatar)
# -----------------------------
AVATAR_DIR = "media/avatars"

@router.post("/upload/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user),
    request: Request = None
):
    # Validar tipo de archivo
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")

    # Crear directorio si no existe
    os.makedirs(AVATAR_DIR, exist_ok=True)

    # Nombre único para el archivo
    filename = f"user_{current_user.id}_{file.filename}"
    filepath = os.path.join(AVATAR_DIR, filename)

    # Guardar archivo en disco
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Construir URL absoluta con detección de base_url
    base_url = str(request.base_url).rstrip("/")
    base_url = base_url.replace("127.0.0.1", "10.0.0.178")  # tu IP local
    url = f"{base_url}/media/avatars/{filename}"

    # Buscar o crear perfil
    perfil = db.query(models.PerfilPublico).filter_by(usuario_id=current_user.id).first()
    if not perfil:
        alias_generado = f"Usuario_{current_user.id}"
        perfil = models.PerfilPublico(
            usuario_id=current_user.id,
            alias=alias_generado
        )
        db.add(perfil)

    # Si alias está vacío, regenerar
    if not perfil.alias or perfil.alias.strip() == "":
        perfil.alias = f"Usuario_{current_user.id}"

    # Actualizar avatar
    perfil.avatar_url = url
    db.commit()
    db.refresh(perfil)

    return {
        "avatar_url": perfil.avatar_url,
        "alias": perfil.alias
    }




# -----------------------------
# Endpoint Historial de Encuestas
# -----------------------------

@router.get("/me/surveys/history", response_model=list[schemas.SurveyHistoryOut])
def get_user_survey_history(
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    participaciones = (
        db.query(models.Participacion)
        .join(models.Survey, models.Participacion.survey_id == models.Survey.id)
        .filter(models.Participacion.usuario_id == current_user.id)
        .all()
    )

    return [
        {
            "id": p.survey.id,
            "title": p.survey.title,
            "completed_at": p.fecha_participacion,  # alias aquí
        }
        for p in participaciones
    ]











