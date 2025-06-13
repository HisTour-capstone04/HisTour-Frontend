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
import { useUserLocation } from "../contexts/UserLocationContext";

// 화면 높이 계산 상수
const SCREEN_HEIGHT = Dimensions.get("window").height;
const PANEL_TOP = SCREEN_HEIGHT * 0.2; // SlidePanel의 최상단 위치

/**
 * 지도 재중심 버튼 컴포넌트
 * 주요 기능: 지도 중심을 사용자 현재 위치로 이동
 */
export default function RecenterMapButton({ webViewRef, slideAnim }) {
  const { userLocation } = useUserLocation();

  // slideAnim 값에 따라 버튼의 bottom 위치를 계산 - 슬라이드 패널이 위로 올라가면 버튼도 함께 위로 이동
  const buttonPosition = Animated.subtract(
    420, // 기본 위치 (화면 하단에서 420px 위)
    Animated.subtract(slideAnim, SCREEN_HEIGHT * 0.6) // 슬라이드 패널이 움직인 거리
  );

  // slideAnim 값에 따라 opacity 계산 - 패널이 PANEL_TOP에 도달하면 버튼 안 보이도록 자연스럽게 투명도 변화
  const opacity = slideAnim.interpolate({
    inputRange: [PANEL_TOP, PANEL_TOP + 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // 사용자 현재 위치로 지도 중심 이동
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
