import requests
import math
from functools import lru_cache

# CONFIG
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


#CATEGORY MAPPING (Frontend <-> OSM Tag Groups)

PLACE_CATEGORIES = {
    "parks": ['leisure=park', 'leisure=garden'],
    "cafes": ['amenity=cafe', 'amenity=restaurant', 'amenity=fast_food'],
    "gyms": ['leisure=fitness_centre', 'sport=gym'],
    "salons": ['shop=hairdresser', 'shop=beauty', 'amenity=spa'],
    "libraries": ['amenity=library'],
    "universities": ['amenity=university', 'amenity=college', 'building=school'],
    "malls": ['shop=mall', 'building=retail', 'amenity=marketplace'],
    "service_center": ['shop=car_repair', 'amenity=car_wash', 'amenity=service_station'],
    "spiritual": ['amenity=place_of_worship', 'religion=hindu', 'religion=christian'],
    "hospitals": ['amenity=hospital', 'healthcare=hospital', 'amenity=clinic'],
    "supermarkets": ['shop=supermarket', 'shop=convenience', 'shop=grocery'],
}

# Distance 

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate distance (in km) between two lat/lng coordinates.
    """
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return R * c


# Query Builder

def build_overpass_query(lat, lng, radius_m, included_types=None):
    """
    Builds Overpass API query string dynamically based on selected categories.
    If no categories are given, queries all major tags.
    """
    if not included_types:
        included_types = list(PLACE_CATEGORIES.keys())

    osm_filters = []
    for t in included_types:
        tags = PLACE_CATEGORIES.get(t, [])
        if not tags:
            tags = [f"amenity={t}"]
        osm_filters.extend(tags)

    # Create node/way filters
    node_filters = " ".join([f'node[{tag}](around:{radius_m},{lat},{lng});' for tag in osm_filters])
    way_filters = " ".join([f'way[{tag}](around:{radius_m},{lat},{lng});' for tag in osm_filters])

    query = f"""
    [out:json];
    (
        {node_filters}
        {way_filters}
    );
    out center 100;
    """
    return query

# Caching Wrapper

@lru_cache(maxsize=100)
def cached_places(lat, lng, radius_m, included_key):
    """
    Cache wrapper for repeated nearby queries (in-memory).
    """
    print(f"Fetching Overpass data (not cached): {included_key or 'ALL'}")
    included_types = included_key.split(",") if included_key else []
    query = build_overpass_query(lat, lng, radius_m, included_types)

    try:
        response = requests.get(OVERPASS_URL, params={"data": query}, timeout=35)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Overpass API error: {e}")
        return []

    results = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            continue

        # Extract coordinates
        lat2 = el.get("lat") or (el.get("center") or {}).get("lat")
        lon2 = el.get("lon") or (el.get("center") or {}).get("lon")
        if not lat2 or not lon2:
            continue

        # Determine type (amenity / shop / leisure / healthcare)
        place_type = (
            tags.get("amenity")
            or tags.get("shop")
            or tags.get("leisure")
            or tags.get("healthcare")
            or tags.get("religion")
            or "place"
        )

        # Optional address info
        address = tags.get("addr:street") or tags.get("addr:full") or tags.get("addr:city") or ""

        results.append({
            "name": name,
            "type": place_type,
            "formattedAddress": address,
            "lat": lat2,
            "lng": lon2,
        })

    return results


# Main Function

def get_nearby_places(lat, lng, radius_m=2000, included_types=None, max_results=30):
    """
    Fetch nearby places and compute distances. Uses caching + Overpass.
    """
    included_types = included_types or []
    included_key = ",".join(included_types)

    try:
        raw_places = cached_places(lat, lng, radius_m, included_key)
        enriched = []
        for p in raw_places:
            try:
                p["distance"] = round(haversine(lat, lng, p["lat"], p["lng"]), 2)
                enriched.append(p)
            except Exception:
                continue

        enriched.sort(key=lambda x: x["distance"])
        return enriched[:max_results]
    except Exception as e:
        print(f"Error in get_nearby_places: {e}")
        return []



# Cache Control
def clear_cache():
    cached_places.cache_clear()
    print("Overpass cache cleared.")



# Testing

if __name__ == "__main__":
    test_lat, test_lng = 32.7767, -96.7970  # Dallas
    results = get_nearby_places(test_lat, test_lng, 1500, ["parks", "cafes", "gyms"], 10)
    for r in results:
        print(f"{r['name']} ({r['type']}) - {r['distance']} km")
