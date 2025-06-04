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
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { theme } from "../theme/colors";
import { useUserLocation } from "../contexts/UserLocationContext";
import { AuthContext } from "../contexts/AuthContext";
import { ActivityIndicator } from "react-native";
import { IP_ADDRESS } from "../config/apiKeys";
import { useVia } from "../contexts/ViaContext";
import { useRoute as useRouteContext } from "../contexts/RouteContext";
import Toast from "react-native-toast-message";

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userLocation } = useUserLocation();
  const { accessToken } = useContext(AuthContext);
  const { addStopover } = useVia();
  const { setDestination } = useRouteContext();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingText, setCurrentPlayingText] = useState(null);

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

  // 유적지 검색 및 처리 함수
  const findHeritage = async (title) => {
    try {
      const response = await fetch(
        "http://" +
          IP_ADDRESS +
          `:8080/api/heritages?name=${encodeURIComponent(title)}`
      );
      const result = await response.json();
      if (result.data?.heritages?.length > 0) {
        return result.data.heritages[0]; // 첫 번째 검색 결과 반환
      }
      return null;
    } catch (error) {
      console.error("유적지 검색 실패:", error);
      return null;
    }
  };

  const handleHistoricalBackground = (title) => {
    sendMessage(`${title}의 역사적 배경에 대해 알려줘`);
  };

  const handleSetDestination = async (title) => {
    const heritage = await findHeritage(title);
    if (heritage) {
      setDestination(heritage); // 목적지로 설정
      navigation.navigate("Home", { screen: "길찾기" }); // 길찾기 화면으로 전환
      Toast.show({
        type: "success",
        text1: "목적지로 설정되었습니다",
        position: "bottom",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "유적지를 찾을 수 없습니다",
        position: "bottom",
      });
    }
  };

  const sendMessage = async (text, skipFetch = false) => {
    if (!text || !userLocation) return;

    const userMessage = { text, from: "user" };
    setMessages((prev) => [...prev, userMessage]);

    setInputText("");

    if (skipFetch) return; // API 호출 스킵이 true면 여기서 종료

    setIsLoading(true);
    setMessages((prev) => [...prev, { from: "bot", loading: true }]);
    setPlaceholder(getRandomPlaceholder());

    if (!accessToken) {
      console.warn("context: 토큰 없음 → 요청 중단");
      const botMessage = {
        text: "로그인 후 이용 가능합니다.",
        from: "bot",
      };
      setMessages((prev) => [...prev.slice(0, -1), botMessage]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://" + IP_ADDRESS + ":8080/api/chatbot", {
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
        title: result?.data?.title || "",
      };
      setMessages((prev) => [...prev.slice(0, -1), botMessage]);
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

  const handleAddVia = async (title) => {
    // 사용자 메시지 추가 (API 호출 스킵)
    sendMessage(`${title}를 경유지로 추가해줘`, true);

    // 유적지 검색 및 경유지 추가
    const heritage = await findHeritage(title);
    if (heritage) {
      const added = await addStopover(heritage);
      // 챗봇 응답 메시지 직접 추가
      setMessages((prev) => [
        ...prev,
        {
          text: added
            ? `${title}가 경유지에 추가되었습니다!`
            : `${title}는 이미 경유지 목록에 있습니다.`,
          from: "bot",
        },
      ]);
    } else {
      // 챗봇 응답 메시지 직접 추가
      setMessages((prev) => [
        ...prev,
        {
          text: "해당 유적지를 찾을 수 없습니다.",
          from: "bot",
        },
      ]);
    }
  };

  useEffect(() => {
    if (route.params?.initialMessage) {
      sendMessage(route.params.initialMessage);
    }
  }, [route.params]);

  // 오디오 설정
  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("오디오 설정 실패:", error);
    }
  };

  // TTS 재생
  const playTTS = async (text) => {
    console.log("playTTS 호출");
    try {
      // 이미 재생 중인 경우 중지
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);

        // 같은 텍스트를 다시 클릭한 경우 재생 중지로 처리
        if (currentPlayingText === text) {
          setCurrentPlayingText(null);
          return;
        }
      }

      setCurrentPlayingText(text);

      // 오디오 설정
      await setupAudio();

      // API 요청
      const response = await fetch(
        "http://" +
          IP_ADDRESS +
          `:8080/api/convert-to-speech?text=${encodeURIComponent(text)}`
      );

      if (!response.ok) {
        throw new Error("TTS 변환에 실패했습니다");
      }

      // 바이트 배열을 ArrayBuffer로 변환
      const arrayBuffer = await response.arrayBuffer();

      // ArrayBuffer를 Base64로 변환
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      // 임시 파일로 저장
      const fileUri = FileSystem.documentDirectory + "temp_audio.mp3";
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 오디오 로드 및 재생
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      // 재생 완료 시 콜백
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentPlayingText(null);
        }
      });
    } catch (error) {
      console.error("TTS 요청 실패:", error);
      Toast.show({
        type: "error",
        text1: "TTS 변환에 실패했습니다",
        position: "bottom",
      });
      setCurrentPlayingText(null);
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const renderMessage = ({ item }) => {
    if (item.from === "bot" && item.loading) {
      return (
        <View style={[styles.message, styles.bot]}>
          <ActivityIndicator size="small" color="#555" />
        </View>
      );
    }

    return (
      <View>
        {item.from === "bot" ? (
          <View style={styles.botMessageContainer}>
            <View style={[styles.message, styles.bot]}>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.ttsButton,
                currentPlayingText === item.text && styles.ttsButtonPlaying,
              ]}
              onPress={() => playTTS(item.text)}
            >
              <Ionicons
                name={
                  currentPlayingText === item.text ? "stop" : "volume-medium"
                }
                size={16}
                color={theme.main_green}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.message, styles.user]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        {/* 챗봇 응답에 title이 있을 경우에만 액션 버튼 표시 */}
        {item.from === "bot" && item.title && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleHistoricalBackground(item.title)}
            >
              <Text style={styles.actionButtonText}>역사적 배경</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDestination(item.title)}
            >
              <Text style={styles.actionButtonText}>목적지로 설정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAddVia(item.title)}
            >
              <Text style={styles.actionButtonText}>경유지에 추가</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>챗봇</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.chatArea}
      />

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
    marginBottom: 16,
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingLeft: 12,
    gap: 8,
    marginTop: -20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: theme.main_green,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  botMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ttsButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  ttsButtonPlaying: {
    backgroundColor: "#e8f5e9",
  },
});
