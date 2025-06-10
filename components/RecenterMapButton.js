import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/colors";
import { useUserLocation } from "../contexts/UserLocationContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const PANEL_TOP = SCREEN_HEIGHT * 0.2; // SlidePanel의 TOP 위치

export default function RecenterMapButton({ webViewRef, slideAnim }) {
  const { userLocation } = useUserLocation();

  // slideAnim 값에 따라 버튼의 bottom 위치를 계산
  const buttonPosition = Animated.subtract(
    420, // 기본 위치
    Animated.subtract(slideAnim, SCREEN_HEIGHT * 0.6) // 슬라이드 패널이 움직인 거리
  );

  // slideAnim 값에 따라 opacity 계산
  const opacity = slideAnim.interpolate({
    inputRange: [PANEL_TOP, PANEL_TOP + 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

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
    <Animated.View
      style={[
        styles.container,
        {
          bottom: buttonPosition,
          opacity,
        },
      ]}
    >
      <TouchableOpacity onPress={handleRecenter} style={styles.button}>
        <Ionicons name="locate" size={25} color={theme.main_blue} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 25,
    zIndex: 20,
  },
  button: {
    backgroundColor: "white",
    width: 50,
    height: 50,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});
