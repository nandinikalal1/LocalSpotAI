from services.places_client import get_nearby_places
import random

def get_recommendations(lat, lng, recent_category=None):
    """
    Very simple rule-based recommendation:
    - If user recently explored 'parks', recommend 'cafes' nearby (post-walk coffee)
    - If user explored 'gyms', recommend 'restaurants' (post-workout meal)
    - Else pick a random mix
    """
    mapping = {
        "parks": ["restaurants", "cafes"],
        "gyms": ["restaurants"],
        "restaurants": ["parks"],
        "salons": ["shops", "cafes"],
    }
    suggested_cats = mapping.get(recent_category, ["parks", "restaurants", "cafes"])
    all_results = []

    for cat in suggested_cats:
        all_results.extend(get_nearby_places(lat, lng, included_types=[cat], max_results=5))

    random.shuffle(all_results)
    return all_results[:8]
