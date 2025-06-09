// SlidePanel.js
import React, { useRef } from "react";
import {
  Animated,
  PanResponder,
  Dimensions,
  View,
  StyleSheet,
} from "react-native";

import NearbyPanel from "./panels/NearbyPanel";
import DirectionsPanel from "./panels/DirectionsPanel";
import BookmarkPanel from "./panels/BookmarkPanel";
import MyPagePanel from "./panels/MyPagePanel";

const SCREEN_HEIGHT = Dimensions.get("window").height;
// 패널 위치 상수
const PANEL_POSITIONS = {
  TOP: SCREEN_HEIGHT * 0.2, // 20%
  MIDDLE: SCREEN_HEIGHT * 0.6, // 60%
  BOTTOM: SCREEN_HEIGHT * 0.82, // 80%
};

export default function SlidePanel({ currentTab, slideAnim }) {
  const currentSlide = useRef(PANEL_POSITIONS.MIDDLE); // 초기 위치는 중간
  const dragStartPosition = useRef(PANEL_POSITIONS.MIDDLE);

  slideAnim.addListener(({ value }) => {
    currentSlide.current = value;
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        // 드래그 시작할 때 현재 위치 저장
        dragStartPosition.current = currentSlide.current;
      },
      onPanResponderMove: (_, gestureState) => {
        // 드래그 중에는 자유롭게 움직이되, 범위 제한
        const newValue = dragStartPosition.current + gestureState.dy;
        slideAnim.setValue(
          Math.min(
            Math.max(PANEL_POSITIONS.TOP, newValue),
            PANEL_POSITIONS.BOTTOM
          )
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentPosition = currentSlide.current;

        // 현재 어느 위치에 가장 가까운지 판단
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

        // 아래로 드래그 (dy > 50)
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
        // 위로 드래그 (dy < -50)
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

        Animated.spring(slideAnim, {
          toValue: nextPosition,
          useNativeDriver: false,
          damping: 25,
          mass: 0.8,
        }).start();
      },
    })
  ).current;

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

      {/* 핸들 */}
      <View style={styles.panelHandle} />

      {renderContent()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slideUpPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
    height: SCREEN_HEIGHT * 0.8,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,

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
    height: 60,
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
