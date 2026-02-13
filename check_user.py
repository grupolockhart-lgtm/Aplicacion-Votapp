

from votapp_app.database import SessionLocal
from votapp_app.models import Usuario

db = SessionLocal()
usuario = db.query(Usuario).filter(Usuario.id == 2).first()
print(usuario)