

from votapp_app import models
from votapp_app.database import engine

print("Tablas registradas en metadata:", models.Base.metadata.tables.keys())
models.Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas en surveys.db")

