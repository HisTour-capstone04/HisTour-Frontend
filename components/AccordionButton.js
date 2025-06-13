import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 내부 모듈 import
import { theme } from "../theme/colors";

// 화면 높이 계산 상수
const SCREEN_HEIGHT = Dimensions.get("window").height;
const PANEL_TOP = SCREEN_HEIGHT * 0.2; // SlidePanel의 최상단 위치

/**
 * 아코디언 버튼 컴포넌트
 *
 * 주요 기능:
 * 1. 버튼 목록 확장/축소 토글
 * 2. 슬라이드 패널 애니메이션에 따른 버튼 위치 및 투명도 변화
 */
export default function AccordionButton({ slideAnim, isExpanded, onToggle }) {
  // slideAnim 값에 따라 버튼의 bottom 위치를 계산 - 슬라이드 패널이 위로 올라가면 버튼도 함께 위로 이동
  const buttonPosition = Animated.subtract(
    360, // 기본 위치 (화면 하단에서 360px 위)
    Animated.subtract(slideAnim, SCREEN_HEIGHT * 0.6) // 슬라이드 패널이 움직인 거리
  );

  // slideAnim 값에 따라 opacity 계산 - 패널이 PANEL_TOP에 도달하면 버튼 안 보이도록 자연스럽게 투명도 변화
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
          // 확장 상태일 때 파란색 배경으로 변경
          isExpanded && { backgroundColor: theme.main_blue },
        ]}
        onPress={onToggle}
      >
        <Ionicons
          // 확장 상태에 따라 아이콘 방향 변경
          name={isExpanded ? "chevron-down" : "chevron-up"}
          size={25}
          // 확장 상태에 따라 아이콘 색상 변경
          color={isExpanded ? "white" : theme.main_blue}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// 스타일 정의
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
