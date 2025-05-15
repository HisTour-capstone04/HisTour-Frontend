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

export default function SlidePanel({ currentTab, slideAnim }) {
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        slideAnim.setValue(
          Math.max(SCREEN_HEIGHT * 0.2, slideAnim._value + gestureState.dy)
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50) {
          Animated.spring(slideAnim, {
            toValue: SCREEN_HEIGHT * 0.2,
            useNativeDriver: false,
            damping: 25,
            mass: 0.8,
          }).start();
        } else {
          Animated.spring(slideAnim, {
            toValue: SCREEN_HEIGHT * 0.2,
            useNativeDriver: false,
            damping: 25,
            mass: 0.8,
          }).start();
        }
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
    zIndex: 50, // 중간
    height: SCREEN_HEIGHT * 0.8,
    backgroundColor: "#fff",
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
    height: 60, // 터치 영역만 넉넉히 확보
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
