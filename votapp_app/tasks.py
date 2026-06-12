
## votapp_app/tasks.py

from datetime import datetime
from votapp_app import models, database

def cerrar_encuestas_por_presupuesto():
    db = database.SessionLocal()
    encuestas = db.query(models.Survey).filter(
        models.Survey.patrocinada == True,
        models.Survey.active == True,
        models.Survey.presupuesto_total <= 0
    ).all()

    for encuesta in encuestas:
        encuesta.active = False
        encuesta.closed_at = datetime.utcnow()
        encuesta.closed_reason = "funds"
        print(f"💰 Encuesta {encuesta.id} cerrada por presupuesto agotado")

    db.commit()
    db.close()
