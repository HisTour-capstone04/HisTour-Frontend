import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme/colors";

export default function ChatbotScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>챗봇</Text>
      </View>

      {/* 나머지 내용 */}
      <View style={styles.body}>
        <Text style={{ color: "#666" }}>
          여기에 챗봇 메시지 리스트 들어갈 예정!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    backgroundColor: theme.main_green,
    paddingTop: 50, // 노치 대응용 (iOS 상단 SafeArea)
    paddingHorizontal: 15,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    paddingRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
