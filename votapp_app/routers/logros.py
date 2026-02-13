

from sqlalchemy.orm import Session
from .. import models

# -----------------------------
# Verificación y asignación de logros
# -----------------------------
def verificar_logros(db: Session, usuario_id: int, perfil_publico: models.PerfilPublico):
    """
    Revisa puntos, racha y participaciones para asignar logros al usuario.
    """
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario or not perfil_publico:
        return

    # --- Participación ---
    # Calcular encuestas completadas dinámicamente
    encuestas_completadas = db.query(models.Participacion)\
        .filter(models.Participacion.usuario_id == usuario_id)\
        .count()

    if perfil_publico.puntos >= 1:
        asignar_logro(db, usuario, "Primer voto")
    if encuestas_completadas >= 10:
        asignar_logro(db, usuario, "10 encuestas completadas")
    if encuestas_completadas >= 50:
        asignar_logro(db, usuario, "50 encuestas completadas")
    if encuestas_completadas >= 100:
        asignar_logro(db, usuario, "100 encuestas completadas")

    # --- Rachas ---
    if perfil_publico.racha_dias >= 7:
        asignar_logro(db, usuario, "Racha de 7 días")
    if perfil_publico.racha_dias >= 30:
        asignar_logro(db, usuario, "Racha de 30 días")
    if perfil_publico.racha_dias >= 100:
        asignar_logro(db, usuario, "Racha de 100 días")

    # --- Puntos acumulados ---
    if perfil_publico.puntos >= 100:
        asignar_logro(db, usuario, "100 puntos acumulados")
    if perfil_publico.puntos >= 500:
        asignar_logro(db, usuario, "500 puntos acumulados")
    if perfil_publico.puntos >= 1000:
        asignar_logro(db, usuario, "1000 puntos acumulados")
    if perfil_publico.puntos >= 2500:
        asignar_logro(db, usuario, "2500 puntos acumulados")
    if perfil_publico.puntos >= 5000:
        asignar_logro(db, usuario, "5000 puntos acumulados")
    if perfil_publico.puntos >= 10000:
        asignar_logro(db, usuario, "10000 puntos acumulados")

    # --- Niveles alcanzados ---
    if perfil_publico.nivel >= 5:
        asignar_logro(db, usuario, "Nivel 5 alcanzado")
    if perfil_publico.nivel >= 10:
        asignar_logro(db, usuario, "Nivel 10 alcanzado")
    if perfil_publico.nivel >= 20:
        asignar_logro(db, usuario, "Nivel 20 alcanzado")
    if perfil_publico.nivel >= 30:
        asignar_logro(db, usuario, "Nivel 30 alcanzado")


    # --- Sociales / especiales ---
    # Estos se asignan en otros endpoints específicos
    # Ejemplo: al invitar a un amigo, compartir resultados, enviar feedback



# -----------------------------
# Función auxiliar para asignar logros
# -----------------------------
def asignar_logro(db: Session, usuario: models.Usuario, nombre_logro: str):
    """
    Asigna un logro al usuario si aún no lo tiene.
    """
    logro = db.query(models.Logro).filter(models.Logro.nombre == nombre_logro).first()
    if not logro:
        return

    ya_tiene = db.query(models.UsuarioLogro).filter(
        models.UsuarioLogro.usuario_id == usuario.id,
        models.UsuarioLogro.logro_id == logro.id
    ).first()

    if not ya_tiene:
        nuevo = models.UsuarioLogro(usuario_id=usuario.id, logro_id=logro.id)
        db.add(nuevo)
        db.commit()