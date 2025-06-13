import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 외부 라이브러리 import
import Toast from "react-native-toast-message";

// 내부 컴포넌트 및 유틸리티 import
import { AuthContext } from "../contexts/AuthContext";
import { theme } from "../theme/colors";

// 서버 주소 상수
import { IP_ADDRESS } from "../config/apiKeys";

/**
 * 인증 화면 컴포넌트
 *
 * 주요 기능 :
 * 1. 로그인 기능 (이메일/비밀번호)
 * 2. 회원가입 기능 (이름/이메일/비밀번호/비밀번호 확인)
 * 3. 로그인/회원가입 시 입력 유효성 검사
 * 4. 키보드 처리 및 UI 최적화
 *
 **/

export default function AuthScreen() {
  const { login } = useContext(AuthContext);
  const navigation = useNavigation();

  // 화면 모드 state (로그인/회원가입)
  const [isLoginMode, setIsLoginMode] = useState(true);

  // 사용자 입력 값 관리
  const [signupName, setSignupName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 이메일 유효성 검사 메서드
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 로그인 처리 메서드
  const handleLogin = async () => {
    console.log("이메일:", email);
    console.log("비밀번호:", password);

    // 이메일 or 비밀번호가 공란일 경우
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "이메일과 비밀번호를 모두 입력해주세요",
        position: "bottom",
      });
      return;
    }

    // 서버에 로그인 요청
    try {
      const response = await fetch(
        "http://" + IP_ADDRESS + ":8080/api/members/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const json = await response.json();

      // 로그인 실패 시
      if (!response.ok || !json.data) {
        Toast.show({
          type: "error",
          text1:
            json.responseMessage || "이메일 또는 비밀번호가 잘못되었습니다",
          position: "bottom",
        });
        return;
      }

      // 로그인 성공 시
      Toast.show({
        type: "success",
        text1: `${json.data.username}님 환영합니다!`,
        position: "bottom",
      });
      await login(json.data.username, json.data.accessToken);
      navigation.goBack();
    } catch (error) {
      // 로그인 에러 발생 시
      console.error("로그인 에러:", error);
      Toast.show({
        type: "error",
        text1: "네트워크 오류가 발생했습니다",
        position: "bottom",
      });
    }
  };

  // 회원가입 처리 메서드
  const handleSignup = async () => {
    // 빈 항목이 있을 경우
    if (!signupName || !email || !password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "모든 항목을 입력해주세요.",
        position: "bottom",
      });
      return;
    }

    // 이메일 유효성 검사
    if (!isValidEmail(email)) {
      Toast.show({
        type: "error",
        text1: "이메일 형식을 확인해주세요.",
        position: "bottom",
      });
      return;
    }

    // 비밀번호와 재확인 비밀번호가 일치하지 않을 경우
    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "비밀번호가 일치하지 않습니다.",
        position: "bottom",
      });
      return;
    }

    // 서버에 회원가입 요청
    try {
      const response = await fetch(
        "http://" + IP_ADDRESS + ":8080/api/members/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            username: signupName,
          }),
        }
      );

      const json = await response.json();

      // 회원가입 실패 시
      if (!response.ok || !json.data) {
        Toast.show({
          type: "error",
          text1: json.responseMessage || "서버 오류가 발생했습니다",
          position: "bottom",
        });
        return;
      }

      // 회원가입 성공 시
      Toast.show({
        type: "success",
        text1: "회원가입 성공!",
        text2: "로그인 화면으로 이동합니다",
        position: "bottom",
      });
      setIsLoginMode(true);
    } catch (error) {
      console.error("회원가입 에러:", error);
      Toast.show({
        type: "error",
        text1: "네트워크 오류가 발생했습니다",
        position: "bottom",
      });
    }
  };

  return (
    // 키보드 외부 터치 시 키보드 숨김
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* 키보드가 올라와도 컨텐츠가 가려지지 않도록 처리 (for iOS) */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* 상단 닫기(x) 버튼 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#666" />
        </TouchableOpacity>

        {/* 화면 타이틀 */}
        <Text style={styles.title}>{isLoginMode ? "로그인" : "회원가입"}</Text>

        {/* 이름 입력 필드 (회원가입 창) */}
        {!isLoginMode && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력하세요"
              value={signupName}
              onChangeText={setSignupName}
            />
          </View>
        )}

        {/* 이메일 입력 필드 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            placeholder="이메일을 입력하세요"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* 비밀번호 입력 필드 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* 비밀번호 확인 필드 (회원가입 창) */}
        {!isLoginMode && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        )}

        {/* 로그인/회원가입 버튼 */}
        <TouchableOpacity
          style={styles.button}
          onPress={isLoginMode ? handleLogin : handleSignup}
        >
          <Text style={styles.buttonText}>
            {isLoginMode ? "로그인" : "회원가입"}
          </Text>
        </TouchableOpacity>

        {/* 로그인/회원가입 모드 전환 버튼 */}
        <View style={styles.linkWrapper}>
          <Text style={styles.linkText}>
            {isLoginMode ? "아직 회원이 아니신가요? " : "이미 회원이신가요? "}
            <Text
              style={styles.link}
              onPress={() => setIsLoginMode(!isLoginMode)}
            >
              {isLoginMode ? "회원가입" : "로그인"}
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    padding: 30,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.gray,
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  button: {
    backgroundColor: theme.main_blue,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  linkWrapper: {
    alignItems: "center",
    marginBottom: 10,
  },
  linkText: {
    fontSize: 14,
    color: "#444",
  },
  link: {
    color: theme.main_blue,
    fontWeight: "bold",
  },
  cancel: {
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },
});
