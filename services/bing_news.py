import requests
from fastapi import FastAPI

app = FastAPI()

NEWS_API_KEY = "361e6f14ac8f45649d848be381d953dc"



@app.get("/temas-relevantes")
def temas_relevantes():
    url = f"https://newsapi.org/v2/top-headlines?language=es&apiKey={NEWS_API_KEY}"
    response = requests.get(url)
    data = response.json()

    # Simplificamos la respuesta para tu app
    noticias = [
        {
            "titulo": article["title"],
            "descripcion": article["description"],
            "url": article["url"]
        }
        for article in data.get("articles", [])
    ]
    return {"noticias": noticias}





