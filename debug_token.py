

from jose import jwt

SECRET_KEY = "supersecreto"   # usa el mismo que en tu backend
ALGORITHM = "HS256"

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZXhwIjoxNzY4MDk0MDkyfQ.NAUxHLFJTLcLLAK4krUGLOa4e8YeyhQMTpHqSd5KHY4"  # pega aquí tu token real

payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
print(payload)