import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { theme } from "../theme/colors";
import { useUserLocation } from "../contexts/UserLocationContext";
import { AuthContext } from "../contexts/AuthContext";
import { ActivityIndicator } from "react-native";

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userLocation } = useUserLocation();
  const { accessToken } = useContext(AuthContext);

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const placeholderOptions = [
    "경복궁에 대해 알려줘",
    "수원 화성의 역사적 배경에 대해 알려줘",
    "조선왕조실록에 대해 설명해줘",
    "남한산성에 대해 설명해줘",
  ];

  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * placeholderOptions.length);
    return placeholderOptions[randomIndex];
  };

  const [placeholder, setPlaceholder] = useState(getRandomPlaceholder());

  const sendMessage = async (text) => {
    if (!text || !userLocation) return;

    const userMessage = { text, from: "user" };
    setMessages((prev) => [...prev, userMessage]);

    setInputText("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { from: "bot", loading: true }]);
    setPlaceholder(getRandomPlaceholder());

    // 토큰 없으면 요청 중단
    if (!accessToken) {
      console.warn("context: 토큰 없음 → 요청 중단");
      const botMessage = {
        text: "로그인 후 이용 가능합니다.",
        from: "bot",
      };
      setMessages((prev) => [
        ...prev.slice(0, -1), // 로딩 메시지 제거
        botMessage,
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://192.168.0.15:8080/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: "0",
          question: text,
        }),
      });

      const result = await res.json();
      console.log(result);
      const botMessage = {
        text: result?.data?.answer || "알 수 없는 응답입니다.",
        from: "bot",
      };
      setMessages((prev) => [
        ...prev.slice(0, -1), // 로딩 메시지 제거
        botMessage,
      ]);
    } catch (e) {
      console.error("챗봇 요청 실패:", e);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { text: "오류가 발생했습니다.", from: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 유적지에서 질문 문구 받아오는 경우
  useEffect(() => {
    if (route.params?.initialMessage) {
      sendMessage(route.params.initialMessage);
    }
  }, [route.params]);

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

      {/* 채팅창 */}
      <FlatList
        data={messages}
        renderItem={({ item }) => {
          if (item.from === "bot" && item.loading) {
            return (
              <View style={[styles.message, styles.bot]}>
                <ActivityIndicator size="small" color="#555" />
              </View>
            );
          }

          return (
            <View
              style={[
                styles.message,
                item.from === "bot" ? styles.bot : styles.user,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          );
        }}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.chatArea}
      />
      {/* 입력창 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputRow}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            style={styles.input}
            placeholder={"예: " + placeholder}
          />
          <TouchableOpacity onPress={() => sendMessage(inputText)}>
            <Ionicons name="send" size={24} color={theme.main_green} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: {
    backgroundColor: theme.main_green,
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { paddingRight: 10 },
  title: { fontSize: 18, fontWeight: "bold", color: "white" },
  chatArea: { padding: 10 },
  message: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: "80%",
    position: "relative",
  },
  bot: {
    alignSelf: "flex-start",
    backgroundColor: theme.sub_green,
    borderTopLeftRadius: 0,
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#eee",
    borderTopRightRadius: 0,
  },
  messageText: { color: "#333" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
    padding: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    marginRight: 10,
  },
});
