
import matplotlib.pyplot as plt
import requests

def grafico_pastel(options, votes):
    plt.figure(figsize=(6,6))
    plt.pie(votes, labels=options, autopct="%1.1f%%", startangle=90)
    plt.title("Resultados de la encuesta")
    plt.show()

def grafico_barras(options, votes):
    total_votes = sum(votes)
    percentages = [(v / total_votes * 100) if total_votes > 0 else 0 for v in votes]

    plt.figure(figsize=(8,6))
    bars = plt.bar(options, votes, color="skyblue", edgecolor="black")

    for bar, pct in zip(bars, percentages):
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.1,
                 f"{yval} ({pct:.1f}%)",
                 ha="center", va="bottom", fontsize=10, fontweight="bold")

    plt.xlabel("Opciones", fontsize=12)
    plt.ylabel("Número de votos", fontsize=12)
    plt.title("Resultados de la encuesta", fontsize=14, fontweight="bold")
    plt.grid(axis="y", linestyle="--", alpha=0.7)
    plt.show()

# 🚀 Aquí va la conexión al backend
survey_id = 1  # ID de la encuesta que quieras visualizar
response = requests.get(f"http://localhost:8000/api/results/{survey_id}")
data = response.json()

options = list(data["results"].keys())
votes = [data["results"][opt]["count"] for opt in options]

grafico_barras(options, votes)   # Para ver barras
# grafico_pastel(options, votes) # Para ver pastel


