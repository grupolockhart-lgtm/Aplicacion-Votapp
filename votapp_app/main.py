from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from mangum import Mangum

# Importa tus módulos
from .routers import users, surveys, profiles, admin, comments, gamificacion
from . import models
from .database import engine
from services.auto_surveys import generar_encuestas_desde_noticias
from services.news_api import obtener_temas_relevantes
from votapp_app.database import SessionLocal
from services.seed import seed_logros
from votapp_app import rss

import os
from dotenv import load_dotenv

# -----------------------------
# Cargar variables de entorno
# -----------------------------
load_dotenv()

# -----------------------------
# Inicialización de la aplicación
# -----------------------------
app = FastAPI(
    title="VoxPop API",
    description="API para encuestas cívicas con usuarios, perfiles y gamificación",
    version="1.0.0"
)

# -----------------------------
# Crear tablas y seed inicial
# -----------------------------
models.Base.metadata.create_all(bind=engine)
seed_logros()

# -----------------------------
# Middleware
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ⚠️ en producción conviene limitar orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Carpeta media
# -----------------------------
os.makedirs("media/avatars", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# -----------------------------
# Routers con prefijo /api
# -----------------------------
app.include_router(users.router, prefix="/api")
app.include_router(surveys.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(gamificacion.router, prefix="/api")
app.include_router(rss.router, prefix="/api")

# -----------------------------
# Endpoint raíz
# -----------------------------
@app.get("/")
def read_root():
    return {"message": "API Votapp funcionando correctamente 🚀"}

# -----------------------------
# Endpoint NewsAPI
# -----------------------------
@app.get("/temas-relevantes")
def temas_relevantes(country: str = "mx", category: str = None, count: int = 5):
    return obtener_temas_relevantes(country, category, count)

# -----------------------------
# AUTO SURVEYS ENDPOINT
# -----------------------------
@app.post("/generar-encuestas")
def generar_encuestas(country: str = "us", category: str = "technology", count: int = 3):
    noticias = obtener_temas_relevantes(country="us", category="technology", count=3)["articles"]
    generar_encuestas_desde_noticias(noticias)
    return {"status": "ok", "mensaje": f"{len(noticias)} encuestas creadas"}

# -----------------------------
# ENCUESTAS ENDPOINT
# -----------------------------
@app.get("/encuestas")
def listar_encuestas(limit: int = 10, ciudad: str = None):
    db = SessionLocal()
    query = db.query(models.Survey)
    if ciudad:
        query = query.filter(models.Survey.ciudad == ciudad)
    encuestas = query.limit(limit).all()
    db.close()
    return [
        {"id": e.id, "title": e.title, "description": e.description, "media_url": e.media_url}
        for e in encuestas
    ]

# -----------------------------
# Adaptador para Cloud Functions
# -----------------------------
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

