

from sqlalchemy.orm import Session
from votapp_app import models, database
from votapp_app.auth import hash_password



def crear_admin_inicial():
    db: Session = database.SessionLocal()
    admin = db.query(models.Usuario).filter(models.Usuario.correo == "admin@votapp.com").first()
    if not admin:
        nuevo_admin = models.Usuario(
            nombre="Admin",
            correo="admin@votapp.com",
            contrasena_hash=hash_password("123456"),  # 👈 ahora sin ñ
            rol="admin"
        )
        db.add(nuevo_admin)
        db.commit()
        db.refresh(nuevo_admin)
        print("✅ Usuario admin creado:", nuevo_admin.correo)
    else:
        print("ℹ️ Ya existe un usuario admin con ese correo")
    db.close()

if __name__ == "__main__":
    crear_admin_inicial()

