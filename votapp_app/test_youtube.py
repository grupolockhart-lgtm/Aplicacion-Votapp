from googleapiclient.discovery import build

API_KEY = "AIzaSyAfCPWp5PSnYSPFeLNa16Yq3Cwm1TVhvso"

youtube = build("youtube", "v3", developerKey=API_KEY)

# Paso 1: buscar el canal por nombre/handle
search_response = youtube.search().list(
    part="snippet",
    q="Diario Libre Multimedios",
    type="channel",
    maxResults=1
).execute()

channel_id = search_response["items"][0]["id"]["channelId"]
print("Channel ID encontrado:", channel_id)

# Paso 2: obtener la playlist de subidas
channel_response = youtube.channels().list(
    part="contentDetails",
    id=channel_id
).execute()

uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

# Paso 3: obtener los últimos videos
videos_response = youtube.playlistItems().list(
    part="snippet",
    playlistId=uploads_playlist_id,
    maxResults=5
).execute()

for item in videos_response["items"]:
    video_id = item["snippet"]["resourceId"]["videoId"]
    title = item["snippet"]["title"]
    published = item["snippet"]["publishedAt"]
    thumbnail = item["snippet"]["thumbnails"]["high"]["url"]
    link = f"https://www.youtube.com/watch?v={video_id}"

    print(f"Título: {title}")
    print(f"Publicado: {published}")
    print(f"Enlace: {link}")
    print(f"Thumbnail: {thumbnail}")
    print("-" * 40)