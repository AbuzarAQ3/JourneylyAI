from dataclasses import dataclass
from urllib.parse import quote
import requests
from django.conf import settings

@dataclass
class NormalizedPlace:
    name: str
    latitude: float
    longitude: float

class MapTilerGeocodingService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.MAPTILER_GEOCODING_KEY
        self.base_url = "https://api.maptiler.com/geocoding"

    def fetch(self, query: str, limit: int = 1):
        clean_query = (query or "").strip()
        if not clean_query:
            return []
            
        url = f"{self.base_url}/{quote(clean_query)}.json"
        response = requests.get(
            url,
            headers={"Accept": "application/json"},
            params={"key": self.api_key, "limit": limit},
            timeout=5,
        )

        response.raise_for_status()
        return response.json()

def normalize_place(matches):
    results = []
    for feature in matches.get("features", []):
        coords = feature.get("geometry", {}).get("coordinates", [])
        if len(coords) < 2:
            continue

        results.append(
            NormalizedPlace(
                name=feature.get("place_name") or feature.get("text", ""),
                latitude=coords[1],
                longitude=coords[0],
            )
        )

    return results

def resolve_place(query: str) -> list[NormalizedPlace]:
    if not query or not query.strip():
        return []

    service = MapTilerGeocodingService()
    matches = service.fetch(query=query, limit=5)
    results = normalize_place(matches)

    if not results:
        raise LookupError(f"No place found for '{query}'.")

    return results