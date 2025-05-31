import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/colors";
import { useUserLocation } from "../contexts/UserLocationContext";
import { useRef } from "react";

export default function RecenterMapButton({ webViewRef }) {
  const { userLocation } = useUserLocation();

  const handleRecenter = () => {
    if (webViewRef?.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "RECENTER_TO_COORD",
          payload: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        })
      );
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleRecenter}>
      <Ionicons name="locate" size={30} color={theme.main_green} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 360, // 챗봇 버튼보다 위
    right: 20,
    backgroundColor: "white",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});
