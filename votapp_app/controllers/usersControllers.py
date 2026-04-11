# votapp_app/controllers/usersController.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Usuario

router = APIRouter()

@router.get("/usuarios/{usuario_id}")
def get_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    perfil = usuario.perfil_publico

    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "correo": usuario.correo,
        "ciudad": usuario.ciudad,
        "profesion": usuario.profesion,
        "alias": perfil.alias if perfil else None,
        "avatar_url": perfil.avatar_url if perfil else None,
        "bio": perfil.bio if perfil else None,
        "nivel": perfil.nivel if perfil else None,
        "puntos": perfil.puntos if perfil else None,
        "racha_dias": perfil.racha_dias if perfil else None,
    }


