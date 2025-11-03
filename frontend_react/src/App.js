import React, { useEffect, useMemo, useState } from "react";
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
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Chip,
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { motion } from "framer-motion";

const API_BASE = "http://127.0.0.1:5001";

// Default user location (Dallas) if geolocation is blocked
const DEFAULT_COORDS = { lat: 32.7767, lng: -96.7970 };

const CATEGORIES = [
  { label: "All", value: null, emoji: "🧭" },
  { label: "Cafes", value: "cafes", emoji: "☕" },
  { label: "Parks", value: "parks", emoji: "🌳" },
  { label: "Gyms", value: "gyms", emoji: "🏋️" },
  { label: "Salons", value: "salons", emoji: "💇" },
  { label: "Libraries", value: "libraries", emoji: "📚" },
  { label: "Universities", value: "university", emoji: "🎓" },
  { label: "Shopping Malls", value: "malls", emoji: "🛍️" },
  { label: "Service Centers", value: "service", emoji: "🛠️" },
  { label: "Spiritual", value: "spiritual", emoji: "🛕" },
  { label: "Hospitals", value: "hospitals", emoji: "🏥" },
  { label: "Supermarkets", value: "supermarkets", emoji: "🧺" },
];

function App() {
  // UI / Theme
  const [anchorEl, setAnchorEl] = useState(null);
  const [openSaved, setOpenSaved] = useState(false);
  const [openMap, setOpenMap] = useState(false);
  const [mapUrl, setMapUrl] = useState("");
  const [openProfile, setOpenProfile] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  // ========= Data =========
  const [places, setPlaces] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [coords, setCoords] = useState(DEFAULT_COORDS);

  // Cached user interactions (persisted)
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [likes, setLikes] = useState([]);
  const [dislikes, setDislikes] = useState([]);

  // Profile
  const [profile, setProfile] = useState({
    name: "Nandini",
    email: "",
    phone: "",
    address: "",
  });

  // Settings (persisted)
  const [settings, setSettings] = useState({
    unit: "km", // "km" or "mi"
    radius_m: 2000,
    max_results: 24,
  });

  // Explore / Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Persistence 
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("ls_settings"));
      if (s) setSettings(s);
    } catch {}
    try {
      setSavedPlaces(JSON.parse(localStorage.getItem("savedPlaces")) || []);
      setLikes(JSON.parse(localStorage.getItem("likedPlaces")) || []);
      setDislikes(JSON.parse(localStorage.getItem("dislikedPlaces")) || []);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("savedPlaces", JSON.stringify(savedPlaces));
  }, [savedPlaces]);
  useEffect(() => {
    localStorage.setItem("likedPlaces", JSON.stringify(likes));
  }, [likes]);
  useEffect(() => {
    localStorage.setItem("dislikedPlaces", JSON.stringify(dislikes));
  }, [dislikes]);
  useEffect(() => {
    localStorage.setItem("ls_settings", JSON.stringify(settings));
  }, [settings]);

  // ========= Geolocation + Initial Nearby =========
  useEffect(() => {
    // Try to get precise position, else fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setCoords(next);
          // initial fetch
          fetchNearbyPlaces(activeCategory, next);
        },
        () => {
          fetchNearbyPlaces(activeCategory, DEFAULT_COORDS);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchNearbyPlaces(activeCategory, DEFAULT_COORDS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived search suggestions
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (places || [])
      .filter((p) => (p.name || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, places]);

  // ========= Helpers =========
  const distanceText = (km) => {
    if (km == null) return "";
    if (settings.unit === "mi") {
      const mi = km * 0.621371;
      return `${mi.toFixed(2)} mi away`;
    }
    return `${km.toFixed(2)} km away`;
  };

  const openMapPopup = (place) => {
    const lat = place.lat || coords.lat;
    const lng = place.lng || coords.lng;
    setMapUrl(`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`);
    setOpenMap(true);
  };

  const toggleSave = (place) => {
    const already = savedPlaces.find((p) => p.name === place.name);
    if (already) setSavedPlaces(savedPlaces.filter((p) => p.name !== place.name));
    else setSavedPlaces([...savedPlaces, place]);
  };

  const toggleLike = (place) => {
    if (likes.includes(place.name)) setLikes(likes.filter((n) => n !== place.name));
    else {
      setLikes([...likes, place.name]);
      setDislikes(dislikes.filter((n) => n !== place.name));
    }
  };

  const toggleDislike = (place) => {
    if (dislikes.includes(place.name)) setDislikes(dislikes.filter((n) => n !== place.name));
    else {
      setDislikes([...dislikes, place.name]);
      setLikes(likes.filter((n) => n !== place.name));
    }
  };

  // API Calls
  const fetchNearbyPlaces = async (category = null, customCoords = null) => {
    setLoading(true);
    setActiveCategory(category);
    try {
      const res = await fetch(`${API_BASE}/places/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: (customCoords || coords).lat,
          lng: (customCoords || coords).lng,
          radius_m: settings.radius_m,
          included_types: category ? [category] : [],
          max_results: settings.max_results,
        }),
      });
      const data = await res.json();
      setPlaces(data.places || []);
    } catch (e) {
      console.error("nearby error:", e);
    }
    setLoading(false);
  };
const fetchRecommendations = async (recentCategory = null) => {
  try {
    const res = await fetch(`${API_BASE}/recommend/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: coords.lat,
        lng: coords.lng,
        recent_category: recentCategory,
        liked: likes,
        disliked: dislikes,
      }),
    });
    const data = await res.json();
    setRecommendations(data.recommendations || []);
  } catch (e) {
    console.error("recommend error:", e);
  }
};


   

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile/`);
      const data = await res.json();
      setProfile((p) => ({ ...p, ...data }));
    } catch (e) {
      console.error("profile error:", e);
    }
  };

  //Menu 
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  //Render
  return (
    <div
      style={{
        backgroundColor: "#F4EFFF", // light purple
        minHeight: "100vh",
        fontFamily: "'Poppins','EB Garamond',serif",
      }}
    >
      {/* Header */}
      <AppBar
        position="sticky"
        sx={{ backgroundColor: "#5B2C98", boxShadow: "0 3px 12px rgba(0,0,0,0.15)" }}
      >
        <Toolbar>
          <Typography
            variant="h4"
            sx={{
              flexGrow: 1,
              fontFamily: "'EB Garamond',serif",
              fontWeight: 800,
              color: "#FFF7E6",
              letterSpacing: 0.5,
            }}
          >
            LocalSpot AI
          </Typography>

          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem
              onClick={() => {
                fetchProfile();
                setOpenProfile(true);
                handleMenuClose();
              }}
            >
              Profile Settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                setOpenSaved(true);
                handleMenuClose();
              }}
            >
              Saved Places ({savedPlaces.length})
            </MenuItem>
            <MenuItem
              onClick={() => {
                setOpenSettings(true);
                handleMenuClose();
              }}
            >
              Settings
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Hero / CTA row */}
      <Box
        sx={{
          textAlign: "center",
          pt: "2.25rem",
          pb: "1rem",
          color: "#3A0CA3",
          maxWidth: "1100px",
          mx: "auto",
        }}
      >
        <Typography
          variant="h4"
          sx={{ color: "#5B2C98", mb: "0.35rem", fontWeight: 700, letterSpacing: 0.25 }}
        >
          👋 Hello, <span style={{ color: "#3A0CA3" }}>{profile.name || "Nandini"}</span>!
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontFamily: "'EB Garamond',serif",
            fontWeight: 900,
            color: "#2E2E2E",
            lineHeight: 1.1,
          }}
        >
          Discover & Explore Local Gems
        </Typography>

        {/* Big CTA buttons */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mt: "1.5rem", flexWrap: "wrap", rowGap: 1 }}
        >
          <Button
            variant="contained"
            onClick={() => {
              setSearchOpen(true);
              // refresh nearby to ensure suggestions are broad
              fetchNearbyPlaces(activeCategory);
            }}
            sx={{
              backgroundColor: "#FFF7E6",
              color: "#5B2C98",
              fontWeight: 800,
              px: 5,
              py: 1.6,
              borderRadius: "999px",
              textTransform: "none",
              fontSize: "1.1rem",
              boxShadow: "0 6px 14px rgba(91,44,152,0.22)",
              "&:hover": { backgroundColor: "#FBEED3" },
            }}
            startIcon={<SearchIcon />}
          >
            Explore
          </Button>

          <Button
            variant="outlined"
            onClick={() => fetchRecommendations(activeCategory)}
            sx={{
              borderColor: "#5B2C98",
              color: "#5B2C98",
              fontWeight: 800,
              px: 5,
              py: 1.6,
              borderRadius: "999px",
              textTransform: "none",
              fontSize: "1.1rem",
              "&:hover": { backgroundColor: "#EADDFD" },
            }}
          >
            Recommend for Me
          </Button>
        </Stack>

        {/* Search bar (expands after clicking Explore) */}
        {searchOpen && (
          <Box
            sx={{
              maxWidth: 720,
              mx: "auto",
              mt: 2.25,
              p: 1.25,
              borderRadius: "20px",
              background: "#FFF",
              boxShadow: "0 8px 22px rgba(0,0,0,0.10)",
            }}
          >
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search places…"
              fullWidth
              InputProps={{
                sx: {
                  fontSize: "1.05rem",
                },
              }}
            />
            {query && suggestions.length > 0 && (
              <List dense sx={{ mt: 1, maxHeight: 260, overflowY: "auto" }}>
                {suggestions.map((sug, i) => (
                  <ListItemButton
                    key={`${sug.name}-${i}`}
                    onClick={() => {
                      openMapPopup(sug);
                      setQuery("");
                      setSearchOpen(false);
                    }}
                  >
                    <ListItemText
                      primary={sug.name}
                      secondary={sug.formattedAddress || sug.type}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        )}
      </Box>

      {/* Category chips */}
      <Container sx={{ mb: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", rowGap: 1 }}
          justifyContent="center"
        >
          {CATEGORIES.map((c) => (
            <Chip
              key={c.label}
              label={`${c.emoji} ${c.label}`}
              onClick={() => fetchNearbyPlaces(c.value)}
              sx={{
                fontWeight: 700,
                backgroundColor: activeCategory === c.value ? "#5B2C98" : "#FFF",
                color: activeCategory === c.value ? "#FFF7E6" : "#5B2C98",
                border: "1.5px solid #5B2C98",
                "&:hover": {
                  backgroundColor: activeCategory === c.value ? "#4A2380" : "#EADDFD",
                },
              }}
            />
          ))}
        </Stack>
      </Container>

      {/* Content */}
      <Container sx={{ pb: "4rem" }}>
        {loading ? (
          <Box sx={{ textAlign: "center", mt: 6 }}>
            <CircularProgress color="secondary" />
            <Typography sx={{ mt: 2, color: "#5B2C98" }}>Finding local spots…</Typography>
          </Box>
        ) : (
          <>
            {/* Nearby */}
            <Typography
              variant="h5"
              sx={{ mt: 1, mb: 2, fontWeight: 800, color: "#3A0CA3" }}
            >
              {activeCategory ? `Nearby ${activeCategory}` : "Nearby Spots"}
            </Typography>
            <Grid container spacing={3}>
              {places.map((place, i) => (
                <Grid item xs={12} sm={6} md={4} key={`near-${i}`}>
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
                    <Card
                      sx={{
                        borderRadius: "16px",
                        backgroundColor: "#FFF9F3",
                        boxShadow: "0 4px 12px rgba(91,44,152,0.15)",
                        "&:hover": { transform: "translateY(-6px)" },
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ color: "#3A0CA3", fontWeight: 800 }}>
                          {place.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#5B2C98", mt: 0.5 }}>
                          📍 {place.formattedAddress || place.type || "—"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.8, color: "#8E79C7", display: "flex", alignItems: "center" }}
                        >
                          <RoomIcon fontSize="small" sx={{ mr: 1 }} />
                          {place.distance != null ? distanceText(place.distance) : ""}
                        </Typography>

                        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            onClick={() => openMapPopup(place)}
                            sx={{ textTransform: "none", color: "#5B2C98", fontWeight: 700 }}
                          >
                            Open Map
                          </Button>
                          <IconButton
                            onClick={() => toggleLike(place)}
                            sx={{
                              color: likes.includes(place.name) ? "#5B2C98" : "#B6A9D6",
                            }}
                          >
                            <ThumbUpIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => toggleDislike(place)}
                            sx={{
                              color: dislikes.includes(place.name) ? "#C23B22" : "#B6A9D6",
                            }}
                          >
                            <ThumbDownIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => toggleSave(place)}
                            sx={{
                              color: savedPlaces.find((p) => p.name === place.name)
                                ? "#E91E63"
                                : "#B6A9D6",
                            }}
                          >
                            <FavoriteIcon />
                          </IconButton>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <>
                <Divider sx={{ my: 4 }} />
                <Typography
                  variant="h5"
                  sx={{ mb: 2, fontWeight: 800, color: "#C05621" }}
                >
                  Recommended for You
                </Typography>
                <Grid container spacing={3}>
                  {recommendations.map((place, i) => (
                    <Grid item xs={12} sm={6} md={4} key={`rec-${i}`}>
                      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
                        <Card
                          sx={{
                            borderRadius: "16px",
                            backgroundColor: "#FFF9F3",
                            boxShadow: "0 4px 12px rgba(91,44,152,0.15)",
                            "&:hover": { transform: "translateY(-6px)" },
                          }}
                        >
                          <CardContent>
                            <Typography variant="h6" sx={{ color: "#3A0CA3", fontWeight: 800 }}>
                              {place.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#5B2C98", mt: 0.5 }}>
                              📍 {place.formattedAddress || place.type || "—"}
                            </Typography>
                            <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                onClick={() => openMapPopup(place)}
                                sx={{ textTransform: "none", color: "#5B2C98", fontWeight: 700 }}
                              >
                                Open Map
                              </Button>
                              <IconButton
                                onClick={() => toggleSave(place)}
                                sx={{
                                  color: savedPlaces.find((p) => p.name === place.name)
                                    ? "#E91E63"
                                    : "#B6A9D6",
                                }}
                              >
                                <FavoriteIcon />
                              </IconButton>
                            </Stack>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}
      </Container>

      {/* Saved Places Dialog */}
      <Dialog open={openSaved} onClose={() => setOpenSaved(false)} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            backgroundColor: "#5B2C98",
            color: "#FFF7E6",
            fontFamily: "'EB Garamond',serif",
            fontWeight: 800,
          }}
        >
          ❤️ Your Saved Places
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#F4EFFF", p: 3 }}>
          {savedPlaces.length === 0 ? (
            <Typography sx={{ textAlign: "center", color: "#5B2C98" }}>
              You haven’t saved any places yet.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {savedPlaces.map((place, i) => (
                <Grid item xs={12} sm={6} md={4} key={`saved-${i}`}>
                  <Card
                    sx={{
                      borderRadius: "16px",
                      backgroundColor: "#FFF9F3",
                      boxShadow: "0 4px 12px rgba(91,44,152,0.15)",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ color: "#3A0CA3", fontWeight: 800 }}>
                        {place.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#5B2C98", mt: 0.5 }}>
                        📍 {place.formattedAddress || place.type || "—"}
                      </Typography>
                      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                        <Button
                          onClick={() => openMapPopup(place)}
                          sx={{
                            textTransform: "none",
                            backgroundColor: "#5B2C98",
                            color: "#FFF7E6",
                            borderRadius: "20px",
                            px: 2,
                            "&:hover": { backgroundColor: "#4C1E86" },
                          }}
                        >
                          View on Map
                        </Button>
                        <Button
                          onClick={() => toggleSave(place)}
                          sx={{
                            textTransform: "none",
                            color: "#C23B22",
                            fontWeight: 700,
                          }}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#F4EFFF" }}>
          <Button
            onClick={() => setOpenSaved(false)}
            sx={{
              backgroundColor: "#5B2C98",
              color: "#FFF7E6",
              borderRadius: "20px",
              "&:hover": { backgroundColor: "#4C1E86" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={openProfile} onClose={() => setOpenProfile(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            backgroundColor: "#5B2C98",
            color: "#FFF7E6",
            fontFamily: "'EB Garamond',serif",
            fontWeight: 800,
          }}
        >
          👤 Profile Settings
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#F4EFFF", p: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#F4EFFF" }}>
          <Button onClick={() => setOpenProfile(false)} sx={{ color: "#5B2C98" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              await fetch(`${API_BASE}/profile/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
              });
              setOpenProfile(false);
            }}
            sx={{ backgroundColor: "#5B2C98" }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={openSettings} onClose={() => setOpenSettings(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            backgroundColor: "#5B2C98",
            color: "#FFF7E6",
            fontFamily: "'EB Garamond',serif",
            fontWeight: 800,
          }}
        >
          ⚙️ Settings
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#F4EFFF", p: 3 }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Distance Unit"
              value={settings.unit}
              onChange={(e) => setSettings({ ...settings, unit: e.target.value })}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="km">Kilometers</option>
              <option value="mi">Miles</option>
            </TextField>

            <TextField
              type="number"
              label="Default Radius (meters)"
              value={settings.radius_m}
              onChange={(e) =>
                setSettings({ ...settings, radius_m: Math.max(200, Number(e.target.value) || 200) })
              }
              fullWidth
            />

            <TextField
              type="number"
              label="Max Results"
              value={settings.max_results}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_results: Math.min(60, Math.max(6, Number(e.target.value) || 24)),
                })
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#F4EFFF" }}>
          <Button onClick={() => setOpenSettings(false)} sx={{ color: "#5B2C98" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={openMap} onClose={() => setOpenMap(false)} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            backgroundColor: "#5B2C98",
            color: "#FFF7E6",
            fontFamily: "'EB Garamond',serif",
            fontWeight: 800,
          }}
        >
          📍 Location View
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <iframe
            src={mapUrl}
            width="100%"
            height="420"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title="map"
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#F4EFFF" }}>
          <Button
            onClick={() => setOpenMap(false)}
            sx={{
              backgroundColor: "#5B2C98",
              color: "#FFF7E6",
              borderRadius: "20px",
              px: 3,
              "&:hover": { backgroundColor: "#4C1E86" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;
