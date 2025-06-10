import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/colors";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const PANEL_TOP = SCREEN_HEIGHT * 0.2; // SlidePanel의 TOP 위치

export default function AccordionButton({ slideAnim, isExpanded, onToggle }) {
  // slideAnim 값에 따라 버튼의 bottom 위치를 계산
  const buttonPosition = Animated.subtract(
    360, // 기본 위치
    Animated.subtract(slideAnim, SCREEN_HEIGHT * 0.6) // 슬라이드 패널이 움직인 거리
  );

  // slideAnim 값에 따라 opacity 계산
  const opacity = slideAnim.interpolate({
    inputRange: [PANEL_TOP, PANEL_TOP + 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

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
      <TouchableOpacity
        style={[
          styles.button,
          isExpanded && { backgroundColor: theme.main_blue },
        ]}
        onPress={onToggle}
      >
        <Ionicons
          name={isExpanded ? "chevron-down" : "chevron-up"}
          size={25}
          color={isExpanded ? "white" : theme.main_blue}
        />
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
