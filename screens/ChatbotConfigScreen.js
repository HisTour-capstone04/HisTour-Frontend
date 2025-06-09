import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChatbotConfigScreen() {
  const navigation = useNavigation();
  const [isAutoTTSEnabled, setIsAutoTTSEnabled] = React.useState(false);

  // 설정 불러오기
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const value = await AsyncStorage.getItem("chatbot_auto_tts");
      setIsAutoTTSEnabled(value === "true");
    } catch (error) {
      console.error("설정 불러오기 실패:", error);
    }
  };

  // 설정 저장
  const toggleAutoTTS = async (value) => {
    try {
      await AsyncStorage.setItem("chatbot_auto_tts", value.toString());
      setIsAutoTTSEnabled(value);
    } catch (error) {
      console.error("설정 저장 실패:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.black} />
        </TouchableOpacity>

        <Text style={styles.title}>챗봇 설정</Text>

        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>TTS 자동 재생</Text>
          <Switch
            trackColor={{ false: "#767577", true: theme.main_blue }}
            thumbColor={isAutoTTSEnabled ? "#fff" : "#f4f3f4"}
            onValueChange={toggleAutoTTS}
            value={isAutoTTSEnabled}
          />
        </View>
        <Text style={styles.settingDescription}>
          챗봇의 모든 응답이 자동으로 음성으로 재생됩니다
        </Text>
      </View>
    </View>
  );
}

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
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
    marginTop: 2,
  },
});
