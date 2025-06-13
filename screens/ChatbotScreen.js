import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";

// Expo 관련 import
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

// 외부 라이브러리 import
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 내부 컴포넌트 및 유틸리티 import
import { theme } from "../theme/colors";
import { useUserLocation } from "../contexts/UserLocationContext";
import { AuthContext } from "../contexts/AuthContext";
import { useVia } from "../contexts/ViaContext";
import { useRoute as useRouteContext } from "../contexts/RouteContext";

// 서버 주소 상수
import { IP_ADDRESS } from "../config/apiKeys";

/**
 * 챗봇 화면 컴포넌트
 *
 * 주요 기능 :
 * 1. AI 챗봇과의 대화 기능
 * 2. 챗봇 응답 TTS 음성 재생
 * 3. 유적지 관련 답변을 위한 꼬리 질문 버튼 (역사적 배경, 목적지 설정, 장바구니 추가) 제공
 * 4. 챗봇 설정 화면 연결
 */
export default function ChatbotScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userLocation } = useUserLocation();
  const { accessToken } = useContext(AuthContext);
  const { addStopover } = useVia();
  const { setDestination } = useRouteContext();

  const [inputText, setInputText] = useState(""); // 사용자 입력 텍스트
  const [messages, setMessages] = useState([]); // 채팅 기록 저장 배열
  const [isLoading, setIsLoading] = useState(false); // 챗봇 응답 로딩 상태
  const [sound, setSound] = useState(null); // TTS 오디오 객체
  const [isPlaying, setIsPlaying] = useState(false); // TTS 오디오 재생 상태
  const [currentPlayingText, setCurrentPlayingText] = useState(null); // 현재 재생 중인 텍스트
  const [isAutoTTSEnabled, setIsAutoTTSEnabled] = useState(false); // 자동 TTS 재생 모드 설정 상태

  // 사용자 입력 placeholder에 띄울 랜덤 문장들
  const placeholderOptions = [
    "경복궁에 대해 알려줘",
    "수원 화성의 역사적 배경에 대해 알려줘",
    "조선왕조실록에 대해 설명해줘",
    "남한산성에 대해 설명해줘",
  ];

  // 랜덤 문장 반환
  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * placeholderOptions.length);
    return placeholderOptions[randomIndex];
  };

  const [placeholder, setPlaceholder] = useState(getRandomPlaceholder()); // 사용자 입력 placeholder에 띄울 문장

  // 유적지 검색 및 처리 메서드
  const findHeritage = async (title) => {
    try {
      // 서버에 유적지 검색 요청
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

  // "역사적 배경" 꼬리질문 버튼 클릭 처리 메서드
  const handleHistoricalBackground = (title) => {
    sendMessage(`${title}의 역사적 배경에 대해 알려줘`);
  };

  // "목적지로 설정" 꼬리질문 버튼 클릭 처리 메서드
  const handleSetDestination = async (title) => {
    const heritage = await findHeritage(title);
    if (heritage) {
      setDestination(heritage); // 해당 유적지를 목적지로 설정
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

  // 챗봇 메시지 전송 메서드
  const sendMessage = async (text, skipFetch = false) => {
    // text: 사용자가 입력한 메시지
    // skipFetch: API 호출을 건너뛸지 여부 (true면 서버에 요청 안 함)

    // 사용자가 입력한 메시지가 없거나 위치 정보가 없으면 종료
    if (!text || !userLocation) return;

    // 사용자 메시지를 채팅 목록에 추가
    const userMessage = { text, from: "user" };
    setMessages((prev) => [...prev, userMessage]);

    // 사용자 입력 필드 초기화
    setInputText("");

    // API 호출 스킵이 true면 여기서 종료  (사용자 메시지만 화면에 추가하고 서버 요청 X)
    if (skipFetch) return;

    // 로딩 상태 설정 및 사용자 입력창 placeholder 변경
    setIsLoading(true);
    setMessages((prev) => [...prev, { from: "bot", loading: true }]);
    setPlaceholder(getRandomPlaceholder());

    // 토큰 유효성 검사
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
      // 서버에 챗봇 요청 전송
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

      // 챗봇 응답 메시지 생성
      const botMessage = {
        text: result?.data?.answer || "알 수 없는 응답입니다.",
        from: "bot",
        title: result?.data?.title || "",
      };
      setMessages((prev) => [...prev.slice(0, -1), botMessage]);
    } catch (e) {
      console.error("챗봇 요청 실패:", e);
      // 에러 메시지 표시
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { text: "오류가 발생했습니다.", from: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // "장바구니에 추가" 꼬리질문 버튼 클릭 처리 메서드
  const handleAddVia = async (title) => {
    // 사용자 메시지 추가 (API 호출 스킵)
    sendMessage(`${title}를 장바구니에 추가해줘`, true);

    // 유적지 검색 및 장바구니 추가
    const heritage = await findHeritage(title);
    if (heritage) {
      // 장바구니에 유적지 추가
      const added = await addStopover(heritage);
      // 챗봇 응답 메시지 직접 추가
      setMessages((prev) => [
        ...prev,
        {
          text: added
            ? `${title}가 장바구니에 추가되었습니다!`
            : `${title}는 이미 장바구니 목록에 있습니다.`,
          from: "bot",
        },
      ]);
    } else {
      // 유적지를 찾을 수 없는 경우 에러 메시지 추가
      setMessages((prev) => [
        ...prev,
        {
          text: "해당 유적지를 찾을 수 없습니다.",
          from: "bot",
        },
      ]);
    }
  };

  // 초기 메시지 처리 (다른 화면에서 챗봇 화면으로 넘어온 경우 초기 메시지 전달)
  useEffect(() => {
    if (route.params?.initialMessage) {
      sendMessage(route.params.initialMessage);
    }
  }, [route.params]);

  // 오디오 설정 메서드
  const setupAudio = async () => {
    try {
      // iOS/Android 오디오 모드 설정
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true, // 무음 모드에서도 재생 (for iOS)
      });
    } catch (error) {
      console.error("오디오 설정 실패:", error);
    }
  };

  // TTS 재생 메서드
  const playTTS = async (text) => {
    try {
      // 이미 재생 중인 경우 중지
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);

        // 같은 응답의 TTS 재생 버튼을 다시 클릭한 경우 재생 중지로 처리
        if (currentPlayingText === text) {
          setCurrentPlayingText(null);
          return;
        }
      }

      // 현재 재생 텍스트 설정
      setCurrentPlayingText(text);

      // 오디오 설정
      await setupAudio();

      // TTS API 요청
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

      // 재생 완료 시 콜백 설정
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

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // 챗봇 화면 포커스 시 기존 TTS 설정 불러오기
  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  // AsyncStorage에서 설정 불러오기 메서드
  const loadSettings = async () => {
    try {
      // 자동 TTS 재생 설정 불러오기
      const value = await AsyncStorage.getItem("chatbot_auto_tts");
      setIsAutoTTSEnabled(value === "true");
    } catch (error) {
      console.error("설정 불러오기 실패:", error);
    }
  };

  // 챗봇 응답이 왔을 때 자동 TTS 재생
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    // 자동 TTS 재생 설정이 활성화되고 챗봇 응답이 완료된 경우 자동 재생
    if (
      isAutoTTSEnabled &&
      lastMessage?.from === "bot" &&
      !lastMessage.loading
    ) {
      playTTS(lastMessage.text);
    }
  }, [messages, isAutoTTSEnabled]);

  // 설정 화면으로 이동 메서드
  const handleSettingsPress = () => {
    navigation.navigate("ChatbotConfig");
  };

  // 메시지 렌더링 함수
  const renderMessage = ({ item }) => {
    // 로딩 중인 챗봇 메시지 표시
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
          // 챗봇 메시지 (TTS 버튼 포함)
          <View style={styles.botMessageContainer}>
            <View style={[styles.message, styles.bot]}>
              <Text style={styles.botMessageText}>{item.text}</Text>
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
                color={theme.main_blue}
              />
            </TouchableOpacity>
          </View>
        ) : (
          // 사용자 메시지
          <View style={[styles.message, styles.user]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        {/* 챗봇 응답에 title이 있을 경우 == 특정 유적지에 대한 답변일 경우 꼬리 질문 버튼 표시 */}
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
              <Text style={styles.actionButtonText}>장바구니에 추가</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.black} />
        </TouchableOpacity>

        <Text style={styles.title}>챗봇</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings-outline" size={24} color={theme.black} />
        </TouchableOpacity>
      </View>

      {/* 메시지 목록 */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.chatArea}
      />

      {/* 입력 영역 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputRow}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            style={styles.input}
            placeholder={" 예: " + placeholder}
          />
          <TouchableOpacity onPress={() => sendMessage(inputText)}>
            <Ionicons name="send" size={24} color={theme.main_blue} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bluegray },
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
  chatArea: {
    padding: 10,
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: theme.bluegray,
  },
  message: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 16,
    maxWidth: "85%",
    position: "relative",
  },

  bot: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderTopLeftRadius: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
  },
  user: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    alignSelf: "flex-end",
    backgroundColor: theme.main_blue,
    borderTopRightRadius: 0,
  },
  botMessageText: {
    color: theme.black,
    fontSize: 15,
    lineHeight: 22,
  },
  messageText: { color: "white", fontSize: 15, lineHeight: 20 },
  inputRow: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: theme.bluegray,
    borderRadius: 20,
    marginHorizontal: 10,
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingLeft: 12,
    gap: 8,
    marginTop: -20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: theme.sub_blue,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  actionButtonText: {
    color: theme.main_blue,
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
    backgroundColor: "white",
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
    backgroundColor: theme.sub_blue,
  },
});
