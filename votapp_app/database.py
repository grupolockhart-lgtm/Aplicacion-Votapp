from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 📌 URL de la base de datos
# Usar /tmp en Render para que SQLite pueda escribir el archivo
DATABASE_URL = "sqlite:////tmp/surveys.db"

# 🔧 Motor de conexión
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Necesario solo para SQLite
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
