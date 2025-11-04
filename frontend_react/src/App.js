import React, { useEffect, useState, useRef, useCallback } from "react";
import "./App.css";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import RoomIcon from "@mui/icons-material/Room";
// Line 33: Removed unused import: import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const API_BASE = "http://127.0.0.1:5001";

function App() {
  const [places, setPlaces] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [userLocation, setUserLocation] = useState({
    lat: 32.7767,
    lng: -96.7970,
  });
  const [anchorEl, setAnchorEl] = useState(null);

  // saved/liked/disliked local state
  const [savedPlaces, setSavedPlaces] = useState(() => {
    const raw = localStorage.getItem("savedPlaces");
    return raw ? JSON.parse(raw) : [];
  });
  const [likedPlaces, setLikedPlaces] = useState(() => {
    const raw = localStorage.getItem("likedPlaces");
    return raw ? JSON.parse(raw) : [];
  });
  const [dislikedPlaces, setDislikedPlaces] = useState(() => {
    const raw = localStorage.getItem("dislikedPlaces");
    return raw ? JSON.parse(raw) : [];
  });

  const [mapOpen, setMapOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const mapRef = useRef(null);

  const categories = [
    { label: "All", value: null, emoji: "🌍" },
    { label: "Cafes", value: "cafes", emoji: "☕" },
    { label: "Parks", value: "parks", emoji: "🌳" },
    { label: "Gyms", value: "gyms", emoji: "🏋️‍♀️" },
    { label: "Salons", value: "salons", emoji: "💇‍♀️" },
    { label: "Libraries", value: "libraries", emoji: "📚" },
    { label: "Shops", value: "shops", emoji: "🛍️" },
    { label: "Hospitals", value: "hospitals", emoji: "🏥" },
    { label: "Supermarkets", value: "supermarkets", emoji: "🛒" },
  ];

  // Line 121: Wrapped function in useCallback, depending on userLocation
  const fetchNearbyPlaces = useCallback(async (category = null, radius_m = 5000) => {
    setLoading(true);
    setActiveCategory(category);
    try {
      const res = await fetch(`${API_BASE}/places/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius_m,
          included_types: category ? [category] : [],
        }),
      });
      const data = await res.json();
      setPlaces(data.places || []);
    } catch (err) {
      console.error("Error fetching places:", err);
    }
    setLoading(false);
  }, [userLocation]); // <-- userLocation dependency is correct for useCallback

  // Line 140: Added fetchNearbyPlaces to the dependency array
  // This resolves the warning on line 135.
  // ---------- Load nearby on startup ----------
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(coords);
          fetchNearbyPlaces(null, 5000);
        },
        () => fetchNearbyPlaces(null, 5000)
      );
    } else {
      fetchNearbyPlaces(null, 5000);
    }
  }, [fetchNearbyPlaces]); // <-- Corrected dependency array

  // ---------- Recommend button (basic local logic) ----------
  const handleRecommend = () => {
    if (likedPlaces.length === 0 && savedPlaces.length === 0) {
      alert("Like or save places to personalize recommendations!");
      return;
    }
    const likedNames = [...likedPlaces, ...savedPlaces].map((p) => p.name.toLowerCase());
    const recs = places.filter(
      (p) =>
        likedNames.some((n) => p.name.toLowerCase().includes(n.split(" ")[0])) ||
        p.type?.includes("cafe") ||
        p.type?.includes("park")
    );
    setRecommended(recs.slice(0, 6));
  };

  // ---------- Save / Like / Dislike ----------
  const toggleSave = (place) => {
    const exists = savedPlaces.some((p) => p.name === place.name);
    const updated = exists
      ? savedPlaces.filter((p) => p.name !== place.name)
      : [...savedPlaces, place];
    setSavedPlaces(updated);
    localStorage.setItem("savedPlaces", JSON.stringify(updated));
  };

  const toggleLike = (place) => {
    const exists = likedPlaces.some((p) => p.name === place.name);
    const updated = exists
      ? likedPlaces.filter((p) => p.name !== place.name)
      : [...likedPlaces, place];
    setLikedPlaces(updated);
    localStorage.setItem("likedPlaces", JSON.stringify(updated));
  };

  const toggleDislike = (place) => {
    const exists = dislikedPlaces.some((p) => p.name === place.name);
    const updated = exists
      ? dislikedPlaces.filter((p) => p.name !== place.name)
      : [...dislikedPlaces, place];
    setDislikedPlaces(updated);
    localStorage.setItem("dislikedPlaces", JSON.stringify(updated));
  };

  // Line 196: Added fetchNearbyPlaces to the dependency array
  // This resolves the warning on line 189.
  // ---------- Search (calls backend when typing) ----------
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim().length > 2) {
        fetchNearbyPlaces(searchText.toLowerCase(), 15000);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [searchText, fetchNearbyPlaces]); // <-- Corrected dependency array

  // Line 219: Added userLocation to the dependency array
  // This resolves the warning on line 211.
  // ---------- Routing ----------
  useEffect(() => {
    const fetchRoute = async () => {
      if (!selectedPlace) return;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${selectedPlace.lng},${selectedPlace.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [
            lat,
            lon,
          ]);
          setRouteCoords(coords);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoute();
  }, [selectedPlace, userLocation]); // <-- Corrected dependency array

  // ---------- UI ----------
  return (
    <div className="app-root">
      <AppBar position="static" sx={{ background: "#5E2B97" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            LocalSpot AI
          </Typography>
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => setSavedOpen(true)}>Saved Places</MenuItem>
            <MenuItem onClick={() => alert("Settings coming soon!")}>
              Settings
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <div className="hero">
        <Typography variant="h5" sx={{ color: "#4A2B7B", fontWeight: 600 }}>
          Hello, Nandini 👋
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#2E2E2E" }}>
          Discover & Explore Local Gems
        </Typography>
        <TextField
          placeholder="Search for cafes, gyms, salons..."
          variant="outlined"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{
            marginTop: "1.2rem",
            width: "100%",
            maxWidth: "600px",
            background: "#fff",
            borderRadius: "10px",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#5E2B97" }} />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ marginTop: 2 }}>
          <Button
            variant="contained"
            sx={{ background: "#5E2B97", textTransform: "none" }}
            onClick={() => fetchNearbyPlaces(null, 5000)}
          >
            Explore Now
          </Button>
          <Button
            variant="outlined"
            sx={{ borderColor: "#5E2B97", color: "#5E2B97", textTransform: "none" }}
            onClick={handleRecommend}
          >
            Recommend for Me
          </Button>
        </Stack>

        {/* Categories */}
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          sx={{ flexWrap: "wrap", marginTop: "1.5rem" }}
        >
          {categories.map((cat) => (
            <Chip
              key={cat.label}
              label={`${cat.emoji} ${cat.label}`}
              onClick={() => fetchNearbyPlaces(cat.value, 24000)}
              sx={{
                background:
                  activeCategory === cat.value ? "#5E2B97" : "rgba(94,43,151,0.05)",
                color: activeCategory === cat.value ? "#fff" : "#3C304F",
              }}
            />
          ))}
        </Stack>
      </div>

      <Container sx={{ marginTop: "2rem" }}>
        {loading ? (
          <div className="centered">
            <CircularProgress sx={{ color: "#5E2B97" }} />
          </div>
        ) : (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nearby Spots
            </Typography>
            <Grid container spacing={2} sx={{ marginTop: 1 }}>
              {places.map((place, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card
                    onClick={() => setSelectedPlace(place) || setMapOpen(true)}
                    sx={{ borderRadius: "14px", cursor: "pointer" }}
                  >
                    <CardContent>
                      <Typography variant="h6">{place.name}</Typography>
                      <Typography sx={{ color: "#6F5C8E" }}>{place.type}</Typography>
                      <Typography sx={{ color: "#5E2B97" }}>
                        <RoomIcon sx={{ fontSize: 18 }} />{" "}
                        {place.distance ? `${place.distance} mi away` : ""}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ marginTop: 1 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton onClick={() => toggleSave(place)}>
                          {savedPlaces.some((p) => p.name === place.name) ? (
                            <FavoriteIcon sx={{ color: "#5E2B97" }} />
                          ) : (
                            <FavoriteBorderIcon sx={{ color: "#5E2B97" }} />
                          )}
                        </IconButton>
                        <IconButton onClick={() => toggleLike(place)}>
                          {likedPlaces.some((p) => p.name === place.name) ? (
                            <ThumbUpAltIcon sx={{ color: "#5E2B97" }} />
                          ) : (
                            <ThumbUpAltOutlinedIcon sx={{ color: "#5E2B97" }} />
                          )}
                        </IconButton>
                        <IconButton onClick={() => toggleDislike(place)}>
                          {dislikedPlaces.some((p) => p.name === place.name) ? (
                            <ThumbDownAltIcon sx={{ color: "#5E2B97" }} />
                          ) : (
                            <ThumbDownAltOutlinedIcon sx={{ color: "#5E2B97" }} />
                          )}
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {recommended.length > 0 && (
              <>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, marginTop: "2rem", color: "#5E2B97" }}
                >
                  Recommended for You
                </Typography>
                <Grid container spacing={2} sx={{ marginTop: 1 }}>
                  {recommended.map((p, i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <Card
                        onClick={() => setSelectedPlace(p) || setMapOpen(true)}
                        sx={{ borderRadius: "14px" }}
                      >
                        <CardContent>
                          <Typography variant="h6">{p.name}</Typography>
                          <Typography sx={{ color: "#6F5C8E" }}>{p.type}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}
      </Container>

      {/* Map modal */}
      <Dialog open={mapOpen} onClose={() => setMapOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{selectedPlace?.name || "Map"}</DialogTitle>
        <DialogContent sx={{ height: "400px" }}>
          {selectedPlace && (
            <MapContainer
              center={[selectedPlace.lat, selectedPlace.lng]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              whenCreated={(map) => (mapRef.current = map)}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[userLocation.lat, userLocation.lng]} />
              <Marker position={[selectedPlace.lat, selectedPlace.lng]} />
              {routeCoords.length > 0 && (
                <Polyline positions={routeCoords} pathOptions={{ color: "#5E2B97" }} />
              )}
            </MapContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Saved places modal */}
      <Dialog open={savedOpen} onClose={() => setSavedOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Saved Places</DialogTitle>
        <DialogContent>
          {savedPlaces.length === 0 ? (
            <Typography>No saved places yet.</Typography>
          ) : (
            savedPlaces.map((p, i) => (
              <Stack
                key={i}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ paddingY: 1 }}
              >
                <Typography>{p.name}</Typography>
                <Button
                  variant="text"
                  color="error"
                  onClick={() => toggleSave(p)}
                  sx={{ textTransform: "none" }}
                >
                  Remove
                </Button>
              </Stack>
            ))
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;