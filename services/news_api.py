# -----------------------------
# Servicio NewsAPI
# -----------------------------
import os
import requests
import random
from dotenv import load_dotenv

load_dotenv()
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# -----------------------------
# Función principal
# -----------------------------
def obtener_temas_relevantes(country=None, paises=None, category=None, count=1):
    url = "https://newsapi.org/v2/top-headlines"
    todas_noticias = []

    # si se pasa un solo país
    if country:
        paises = [country]

    # si no se pasa nada, usa lista por defecto
    if not paises:
        paises = ["us", "mx", "do"]

    for c in paises:
        params = {
            "country": c,
            "pageSize": 10,
            "apiKey": NEWS_API_KEY
        }
        if category:
            params["category"] = category

        response = requests.get(url, params=params)
        data = response.json()

        # 👇 imprime solo un resumen, no todo el JSON
        print(f"Respuesta NewsAPI ({c}): {len(data.get('articles', []))} artículos")

        noticias = [
            {
                "titulo": art.get("title"),
                "descripcion": art.get("description"),
                "url": art.get("url"),
                "urlToImage": art.get("urlToImage"),
                "pais": c
            }
            for art in data.get("articles", [])
        ]
        todas_noticias.extend(noticias)

    seleccionadas = random.sample(todas_noticias, min(count, len(todas_noticias)))
    # 👇 devolvemos "articles" para mantener compatibilidad con tu main.py
    return {"articles": seleccionadas}










