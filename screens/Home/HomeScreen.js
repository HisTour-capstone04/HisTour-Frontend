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

  const [userLocation, setUserLocation] = useState("Loading..."); // 사용자 현재 위치
  const [locationPermission, setLocationPermission] = useState(true); // 위치 권한

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current;
  const handleMenuPress = () => {
    setCurrentTab("nearby");
    Animated.spring(slideAnim, {
      toValue: SCREEN_HEIGHT * 0.2,
      useNativeDriver: false,
    }).start();
  };

  const getLocationPermission = async () => {
    try {
      console.log("위치 권한 요청 시작");
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        console.warn("위치 권한 거부됨");
        setLocationPermission(false);
        return false;
      }
      console.log("권한 결과 허용됨");
      return true;
    } catch (e) {
      console.error("위치 권한 요청 에러:", e);
      setLocationPermission(false);
      return false;
    }
  };

  const getUserLocation = async () => {
    const isGranted = await getLocationPermission();
    if (!isGranted) return;

    try {
      const {
        coords: { latitude, longitude },
      } = await Location.getCurrentPositionAsync({ accuracy: 5 });
      setUserLocation({ latitude, longitude });
      console.log("현재 위치:", latitude, longitude);
    } catch (e) {
      console.error("현재 위치 가져오기 실패:", e);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색창 & 슬라이더 */}
      <SearchBar onMenuPress={handleMenuPress} />
      <RangeSlider range={range} setRange={setRange} />

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <MapWebView userLocation={userLocation} range={range} />
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
