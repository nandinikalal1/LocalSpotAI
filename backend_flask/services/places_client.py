# backend_flask/services/places_client.py
import requests
import math
from functools import lru_cache

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

PLACE_CATEGORIES = {
    "parks": 'leisure~"park|garden|playground"',
    "cafes": 'amenity~"cafe|restaurant|bar|fast_food"',
    "gyms": 'leisure~"fitness_centre|gym"',
    "salons": 'shop~"beauty|hairdresser|spa"',
    "libraries": 'amenity~"library"',
    "shops": 'shop~"supermarket|mall|retail|store|convenience"',
    "hospitals": 'amenity~"hospital|clinic|doctors"|healthcare~"hospital|clinic"',
    "supermarkets": 'shop~"supermarket|grocery"',
}

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = map(math.radians, [lat2 - lat1, lon2 - lon1])
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(a)) * 0.621371  # miles

def build_query(lat, lng, radius_m, included_types):
    if not included_types:
        included_types = list(PLACE_CATEGORIES.keys())
    blocks = []
    for t in included_types:
        if t in PLACE_CATEGORIES:
            filt = PLACE_CATEGORIES[t]
            blocks.append(f'node(around:{radius_m},{lat},{lng})[{filt}];')
            blocks.append(f'way(around:{radius_m},{lat},{lng})[{filt}];')
            blocks.append(f'relation(around:{radius_m},{lat},{lng})[{filt}];')
    block_str = "\n".join(blocks)
    return f"""
    [out:json][timeout:25];
    (
      {block_str}
    );
    out center 60;
    """

@lru_cache(maxsize=100)
def _cached_overpass(lat, lng, radius_m, key):
    query = build_query(lat, lng, radius_m, key.split(",") if key else [])
    resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=40)
    resp.raise_for_status()
    data = resp.json()
    places = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        # coordinates
        plat = el.get("lat") or (el.get("center") or {}).get("lat")
        plon = el.get("lon") or (el.get("center") or {}).get("lon")
        if not plat or not plon:
            continue
        ptype = (
            tags.get("amenity")
            or tags.get("shop")
            or tags.get("leisure")
            or tags.get("tourism")
            or "place"
        )
        places.append(
            {
                "name": name,
                "type": ptype,
                "lat": plat,
                "lng": plon,
            }
        )
    return places

def get_nearby_places(lat, lng, radius_m=5000, included_types=None, max_results=20):
    key = ",".join(included_types or [])
    places = _cached_overpass(lat, lng, radius_m, key)
    for p in places:
        p["distance"] = round(haversine(lat, lng, p["lat"], p["lng"]), 2)
    places.sort(key=lambda x: x["distance"])
    return places[:max_results]
