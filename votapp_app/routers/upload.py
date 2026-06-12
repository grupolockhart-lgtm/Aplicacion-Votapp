

# votapp_app/routes/upload.py

from fastapi import APIRouter, UploadFile, File
from typing import List
from services.cloudinary_service import upload_avatar

router = APIRouter()

@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    urls = []
    for file in files:
        # 👇 usa tu servicio, cambia la carpeta si quieres
        url = upload_avatar(file.file, folder="surveys")
        urls.append(url)
    return {"urls": urls}