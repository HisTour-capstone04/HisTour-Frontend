import React, { useRef } from "react";
import {
  Animated,
  PanResponder,
  Dimensions,
  View,
  StyleSheet,
} from "react-native";

// 내부 컴포넌트 및 유틸리티 import
import NearbyPanel from "./panels/NearbyPanel";
import DirectionsPanel from "./panels/DirectionsPanel";
import BookmarkPanel from "./panels/BookmarkPanel";
import MyPagePanel from "./panels/MyPagePanel";

// 화면 높이 상수
const SCREEN_HEIGHT = Dimensions.get("window").height;

// 패널 위치 상수
const PANEL_POSITIONS = {
  TOP: SCREEN_HEIGHT * 0.2, // 20%
  MIDDLE: SCREEN_HEIGHT * 0.6, // 60%
  BOTTOM: SCREEN_HEIGHT * 0.82, // 80%
};

/**
 * 슬라이드 패널 컴포넌트
 *
 * 주요 기능:
 * 1. 드래그를 통한 패널 위치 조절 (TOP/MIDDLE/BOTTOM)
 * 2. 현재 선택된 탭에 따라 다른 패널 내용 표시
 * 3. 부드러운 스프링 애니메이션으로 위치 전환
 *
 * 패널 종류:
 * - nearby: 주변 정보 패널
 * - directions: 길찾기 패널
 * - bookmark: 북마크 패널
 * - myPage: 마이페이지 패널
 *
 */
export default function SlidePanel({ currentTab, slideAnim }) {
  const currentSlide = useRef(PANEL_POSITIONS.MIDDLE); // 패널 위치 값
  const dragStartPosition = useRef(PANEL_POSITIONS.MIDDLE); // 드래그 시작 위치 값

  // 패널 애니메이션 값 리스너
  slideAnim.addListener(({ value }) => {
    currentSlide.current = value;
  });

  // 드래그 제스처 핸들러 생성
  const panResponder = useRef(
    PanResponder.create({
      // 드래그 시작 조건 (수직 이동 10px 이상)
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },

      // 드래그 시작 시 현재 위치 저장
      onPanResponderGrant: () => {
        dragStartPosition.current = currentSlide.current;
      },

      // 드래그 중 실시간 위치 업데이트
      onPanResponderMove: (_, gestureState) => {
        const newValue = dragStartPosition.current + gestureState.dy;
        slideAnim.setValue(
          Math.min(
            Math.max(PANEL_POSITIONS.TOP, newValue),
            PANEL_POSITIONS.BOTTOM
          )
        );
      },

      // 드래그 종료 시 스냅 애니메이션
      onPanResponderRelease: (_, gestureState) => {
        const currentPosition = currentSlide.current;

        // 현재 위치가 어느 상태에 가장 가까운지 판단
        let currentState;
        if (
          currentPosition <=
          (PANEL_POSITIONS.TOP + PANEL_POSITIONS.MIDDLE) / 2
        ) {
          currentState = "TOP";
        } else if (
          currentPosition <=
          (PANEL_POSITIONS.MIDDLE + PANEL_POSITIONS.BOTTOM) / 2
        ) {
          currentState = "MIDDLE";
        } else {
          currentState = "BOTTOM";
        }

        let nextPosition;

        // 아래로 드래그 (dy > 50) - 패널을 아래로 이동
        if (gestureState.dy > 50) {
          switch (currentState) {
            case "TOP":
              nextPosition = PANEL_POSITIONS.MIDDLE;
              break;
            case "MIDDLE":
              nextPosition = PANEL_POSITIONS.BOTTOM;
              break;
            case "BOTTOM":
              nextPosition = PANEL_POSITIONS.BOTTOM;
              break;
          }
        }
        // 위로 드래그 (dy < -50) - 패널을 위로 이동
        else if (gestureState.dy < -50) {
          switch (currentState) {
            case "TOP":
              nextPosition = PANEL_POSITIONS.TOP;
              break;
            case "MIDDLE":
              nextPosition = PANEL_POSITIONS.TOP;
              break;
            case "BOTTOM":
              nextPosition = PANEL_POSITIONS.MIDDLE;
              break;
          }
        }
        // 작은 드래그는 가장 가까운 위치로 스냅
        else {
          const positions = [
            PANEL_POSITIONS.TOP,
            PANEL_POSITIONS.MIDDLE,
            PANEL_POSITIONS.BOTTOM,
          ];
          nextPosition = positions.reduce((prev, curr) =>
            Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition)
              ? curr
              : prev
          );
        }

        // 스프링 애니메이션으로 부드럽게 이동
        Animated.spring(slideAnim, {
          toValue: nextPosition,
          useNativeDriver: false,
          damping: 25,
          mass: 0.8,
        }).start();
      },
    })
  ).current;

  // 현재 탭에 따라 적절한 패널 내용을 렌더링
  const renderContent = () => {
    switch (currentTab) {
      case "nearby":
        return <NearbyPanel />;
      case "directions":
        return <DirectionsPanel />;
      case "bookmark":
        return <BookmarkPanel />;
      case "myPage":
        return <MyPagePanel />;
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.slideUpPanel, { top: slideAnim }]}>
      {/* 드래그 가능 영역 */}
      <View style={styles.dragZone} {...panResponder.panHandlers} />

      {/* 드래그 핸들 */}
      <View style={styles.panelHandle} />

      {/* 현재 탭에 따른 패널 내용 */}
      {renderContent()}
    </Animated.View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  slideUpPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50, // 다른 요소들 위에 표시
    height: SCREEN_HEIGHT * 0.8, // 화면 높이의 80%
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,

    // 그림자 효과
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dragZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60, // 드래그 가능 영역 높이
  },
  panelHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 10,
  },
});
