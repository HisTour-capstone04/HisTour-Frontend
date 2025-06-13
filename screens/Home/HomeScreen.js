import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { useRoute as useNavRoute } from "@react-navigation/native";

// 외부 라이브러리 import
import Constants from "expo-constants";

// 내부 컴포넌트 및 유틸리티 import
import SearchBar from "./SearchBar";
import RangeSlider from "./RangeSlider";
import SlidePanel from "./SlidePanel";
import FooterTabBar from "./FooterTabBar";
import HeritageDetailPanel from "./HeritageDetailPanel";
import RecenterMapButton from "../../components/RecenterMapButton";
import ChatbotButton from "../../components/ChatbotButton";
import HeritageFindButton from "../../components/HeritageFindButton";
import AccordionButton from "../../components/AccordionButton";
import MapWebView from "../../components/MapWebView";
import { HeritageProvider } from "../../contexts/HeritageContext";
import { useRoute } from "../../contexts/RouteContext";

// 화면 높이 상수
const SCREEN_HEIGHT = Dimensions.get("window").height;

// 패널 위치 상수
const PANEL_POSITIONS = {
  TOP: SCREEN_HEIGHT * 0.2, // 20%
  MIDDLE: SCREEN_HEIGHT * 0.6, // 60%
  BOTTOM: SCREEN_HEIGHT * 0.82, // 82%
};

/**
 * 홈 화면 메인 컴포넌트
 *
 * 화면 구성:
 * - 상단: 검색창, 슬라이더
 * - 중앙: 지도 (WebView)
 * - 하단: 탭바, 슬라이드 패널
 * - 우측: 플로팅 버튼들 - 아코디언 버튼으로 묶음 (챗봇, 지도 중심 설정, 현재 지도 상 유적지 찾기 버튼)
 */
export default function HomeScreen() {
  const navRoute = useNavRoute();
  const webViewRef = useRef(null);
  const { startPoint, destination, routeData } = useRoute();

  const [currentTab, setCurrentTab] = useState("nearby"); // 현재 선택된 탭 (기본값: 주변 정보 탭)
  const [range, setRange] = useState(500); // 범위 (기본값: 500m)
  const [selectedHeritage, setSelectedHeritage] = useState(null); // 선택된 유적지 (검색 결과, 유적지 마커 클릭, 푸시 알림 등에서 전달받은 유적지)
  const [mapCenter, setMapCenter] = useState(null); // 현재 지도 중심 좌표
  const [mapBounds, setMapBounds] = useState(null); // 현재 지도 경계 좌표
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false); // 아코디언 상태 추가

  // 길찾기 모드 여부 확인 (routeData가 있으면 길찾기 중)
  const isRouting = !!routeData;

  // 출발지 또는 목적지가 설정되면 즉시 길찾기 탭으로 전환 (길찾기 모드 시작)
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

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current; // 슬라이드 패널 애니메이션
  const heritageDetailAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current; // 유적지 상세 패널 애니메이션

  // 유적지가 선택(검색 결과, 유적지 마커 클릭, 푸시 알림 총 3가지 경우에서 전달됨)되면 heritageDetailPanel이 부드럽게 올라오도록 애니메이션 적용
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

  // heritageDetailPanel 닫기 핸들러 메서드
  const handleClosePanel = () => {
    setSelectedHeritage(null); // 선택된 유적지 초기화 ==> heritageDetailPanel 닫힘
  };

  // 네비게이션 파라미터를 통한 유적지 정보 처리 (검색 결과, 푸시 알림에서 전달받은 유적지 정보 처리)
  useEffect(() => {
    const heritageFromSearch = navRoute.params?.heritage; // 검색에서 온 유적지
    const heritagesFromNotification = navRoute.params?.heritages; // 알림에서 온 유적지(들)
    const isFromNotification = navRoute.params?.isFromNotification; // 알림 여부

    // 검색 결과에서 유적지 선택한 경우
    if (heritageFromSearch) {
      setSelectedHeritage(heritageFromSearch);
      navRoute.params.heritage = null; // 초기화 (무한루프 방지)
    }
    // 푸시 알림에서 온 경우 여러 유적지를 포함하는 객체로 설정
    else if (heritagesFromNotification && isFromNotification) {
      setSelectedHeritage({
        heritages: heritagesFromNotification,
        isFromNotification: true,
      });
      // 파라미터 초기화
      navRoute.params.heritages = null;
      navRoute.params.isFromNotification = null;
    }
  }, [navRoute.params]);

  // RN -> WebView 메시지 핸들러 메서드 (유적지 마커 클릭 시 heritageDetailPanel 열림)
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // 지도 중심 및 경계 정보 업데이트
      if (data.type === "MAP_CENTER_AND_BOUNDS") {
        const { center, bounds } = data.payload;
        setMapCenter(center);
        setMapBounds(bounds);
      }

      // 유적지 마커 클릭 시 heritageDetailPanel 열기
      if (data.type === "HERITAGE_MARKER_CLICKED") {
        setSelectedHeritage(data.payload);
      }
    } catch (error) {
      console.error("메시지 처리 중 에러:", error);
    }
  };

  // 푸시 알림 핸들러 설정
  useEffect(() => {
    // 푸시 알림에서 온 유적지(들)을 선택된 유적지로 설정
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
      <View style={styles.container}>
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
          {/* 아코디언 버튼 - SlidePanel보다 아래 zIndex로 렌더링 */}
          {!selectedHeritage && (
            <>
              {isAccordionExpanded && (
                <>
                  <RecenterMapButton
                    webViewRef={webViewRef}
                    slideAnim={slideAnim}
                  />
                  <HeritageFindButton
                    webViewRef={webViewRef}
                    slideAnim={slideAnim}
                    center={mapCenter}
                    bounds={mapBounds}
                  />
                </>
              )}
              <ChatbotButton slideAnim={slideAnim} />
              <AccordionButton
                slideAnim={slideAnim}
                isExpanded={isAccordionExpanded}
                onToggle={() => setIsAccordionExpanded(!isAccordionExpanded)}
              />

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
      </View>
    </HeritageProvider>
  );
}

// 스타일 정의
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
