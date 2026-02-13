from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Usuario


# -------------------
# Configuración de seguridad
# -------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "supersecretkey"   # ✅ misma clave que en users.py
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60   # ✅ mismo tiempo que en users.py

# OAuth2: lee el token del header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

# -------------------
# Funciones de contraseña
# -------------------
def hash_password(password: str) -> str:
    """Genera un hash seguro para la contraseña"""
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    """Verifica que la contraseña coincida con el hash"""
    return pwd_context.verify(password, hashed_password)

# -------------------
# Funciones JWT
# -------------------
def create_jwt_token(user_id: int):
    """Crea un token JWT con expiración"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user_id), "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# -------------------
# Dependencia DB
# -------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------
# Obtener usuario actual (solo header)
# -------------------
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Devuelve el usuario autenticado a partir del token"""
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    usuario = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return usuario


# -------------------
# Validación de roles
# -------------------
def get_current_admin(usuario: Usuario = Depends(get_current_user)):
    if usuario.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso restringido a administradores")
    return usuario

def get_current_sponsor(usuario: Usuario = Depends(get_current_user)):
    if usuario.rol != "sponsor":
        raise HTTPException(status_code=403, detail="Acceso restringido a patrocinadores")
    return usuario

def get_current_user_only(usuario: Usuario = Depends(get_current_user)):
    if usuario.rol != "user":
        raise HTTPException(status_code=403, detail="Acceso restringido a usuarios")
    return usuario



