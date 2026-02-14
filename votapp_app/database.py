from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# 📌 URL de la base PostgreSQL en Render (guardada como variable de entorno)
DATABASE_URL = os.getenv("DATABASE_URL")

# 🔧 Motor de conexión
engine = create_engine(DATABASE_URL)

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