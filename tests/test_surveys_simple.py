

import pytest
from fastapi.testclient import TestClient
import sys, os

# Añadimos la carpeta raíz al path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Importamos desde votapp_app
from votapp_app.main import app

client = TestClient(app)

AUTH_HEADERS = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzczNjY3NTM4fQ.Ablz6q71dXIZTu8GuK9sOGqvTIs9CpVxB01W-NvUHyM"
}




def test_crear_encuesta_simple():
    payload = {
        "titulo": "Encuesta de prueba",
        "imagenes": [],
        "videos": [],
        "preguntas": [
            {
                "texto": "¿Te gusta programar?",
                "opciones": [
                    {"texto": "Sí"},
                    {"texto": "No"}
                ]
            }
        ]
    }
    resp = client.post("/api/surveys/simple/", json=payload, headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["titulo"] == "Encuesta de prueba"
    assert len(data["preguntas"]) == 1
    assert len(data["preguntas"][0]["opciones"]) == 2


def test_listar_disponibles():
    resp = client.get("/api/surveys/simple/disponibles", headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    if data:  # si hay encuestas
        encuesta = data[0]
        assert "preguntas" in encuesta
        assert isinstance(encuesta["preguntas"], list)


def test_votar_encuesta_simple():
    # 👉 Usa un ID válido de encuesta y opción
    survey_id = 13
    opcion_id = 35
    resp = client.post(
        f"/api/surveys/simple/{survey_id}/vote",
        json={"opcion_id": opcion_id},
        headers=AUTH_HEADERS
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "mensaje" in data
    assert data["mensaje"] == "Voto registrado"


def test_listar_votadas():
    resp = client.get("/api/surveys/simple/votadas", headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


def test_listar_finalizadas():
    resp = client.get("/api/surveys/simple/finalizadas", headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    if data:
        assert data[0]["estado"] == "finalizada"

