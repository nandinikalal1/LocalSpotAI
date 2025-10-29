import React from "react";
import { motion } from "framer-motion";
import {
  LocalCafe,
  FitnessCenter,
  Park,
  ShoppingCart,
  Storefront,
  Spa,
  DirectionsWalk,
} from "@mui/icons-material";

const icons = [
  { component: LocalCafe, color: "#FFD180", top: "12%", left: "10%", delay: 0 },
  { component: FitnessCenter, color: "#FFAB91", top: "20%", left: "75%", delay: 1 },
  { component: Park, color: "#A5D6A7", top: "35%", left: "30%", delay: 2 },
  { component: ShoppingCart, color: "#90CAF9", top: "50%", left: "85%", delay: 3 },
  { component: Storefront, color: "#F48FB1", top: "65%", left: "15%", delay: 4 },
  { component: Spa, color: "#CE93D8", top: "75%", left: "60%", delay: 5 },
  { component: DirectionsWalk, color: "#FFE082", top: "85%", left: "40%", delay: 6 },
];

const AnimatedIcons = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {icons.map((icon, index) => {
        const Icon = icon.component;
        return (
          <motion.div
            key={index}
            initial={{ y: 0, opacity: 0.7 }}
            animate={{ y: [0, -15, 0], opacity: [0.7, 1, 0.7] }}
            transition={{
              repeat: Infinity,
              duration: 6 + index,
              delay: icon.delay,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: icon.top,
              left: icon.left,
              color: icon.color,
              zIndex: 1,
            }}
          >
            <Icon style={{ fontSize: 40 }} />
          </motion.div>
        );
      })}
    </div>
  );
};

export default AnimatedIcons;
