
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# URL de la base de datos SQLite (archivo surveys.db en la carpeta actual)
DATABASE_URL = "sqlite:///./surveys.db"

# Motor de conexión
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Sesión para interactuar con la base de datos
SessionLocal = sessionmaker(bind=engine, autoflush=False)

# Base para los modelos
Base = declarative_base()

# Modelo de la tabla Survey
class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    options = Column(Text, nullable=False)  # Guardamos las opciones como texto JSON

    # Relación con votos
    votes = relationship("Vote", back_populates="survey")

# Modelo de la tabla Vote
class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    option = Column(String, nullable=False)

    survey = relationship("Survey", back_populates="votes")

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)