
import time
from functools import lru_cache

CACHE = {}

def get_from_cache(key):
    data = CACHE.get(key)
    if data and (time.time() - data["time"]) < 3600:  # valid for 1 hr
        return data["value"]
    return None

def save_to_cache(key, value):
    CACHE[key] = {"value": value, "time": time.time()}
