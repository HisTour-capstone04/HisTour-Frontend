import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/colors";
import { useNavigation } from "@react-navigation/native";

export default function ChatbotButton({ onPress }) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate("Chatbot")}
    >
      <Ionicons name="chatbubble-ellipses" size={30} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 300, // 슬라이드 패널 올라오기 전에 위치 (조정 가능)
    right: 20,
    backgroundColor: theme.main_green,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20, // SlidePanel보다 낮게 설정!
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});
