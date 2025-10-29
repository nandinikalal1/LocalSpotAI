import math
import time
import requests
from services.cache_manager import get_from_cache, save_to_cache

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
UA = "LocalSpotAI/1.0 (contact: you@example.com)"


# ---------------------- UTILITY: Distance Calculation ----------------------
def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0088
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return 2 * R * math.asin(math.sqrt(a))


# ---------------------- UTILITY: Build Readable Address ----------------------
def _build_address(tags):
    house = tags.get("addr:housenumber", "")
    street = tags.get("addr:street", "")
    city = tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village") or ""
    state = tags.get("addr:state", "")
    postcode = tags.get("addr:postcode", "")
    parts = [f"{house} {street}".strip(), city, state, postcode]
    return ", ".join([p for p in parts if p])


# ---------------------- CATEGORY MAP ----------------------
CATEGORY_MAP = {
    "restaurants": ["restaurant", "cafe", "bar", "fast_food"],
    "parks": ["park"],
    "gyms": ["fitness_centre", "gym"],
    "libraries": ["library"],
    "shops": ["supermarket", "mall", "store"],
    "salons": ["beauty_salon", "hairdresser", "spa"],
}


# ---------------------- MAIN FUNCTION ----------------------
def get_nearby_places(lat, lng, radius_m=2000, included_types=None, max_results=20):
    """
    Fetch nearby places using OpenStreetMap (Overpass API).
    Supports category filtering + automatic cache invalidation after 1 hour.
    """
    # Normalize and expand requested categories
    if included_types:
        tags = []
        for cat in included_types:
            tags.extend(CATEGORY_MAP.get(cat.lower(), []))
    else:
        # Default: everything
        tags = sum(CATEGORY_MAP.values(), [])

    # 1️⃣ Cache key includes category
    cache_key = f"{lat}-{lng}-{radius_m}-{'_'.join(sorted(tags))}"

    # 2️⃣ Check cache with 1-hour TTL
    cached_data = get_from_cache(cache_key)
    if cached_data and (time.time() - cached_data["timestamp"] < 3600):
        print("⚡ Served from cache")
        return cached_data["data"]

    print(f"🔍 Fetching from Overpass for categories: {tags}")

    # 3️⃣ Build Overpass query dynamically
    tag_regex = "|".join(tags)
    query = f"""
    [out:json][timeout:25];
    (
      node(around:{radius_m},{lat},{lng})["amenity"~"^({tag_regex})$"];
      way(around:{radius_m},{lat},{lng})["amenity"~"^({tag_regex})$"];
      relation(around:{radius_m},{lat},{lng})["amenity"~"^({tag_regex})$"];

      node(around:{radius_m},{lat},{lng})["leisure"~"^({tag_regex})$"];
      way(around:{radius_m},{lat},{lng})["leisure"~"^({tag_regex})$"];
      relation(around:{radius_m},{lat},{lng})["leisure"~"^({tag_regex})$"];

      node(around:{radius_m},{lat},{lng})["shop"~"^({tag_regex})$"];
      way(around:{radius_m},{lat},{lng})["shop"~"^({tag_regex})$"];
      relation(around:{radius_m},{lat},{lng})["shop"~"^({tag_regex})$"];
    );
    out center {max_results};
    """

    try:
        resp = requests.post(
            OVERPASS_URL,
            data={"data": query},
            headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"},
            timeout=30,
        )
        if resp.status_code == 429:
            raise RuntimeError("Overpass rate-limited (429). Please retry later.")
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        raise RuntimeError(f"Overpass request failed: {e}") from e

    elements = data.get("elements", [])
    results = []
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name", "Unnamed Place")
        place_type = tags.get("amenity") or tags.get("leisure") or tags.get("shop") or ""

        # Get coordinates
        if "lat" in el and "lon" in el:
            plat, plon = el["lat"], el["lon"]
        elif "center" in el and "lat" in el["center"] and "lon" in el["center"]:
            plat, plon = el["center"]["lat"], el["center"]["lon"]
        else:
            continue

        distance_km = _haversine_km(lat, lng, plat, plon)
        address = _build_address(tags)

        results.append({
            "name": name,
            "formattedAddress": address,
            "lat": plat,
            "lng": plon,
            "distance": round(distance_km, 2),
            "type": place_type,
        })

    # Sort by distance, limit & save to cache
    results.sort(key=lambda x: x["distance"])
    save_to_cache(cache_key, {"timestamp": time.time(), "data": results[:max_results]})
    print("🧠 Cached new data")

    return results[:max_results]
