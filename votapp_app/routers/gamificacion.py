

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database, models, schemas
from ..auth import get_current_user
from .logros import verificar_logros

router = APIRouter(prefix="/gamificacion", tags=["gamificacion"])

# -----------------------------
# Estado de gamificación (puntos, racha, nivel, logros)
# -----------------------------
@router.get("/estado")
def estado_gamificacion(
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    verificar_logros(db, current_user.id, current_user.perfil_publico)

    perfil = current_user.perfil_publico
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    puntos = perfil.puntos
    racha = perfil.racha_dias
    nivel = perfil.nivel

    # Traer logros con join
    logros_query = (
        db.query(models.Logro)
        .join(models.UsuarioLogro, models.UsuarioLogro.logro_id == models.Logro.id)
        .filter(models.UsuarioLogro.usuario_id == current_user.id)
        .all()
    )

    logros_out = [schemas.LogroOut.model_validate(logro) for logro in logros_query]

    return {
        "puntos": puntos,
        "racha_dias": racha,
        "nivel": nivel,
        "logros": logros_out
    }







