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
import {
  useNavigation,
  useRoute as useNavRoute,
} from "@react-navigation/native";
import HeritageDetailPanel from "./HeritageDetailPanel";
import { useRoute } from "../../contexts/RouteContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function HomeScreen() {
  const [currentTab, setCurrentTab] = useState("nearby"); // 현재 선택된 탭
  const [range, setRange] = useState(500); // 범위 (슬라이더로 조절)
  const [selectedHeritage, setSelectedHeritage] = useState(null); // 검색 결과로 선택된 유적지
  const { destination } = useRoute();
  const navRoute = useNavRoute();

  useEffect(() => {
    if (destination) {
      setCurrentTab("directions"); // 목적지가 설정되면 DirectionsPanel로 전환
    }
  }, [destination]);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current;
  const heritageDetailAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (selectedHeritage) {
      Animated.timing(heritageDetailAnim, {
        toValue: SCREEN_HEIGHT * 0.45,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [selectedHeritage]);

  const handleClosePanel = () => {
    Animated.timing(heritageDetailAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setSelectedHeritage(null);
    });
  };

  useEffect(() => {
    const heritageFromSearch = navRoute.params?.heritage;
    if (heritageFromSearch) {
      setSelectedHeritage(heritageFromSearch);
      navRoute.params.heritage = null; // 초기화 (무한루프 방지)
    }
  }, [navRoute.params]);

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

          {selectedHeritage && (
            <Animated.View
              style={[styles.overlayPanel, { top: heritageDetailAnim }]}
            >
              <View style={{ flex: 1 }}>
                <HeritageDetailPanel
                  heritage={selectedHeritage}
                  onClose={handleClosePanel}
                />
              </View>
            </Animated.View>
          )}

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
  overlayPanel: {
    position: "absolute",
    height: SCREEN_HEIGHT * 0.6,
    top: SCREEN_HEIGHT * 0.45,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    zIndex: 999,
  },
});
