// FooterTabBar.js
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 내부 컴포넌트 및 유틸리티 import
import { theme } from "../../theme/colors";

/**
 * 하단 탭 바 컴포넌트
 *
 * 주요 기능:
 * 1. 주변 정보, 길찾기, 북마크, 마이페이지 탭 제공
 * 2. 현재 선택된 탭 하이라이트 표시
 *
 */
export default function FooterTabBar({ currentTab, onTabPress }) {
  // 4가지 탭 (구성: 키, 라벨, 아이콘)
  const tabs = [
    { key: "nearby", label: "주변 정보", icon: "location" },
    { key: "directions", label: "길찾기", icon: "navigate" },
    { key: "bookmark", label: "북마크", icon: "bookmark" },
    { key: "myPage", label: "마이", icon: "person" },
  ];

  return (
    <View style={styles.container}>
      {/* 탭 버튼 렌더링 */}
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onTabPress(tab.key)} // 각 탭 클릭 시 상위 컴포넌트(HomeScreen)에 해당 키값 전달
          style={styles.tabItem}
        >
          {/* 탭 아이콘 */}
          <Ionicons
            name={tab.icon}
            size={24}
            color={currentTab === tab.key ? theme.main_blue : theme.gray}
          />
          {/* 탭 라벨 */}
          <Text
            style={[
              styles.label,
              currentTab === tab.key && { color: theme.main_blue },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    position: "absolute", // 화면 하단에 고정
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99, // 다른 요소들 위에 표시
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around", // 각 탭을 균등하게 배치
    paddingVertical: 15,

    /* iOS 그림자 설정 */
    shadowColor: theme.gray,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,

    /* Android 그림자 설정 */
    elevation: 5,
  },
  tabItem: {
    alignItems: "center", // 아이콘과 텍스트를 세로 중앙 정렬
  },
  label: {
    fontSize: 12,
    color: theme.gray,
    marginTop: 5, // 아이콘과 텍스트 사이 간격
  },
});
