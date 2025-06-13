import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 외부 라이브러리 import
import AsyncStorage from "@react-native-async-storage/async-storage";

// 내부 컴포넌트 및 유틸리티 import
import { theme } from "../theme/colors";

/**
 * 챗봇 설정 화면 컴포넌트
 *
 * 주요 기능 :
 * 1. TTS 자동 재생 설정 (on/off)
 * 2. AsyncStorage를 통한 TTS 자동 재생 설정 저장 및 불러오기
 */
export default function ChatbotConfigScreen() {
  const navigation = useNavigation();
  const [isAutoTTSEnabled, setIsAutoTTSEnabled] = useState(false); // TTS 자동 재생 설정 상태

  // 컴포넌트 마운트 시 설정 불러오기
  useEffect(() => {
    loadSettings();
  }, []);

  // AsyncStorage에서 설정 불러오기 메서드
  const loadSettings = async () => {
    try {
      // 저장된 TTS 자동 재생 설정 불러오기
      const value = await AsyncStorage.getItem("chatbot_auto_tts");
      setIsAutoTTSEnabled(value === "true");
    } catch (error) {
      console.error("설정 불러오기 실패:", error);
    }
  };

  // TTS 자동 재생 설정 토글 메서드
  const toggleAutoTTS = async (value) => {
    try {
      // AsyncStorage에 설정 저장
      await AsyncStorage.setItem("chatbot_auto_tts", value.toString());
      // 상태 업데이트
      setIsAutoTTSEnabled(value);
    } catch (error) {
      console.error("설정 저장 실패:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        {/* 뒤로 가기 버튼 */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.black} />
        </TouchableOpacity>

        {/* 화면 제목 */}
        <Text style={styles.title}>챗봇 설정</Text>

        {/* 헤더 우측 여백 */}
        <View style={styles.headerButton} />
      </View>

      {/* 설정 내용 */}
      <View style={styles.content}>
        {/* TTS 자동 재생 설정 항목 (스위치) */}
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>TTS 자동 재생</Text>
          <Switch
            trackColor={{ false: theme.darkgray, true: theme.main_blue }}
            onValueChange={toggleAutoTTS}
            value={isAutoTTSEnabled}
          />
        </View>
        {/* 설정 설명 */}
        <Text style={styles.settingDescription}>
          챗봇의 모든 응답이 자동으로 음성으로 재생됩니다
        </Text>
      </View>
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bluegray,
  },
  header: {
    backgroundColor: "white",
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.black,
  },
  content: {
    padding: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  settingText: {
    fontSize: 16,
    color: theme.black,
  },
  settingDescription: {
    fontSize: 13,
    color: theme.darkgray,
    marginLeft: 10,
    marginTop: 2,
  },
});
