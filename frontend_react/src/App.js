import React, { useState } from "react";
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
  Fab,
  Chip,
  Stack,
} from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import { motion } from "framer-motion";

function App() {
  const [places, setPlaces] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    { label: "All", value: null, emoji: "🌍" },
    { label: "Cafes", value: "restaurants", emoji: "☕" },
    { label: "Parks", value: "parks", emoji: "🌳" },
    { label: "Gyms", value: "gyms", emoji: "🏋️‍♀️" },
    { label: "Salons", value: "salons", emoji: "💇‍♀️" },
    { label: "Libraries", value: "libraries", emoji: "📚" },
    { label: "Shops", value: "shops", emoji: "🛍️" },
  ];

  //FETCH NEARBY PLACES
  const fetchNearbyPlaces = async (category = null) => {
    setLoading(true);
    setActiveCategory(category);
    try {
      const res = await fetch("http://127.0.0.1:5001/places/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: 32.7767,
          lng: -96.7970,
          radius_m: 2000,
          included_types: category ? [category] : [],
        }),
      });
      const data = await res.json();
      setPlaces(data.places || []);
      if (category) fetchRecommendations(category);
    } catch (error) {
      console.error("Error fetching places:", error);
    }
    setLoading(false);
  };

  //FETCH RECOMMENDATIONS
  const fetchRecommendations = async (recentCategory) => {
    try {
      const res = await fetch("http://127.0.0.1:5001/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: 32.7767,
          lng: -96.7970,
          recent_category: recentCategory,
        }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  //MAIN UI
  return (
    <div
      style={{
        backgroundColor: "#FFF7F0",
        minHeight: "100vh",
        fontFamily: "'Poppins', 'EB Garamond', serif",
      }}
    >
      {/* HEADER */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "#FF8C42",
          paddingY: 1.2,
          boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar>
          <Typography
            variant="h4"
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              fontFamily: "'EB Garamond', serif",
              color: "white",
              letterSpacing: 1,
            }}
          >
            LocalSpot AI
          </Typography>
          <Button
            sx={{
              color: "white",
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
            }}
            onClick={() => fetchNearbyPlaces()}
          >
            Discover Nearby
          </Button>
        </Toolbar>
      </AppBar>

      {/* HERO SECTION */}
      <div
        className="hero-section"
        style={{
          backgroundColor: "#FFF7F0",
          textAlign: "center",
          padding: "5rem 2rem 3rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: "#333",
              marginBottom: "0.5rem",
            }}
          >
            👋 Hello, <span style={{ color: "#FF8C42" }}>Nandini</span>!
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontFamily: "'EB Garamond', serif",
              fontWeight: "bold",
              color: "#2E2E2E",
            }}
          >
            Discover & Explore Local Gems
          </Typography>

          {/* CATEGORY FILTERS */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ marginTop: "2rem", flexWrap: "wrap", rowGap: 1 }}
          >
            {categories.map((cat) => (
              <Chip
                key={cat.label}
                label={`${cat.emoji} ${cat.label}`}
                onClick={() => fetchNearbyPlaces(cat.value)}
                sx={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  paddingY: "0.5rem",
                  backgroundColor:
                    activeCategory === cat.value ? "#FF8C42" : "#fff",
                  color: activeCategory === cat.value ? "#fff" : "#444",
                  border:
                    activeCategory === cat.value
                      ? "none"
                      : "1.5px solid #FF8C42",
                  "&:hover": {
                    backgroundColor:
                      activeCategory === cat.value ? "#FF6B00" : "#FFE4CC",
                  },
                }}
              />
            ))}
          </Stack>
        </motion.div>
      </div>

      {/* RESULTS */}
      <Container sx={{ marginTop: "2rem", marginBottom: "4rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <CircularProgress color="warning" />
            <Typography sx={{ marginTop: 2 }}>Finding local spots...</Typography>
          </div>
        ) : (
          <>
            <Typography variant="h5" sx={{ marginBottom: 2, fontWeight: 600 }}>
              {activeCategory
                ? `Nearby ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`
                : "Nearby Spots"}
            </Typography>
            <Grid container spacing={3}>
              {places.map((place, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        borderRadius: "18px",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                        transition: "transform 0.2s ease",
                        "&:hover": { transform: "translateY(-5px)" },
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: "bold", color: "#2E2E2E" }}
                        >
                          {place.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#777" }}>
                          📍 {place.formattedAddress || place.type}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            marginTop: "0.8rem",
                            color: "#FF8C42",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <RoomIcon fontSize="small" sx={{ marginRight: "5px" }} />
                          {place.distance
                            ? `${place.distance.toFixed(2)} km away`
                            : ""}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {recommendations.length > 0 && (
              <>
                <Typography
                  variant="h5"
                  sx={{
                    marginTop: "4rem",
                    marginBottom: 2,
                    fontWeight: 600,
                    color: "#FF6B00",
                  }}
                >
                  Recommended for You
                </Typography>
                <Grid container spacing={3}>
                  {recommendations.map((place, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <Card
                          sx={{
                            borderRadius: "18px",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                            transition: "transform 0.2s ease",
                            "&:hover": { transform: "translateY(-5px)" },
                          }}
                        >
                          <CardContent>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: "bold", color: "#2E2E2E" }}
                            >
                              {place.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#777", marginTop: "0.5rem" }}
                            >
                              📍 {place.formattedAddress || place.type}
                            </Typography>
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
    </div>
  );
}

export default App;
