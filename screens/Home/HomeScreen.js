// HomeScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  Animated,
  Dimensions,
} from "react-native";
import SearchBar from "./SearchBar";
import RangeSlider from "./RangeSlider";
import SlidePanel from "./SlidePanel";
import FooterTabBar from "./FooterTabBar";
import WebView from "react-native-webview";
import ChatbotButton from "../../components/ChatbotButton";
import MapWebView from "../../components/MapWebView";
import * as Location from "expo-location";
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function HomeScreen() {
  const [currentTab, setCurrentTab] = useState("nearby"); // 현재 선택된 탭
  const [range, setRange] = useState(500); // 범위 (슬라이더로 조절)

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current;
  const handleMenuPress = () => {
    setCurrentTab("nearby");
    Animated.spring(slideAnim, {
      toValue: SCREEN_HEIGHT * 0.2,
      useNativeDriver: false,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색창 & 슬라이더 */}
      <SearchBar onMenuPress={handleMenuPress} />
      <RangeSlider range={range} setRange={setRange} />

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <MapWebView range={range} />
      </View>

      {/* 챗봇 버튼 - SlidePanel보다 아래 zIndex로 렌더 */}
      <ChatbotButton
        onPress={() => {
          // ChatScreen으로 이동하거나 상태변경 등!
          console.log("챗봇 버튼 눌림");
        }}
      />

      {/* 슬라이드 패널 */}
      <SlidePanel currentTab={currentTab} slideAnim={slideAnim} />

      {/* 하단 탭바 */}
      <FooterTabBar currentTab={currentTab} onTabPress={setCurrentTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  mapContainer: {
    flex: 1,
    zIndex: 1, // SlidePanel이 위로 올라오게 하기 위해
  },
});
