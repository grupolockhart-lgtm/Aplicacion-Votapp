

from votapp_app.database import SessionLocal
from votapp_app import models

def seed_logros():
    db = SessionLocal()
    logros_base = [
        ("Primer voto", "Has participado en tu primera encuesta", "🏆"),
        ("10 encuestas completadas", "Has participado en 10 encuestas", "📊"),
        ("50 encuestas completadas", "Has participado en 50 encuestas", "📈"),
        ("100 encuestas completadas", "Has participado en 100 encuestas", "🎯"),
        ("Encuesta patrocinada", "Has participado en una encuesta patrocinada", "💰"),
        ("Racha de 7 días", "Has participado 7 días seguidos", "🔥"),
        ("Racha de 30 días", "Has participado 30 días seguidos", "🔥🔥"),
        ("Racha de 100 días", "Has participado 100 días seguidos", "🔥🔥🔥"),
        ("100 puntos acumulados", "Has alcanzado 100 puntos en gamificación", "⭐"),
        ("500 puntos acumulados", "Has alcanzado 500 puntos en gamificación", "⭐⭐"),
        ("1000 puntos acumulados", "Has alcanzado 1000 puntos en gamificación", "⭐⭐⭐"),
        ("2500 puntos acumulados", "Has alcanzado 2500 puntos en gamificación", "🏅"),
        ("5000 puntos acumulados", "Has alcanzado 5000 puntos en gamificación", "🏆"),
        ("10000 puntos acumulados", "Has alcanzado 10000 puntos en gamificación", "👑"),
        ("Nivel 5 alcanzado", "Has llegado al nivel 5", "🎯"),
        ("Nivel 10 alcanzado", "Has llegado al nivel 10", "🎯🎯"),
        ("Nivel 20 alcanzado", "Has llegado al nivel 20", "🎯🎯🎯"),
        ("Nivel 30 alcanzado", "Has llegado al nivel 30", "👑"),
        ("Invitar a un amigo", "Has invitado a un amigo a la plataforma", "🤝"),
        ("Compartir resultados", "Has compartido resultados en redes sociales", "📢"),
        ("Feedback enviado", "Has enviado retroalimentación sobre una encuesta", "📝"),
    ]

    for nombre, descripcion, icono in logros_base:
        existe = db.query(models.Logro).filter(models.Logro.nombre == nombre).first()
        if not existe:
            nuevo = models.Logro(nombre=nombre, descripcion=descripcion, icono=icono)
            db.add(nuevo)

    db.commit()
    db.close()

