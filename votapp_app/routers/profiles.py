

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database

router = APIRouter(prefix="/profiles", tags=["profiles"])

@router.get("/public/{alias}", response_model=schemas.PublicProfileOut)
def get_public_profile(alias: str, db: Session = Depends(database.get_db)):
    profile = db.query(models.PerfilPublico).filter(models.PerfilPublico.alias == alias).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return profile
