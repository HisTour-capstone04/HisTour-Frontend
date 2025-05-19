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

import ChatbotButton from "../../components/ChatbotButton";
import MapWebView from "../../components/MapWebView";

import { HeritageProvider } from "../../contexts/HeritageContext";
import Constants from "expo-constants";

import { useRoute } from "../../contexts/RouteContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function HomeScreen() {
  const [currentTab, setCurrentTab] = useState("nearby"); // 현재 선택된 탭
  const [range, setRange] = useState(500); // 범위 (슬라이더로 조절)

  const { destination } = useRoute();

  useEffect(() => {
    if (destination) {
      setCurrentTab("directions"); // 목적지가 설정되면 DirectionsPanel로 전환
    }
  }, [destination]);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current;

  return (
    <HeritageProvider range={range}>
      <SafeAreaView style={styles.container}>
        {/* 지도 영역 */}
        <MapWebView range={range} style={StyleSheet.absoluteFill} />

        <View style={StyleSheet.absoluteFill}>
          {/* 상단 영역 */}
          <View style={styles.topUI}>
            {/* 검색창 */}
            <SearchBar />

            {/* 슬라이더 */}
            <RangeSlider range={range} setRange={setRange} />
          </View>

          {/* 하단 영역 */}
          {/* 챗봇 버튼 - SlidePanel보다 아래 zIndex로 렌더 */}
          <ChatbotButton onPress={() => console.log("챗봇 버튼 눌림")} />

          {/* 슬라이드 패널 */}
          <SlidePanel currentTab={currentTab} slideAnim={slideAnim} />

          {/* 하단 탭바 */}
          <FooterTabBar currentTab={currentTab} onTabPress={setCurrentTab} />
        </View>
      </SafeAreaView>
    </HeritageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  topUI: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingTop: Constants.statusBarHeight + 5,
    zIndex: 10, // SlidePanel보다 위
  },
});
