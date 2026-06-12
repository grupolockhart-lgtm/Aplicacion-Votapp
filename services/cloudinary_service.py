
# services/cloudinary_service.py

import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_avatar(file, folder="avatars"):
    """Sube un archivo a Cloudinary y devuelve la URL pública"""
    result = cloudinary.uploader.upload(file, folder=folder)
    return result["secure_url"]
