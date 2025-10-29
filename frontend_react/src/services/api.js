import axios from "axios";



// Flask backend base URL (update if needed)
const BASE_URL = "http://127.0.0.1:5001";

// ---------------- Fetch nearby places ----------------
export const getNearbyPlaces = async (lat, lng) => {
  const response = await axios.post(`${BASE_URL}/places/nearby`, {
    lat,
    lng,
    radius_m: 3000,
    included_types: ["restaurant", "cafe", "park"],
    max_results: 10,
  });
  return response.data.places;
};

// ---------------- Get AI recommendations ----------------
export const getRecommendations = async (lat, lng, places) => {
  const response = await axios.post(`${BASE_URL}/recommend`, {
    user_lat: lat,
    user_lng: lng,
    places,
  });
  return response.data.recommendations;
};
