from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# 📌 Cargar variables de entorno aquí mismo
load_dotenv()

# 📌 URL de la base PostgreSQL en Render (guardada como variable de entorno)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ No se encontró la variable DATABASE_URL. Verifica tu archivo .env")

# 🔧 Motor de conexión con control de pool
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # Verifica que la conexión esté viva antes de usarla
    pool_recycle=1800,        # Recicla conexiones cada 30 min
    pool_size=5,              # Mantén un pool pequeño
    max_overflow=30           # Permite conexiones extra si el pool se llena
)

# 🔧 Sesión para interactuar con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 🔧 Base para los modelos
Base = declarative_base()

# ✅ Dependencia para obtener la sesión de DB en cada request (FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


