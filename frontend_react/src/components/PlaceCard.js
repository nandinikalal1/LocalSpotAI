import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import RoomIcon from "@mui/icons-material/Room";

export default function PlaceCard({ place }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);

  const sendFeedback = async (action) => {
    try {
      await fetch("http://127.0.0.1:5001/recommend/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_name: place.name,
          action,
          category: place.type,
        }),
      });
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    sendFeedback("save");
  };
  const handleLike = () => {
    setLiked(true);
    setDisliked(false);
    sendFeedback("like");
  };
  const handleDislike = () => {
    setDisliked(true);
    setLiked(false);
    sendFeedback("dislike");
  };

  return (
    <Card
      sx={{
        borderRadius: "16px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease",
        "&:hover": { transform: "translateY(-5px)" },
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {place.name}
        </Typography>
        <Typography variant="body2" sx={{ color: "#777" }}>
          {place.formattedAddress || "No address available"}
        </Typography>
        <Typography
          variant="body2"
          sx={{ marginTop: "0.5rem", color: "#FF8C42" }}
        >
          <RoomIcon fontSize="small" sx={{ marginRight: "5px" }} />
          {place.distance
            ? `${(place.distance * 0.621371).toFixed(2)} miles away`
            : ""}
        </Typography>

        {/* Buttons */}
        <Stack direction="row" spacing={1} sx={{ marginTop: "0.8rem" }}>
          <Tooltip title="Save for Later">
            <IconButton onClick={handleSave} color={saved ? "error" : "default"}>
              <FavoriteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Like">
            <IconButton onClick={handleLike} color={liked ? "success" : "default"}>
              <ThumbUpIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dislike">
            <IconButton
              onClick={handleDislike}
              color={disliked ? "warning" : "default"}
            >
              <ThumbDownIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}
