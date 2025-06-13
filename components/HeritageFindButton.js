import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";
import { useHeritages } from "../contexts/HeritageContext";
import { IP_ADDRESS } from "../config/apiKeys";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const PANEL_TOP = SCREEN_HEIGHT * 0.2; // SlidePanel의 TOP 위치

/**
 * 지도 상의 유적지 찾기 버튼 컴포넌트
 * 주요 기능: 현재 지도 상에 있는 유적지를 조회하여 지도에 마커로 표시
 * -> 지도 중심과 경계로 반경을 계산하여 반경 내 있는 유적지를 조회
 */
export default function HeritageFindButton({
  slideAnim,
  webViewRef,
  center,
  bounds,
}) {
  const { accessToken } = useAuth();
  const { getDistance } = useHeritages();

  // slideAnim 값에 따라 버튼의 bottom 위치를 계산 - 슬라이드 패널이 위로 올라가면 버튼도 함께 위로 이동
  const buttonPosition = Animated.subtract(
    480, // 기본 위치 (화면 하단에서 480px 위)
    Animated.subtract(slideAnim, SCREEN_HEIGHT * 0.6) // 슬라이드 패널이 움직인 거리
  );

  // slideAnim 값에 따라 opacity 계산 - 패널이 PANEL_TOP에 도달하면 버튼 안 보이도록 자연스럽게 투명도 변화
  const opacity = slideAnim.interpolate({
    inputRange: [PANEL_TOP, PANEL_TOP + 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // 지도 중심, 경계 기준으로 유적지 검색
  const fetchHeritagesFromMapCenter = async (center, bounds) => {
    try {
      // 토큰 체크
      if (!accessToken) {
        console.warn("토큰 없음 → 요청 중단");
        return;
      }

      // 지도 중심과 경계 사이의 거리 계산 (반경)
      const radius = getDistance(
        { latitude: center._lat, longitude: center._lng },
        {
          latitude: bounds._ne._lat,
          longitude: bounds._ne._lng,
        }
      );

      // API 호출
      const response = await fetch(
        `http://${IP_ADDRESS}:8080/api/heritages/nearby?latitude=${
          center._lat
        }&longitude=${center._lng}&radius=${Math.round(radius)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("유적지 검색 실패");
      }

      const data = await response.json();

      console.log("data", data);

      // 검색된 유적지들을 지도에 표시하도록 메시지 전송
      if (webViewRef?.current) {
        console.log("SHOW_BUTTON_HERITAGES");
        webViewRef.current.postMessage(
          JSON.stringify({
            type: "SHOW_BUTTON_HERITAGES",
            payload: data.data.heritages,
          })
        );
      }
    } catch (error) {
      console.error("유적지 검색 중 오류 발생:", error);
    }
  };

  // 버튼 클릭 시 지도 중심과 경계 정보 요청
  const handlePress = () => {
    if (webViewRef?.current) {
      console.log("handlePress");
      // 지도의 중심과 경계 정보를 요청
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "GET_MAP_CENTER_AND_BOUNDS",
        })
      );

      fetchHeritagesFromMapCenter(center, bounds);
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
      <TouchableOpacity onPress={handlePress} style={styles.button}>
        <Ionicons name="location" size={25} color={theme.main_blue} />
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
