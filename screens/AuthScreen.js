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

import Toast from "react-native-toast-message";
import { AuthContext } from "../contexts/AuthContext";
import { theme } from "../theme/colors";
import { useNavigation } from "@react-navigation/native";

export default function AuthScreen() {
  const { login } = useContext(AuthContext);
  const navigation = useNavigation();

  const [isLoginMode, setIsLoginMode] = useState(true);

  // 사용자 입력 관리
  const [signupName, setSignupName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 로그인 처리 메서드
  const handleLogin = async () => {
    console.log("이메일:", email);
    console.log("비밀번호:", password);

    // 이메일 or 비밀번호 공란
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "이메일과 비밀번호를 모두 입력해주세요",
        position: "bottom",
      });
      return;
    }

    try {
      const response = await fetch(
        "http://ec2-43-203-173-84.ap-northeast-2.compute.amazonaws.com:8080/api/members/login",
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
      // 로그인 에러 발생 시시
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

    // 비밀번호 재확인
    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "비밀번호가 일치하지 않습니다.",
        position: "bottom",
      });
      return;
    }

    try {
      const response = await fetch(
        "http://ec2-43-203-173-84.ap-northeast-2.compute.amazonaws.com:8080/api/members/signup",
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
      if (!response.ok) {
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
    // 입력 도중 다른 곳 터치 시 키보드 내림
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* 키보드가 올라와도 안 가려지도록 처리 (for iOS) */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* 상단 X 버튼 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#666" />
        </TouchableOpacity>

        {/* 타이틀 */}
        <Text style={styles.title}>{isLoginMode ? "로그인" : "회원가입"}</Text>

        {/* 이름 입력 칸 (회원가입 창) */}
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

        {/* 이메일 입력 칸 */}
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

        <TouchableOpacity
          style={styles.button}
          onPress={isLoginMode ? handleLogin : handleSignup}
        >
          <Text style={styles.buttonText}>
            {isLoginMode ? "로그인" : "회원가입"}
          </Text>
        </TouchableOpacity>

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
    backgroundColor: theme.main_green,
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
    color: theme.main_green,
    fontWeight: "bold",
  },
  cancel: {
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },
});
