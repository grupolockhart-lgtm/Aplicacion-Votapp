# votapp_app/main.py

from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from mangum import Mangum
from .controllers import friendsController, notificationsController
from .routers import users
from .routers import surveys, profiles, admin, comments, gamificacion, surveys_simple
from . import models, models_simple
from .database import engine, SessionLocal
from services.auto_surveys import generar_encuestas_desde_noticias
from services.news_api import obtener_temas_relevantes
from services.seed import seed_logros
from votapp_app import rss
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import requests, os, logging, uuid, shutil
from dotenv import load_dotenv
import votapp_app.controllers.usersControllers as usersControllers





BASE_URL = os.getenv("APP_BASE_URL", "https://aplicacion-votapp-test.onrender.com")

# -----------------------------
# Configuración global de logging
# -----------------------------
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# -----------------------------
# Inicialización de la aplicación
# -----------------------------
app = FastAPI(
    title="VoxPop API",
    description="API para encuestas cívicas con usuarios, perfiles y gamificación",
    version="1.0.0",
    debug=True
)

# -----------------------------
# Crear tablas y seed inicial
# -----------------------------
models.Base.metadata.create_all(bind=engine)
models_simple.Base.metadata.create_all(bind=engine)
seed_logros()

# -----------------------------
# Middleware CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ⚠️ en producción conviene limitar orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Middleware de logging global
# -----------------------------
@app.middleware("http")
async def log_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.exception(f"❌ Error en {request.url.path}: {e}")
        return JSONResponse(status_code=500, content={"detail": "Error interno en el servidor"})

# -----------------------------
# Carpeta media
# -----------------------------
os.makedirs("media/avatars", exist_ok=True)
os.makedirs("media/images", exist_ok=True)
os.makedirs("media/videos", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# -----------------------------
# Routers con prefijo /api
# -----------------------------


app.include_router(usersControllers.router, prefix="/api", tags=["usuarios"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(friendsController.router, prefix="/api", tags=["friends"])
app.include_router(notificationsController.router, prefix="/api", tags=["notifications"])
app.include_router(surveys.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(gamificacion.router, prefix="/api")
app.include_router(rss.router, prefix="/api")
app.include_router(surveys_simple.router, prefix="/api")



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
    noticias = obtener_temas_relevantes(country, category, count)["articles"]
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
    return [{"id": e.id, "title": e.title, "description": e.description, "media_url": e.media_url} for e in encuestas]

# -----------------------------
# Scheduler con APScheduler
# -----------------------------
scheduler = BackgroundScheduler()

def job_youtube():
    try:
        url = BASE_URL + "/api/youtube/diariolibre"
        requests.get(url)
        print("✅ Encuestas de YouTube actualizadas")
    except Exception as e:
        print("❌ Error en job_youtube:", e)

def job_rss():
    try:
        url = BASE_URL + "/api/rss/diariolibre"
        requests.get(url)
        print("✅ Encuestas de RSS actualizadas")
    except Exception as e:
        print("❌ Error en job_rss:", e)

scheduler.add_job(job_youtube, "interval", hours=6)
scheduler.add_job(job_rss, "interval", hours=6)
scheduler.start()

@app.on_event("startup")
def startup_event():
    scheduler.add_job(job_youtube, "date", run_date=datetime.utcnow() + timedelta(minutes=1))
    scheduler.add_job(job_rss, "date", run_date=datetime.utcnow() + timedelta(minutes=1))

# -----------------------------
# Adaptador para Cloud Functions
# -----------------------------
handler = Mangum(app)

# -----------------------------
# Endpoint de subida de imágenes
# -----------------------------
@app.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}.jpg"
    file_path = os.path.join("media/images", filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"{BASE_URL}/media/images/{filename}"}

# -----------------------------
# Endpoint de subida de videos
# -----------------------------
@app.post("/api/upload/video")
async def upload_video(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}.mp4"
    file_path = os.path.join("media/videos", filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"{BASE_URL}/media/videos/{filename}"}

# -----------------------------
# Punto de entrada
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

