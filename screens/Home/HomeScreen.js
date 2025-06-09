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

import RecenterMapButton from "../../components/RecenterMapButton";
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
import { useRouteMode } from "../../contexts/RouteModeContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;

// 패널 위치 상수 추가
const PANEL_POSITIONS = {
  TOP: SCREEN_HEIGHT * 0.2, // 20%
  MIDDLE: SCREEN_HEIGHT * 0.6, // 60%
  BOTTOM: SCREEN_HEIGHT * 0.82, // 82%
};

export default function HomeScreen() {
  const [currentTab, setCurrentTab] = useState("nearby"); // 현재 선택된 탭
  const [range, setRange] = useState(500); // 범위 (슬라이더로 조절)
  const [selectedHeritage, setSelectedHeritage] = useState(null); // 검색 결과로 선택된 유적지
  const { startPoint, destination, routeData } = useRoute();
  const { routeMode } = useRouteMode();
  const navRoute = useNavRoute();
  const webViewRef = useRef(null);

  // 길찾기 모드 여부 확인 (routeData가 있으면 길찾기 중)
  const isRouting = !!routeData;

  // 출발지 또는 목적지가 설정되면 DirectionsPanel로 전환
  useEffect(() => {
    if (startPoint || destination) {
      setCurrentTab("directions");
    }
  }, [startPoint, destination]);

  // 길찾기 모드에 따라 지도 요소들 토글
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "TOGGLE_MAP_ELEMENTS",
          payload: {
            show: !isRouting,
          },
        })
      );
    }
  }, [isRouting]);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current;
  const heritageDetailAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (selectedHeritage) {
      // 시작 위치를 항상 화면 아래로 초기화
      heritageDetailAnim.setValue(SCREEN_HEIGHT);

      Animated.spring(heritageDetailAnim, {
        toValue: PANEL_POSITIONS.MIDDLE,
        useNativeDriver: false,
        damping: 20,
        mass: 0.8,
        velocity: 2,
      }).start();
    }
  }, [selectedHeritage]);

  const handleClosePanel = () => {
    setSelectedHeritage(null);
  };

  useEffect(() => {
    const heritageFromSearch = navRoute.params?.heritage;
    const heritagesFromNotification = navRoute.params?.heritages;
    const isFromNotification = navRoute.params?.isFromNotification;

    if (heritageFromSearch) {
      setSelectedHeritage(heritageFromSearch);
      navRoute.params.heritage = null; // 초기화 (무한루프 방지)
    } else if (heritagesFromNotification && isFromNotification) {
      // 알림에서 온 경우 여러 유적지를 포함하는 객체로 설정
      setSelectedHeritage({
        heritages: heritagesFromNotification,
        isFromNotification: true,
      });
      // 파라미터 초기화
      navRoute.params.heritages = null;
      navRoute.params.isFromNotification = null;
    }
  }, [navRoute.params]);

  // RN -> WebView 메시지 핸들러 (마커 클릭 시 heritageDetailPanel 열림)
  const handleWebViewMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === "HERITAGE_MARKER_CLICKED") {
      setSelectedHeritage(data.payload);
    }
  };

  // 알림 핸들러 설정
  useEffect(() => {
    global.notificationHandler = (heritages) => {
      setSelectedHeritage({
        heritages: heritages,
        isFromNotification: true,
      });
    };

    return () => {
      global.notificationHandler = null;
    };
  }, []);

  return (
    <HeritageProvider range={range}>
      <SafeAreaView style={styles.container}>
        {/* 지도 영역 */}
        <MapWebView
          ref={webViewRef}
          range={range}
          style={StyleSheet.absoluteFill}
          onMessage={handleWebViewMessage}
        />

        <View style={StyleSheet.absoluteFill}>
          {/* 상단 영역 */}
          <View style={styles.topUI}>
            {/* 검색창 */}
            <SearchBar />

            {/* 슬라이더 - 길찾기 모드가 아닐 때만 표시 */}
            {!isRouting && <RangeSlider range={range} setRange={setRange} />}
          </View>

          {/* 하단 영역 */}
          {/* 지도 중심 설정 & 챗봇 버튼 - SlidePanel보다 아래 zIndex로 렌더 */}
          {!selectedHeritage && (
            <>
              <RecenterMapButton
                webViewRef={webViewRef}
                slideAnim={slideAnim}
              />
              <ChatbotButton slideAnim={slideAnim} />

              {/* 슬라이드 패널 */}
              <SlidePanel currentTab={currentTab} slideAnim={slideAnim} />
            </>
          )}

          {selectedHeritage && (
            <Animated.View
              style={[styles.overlayPanel, { top: heritageDetailAnim }]}
            >
              <HeritageDetailPanel
                heritage={selectedHeritage}
                onClose={handleClosePanel}
                webViewRef={webViewRef}
                isFromMarkerClick={selectedHeritage.isFromMarkerClick}
                panelAnim={heritageDetailAnim}
              />
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
    height: SCREEN_HEIGHT * 0.8,
    top: SCREEN_HEIGHT * 0.6,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    zIndex: 999,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});
