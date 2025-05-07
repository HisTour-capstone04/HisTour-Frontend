import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthContext } from "../../../contexts/AuthContext";
import { theme } from "../../../theme/colors";

export default function MyPagePanel() {
  const { username, isLoggedIn, login, logout } = useContext(AuthContext);

  // 로그인, 로그아웃 모달 창 관리
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // 사용자 입력 관리
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 로그인 처리 메서드
  const handleLogin = async () => {
    console.log("이메일:", email);
    console.log("비밀번호:", password);

    if (!email || !password) {
      Alert.alert("오류", "이메일과 비밀번호를 모두 입력해주세요");
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
        Alert.alert(
          "로그인 실패",
          json.responseMessage || "이메일 또는 비밀번호가 잘못되었습니다"
        );
        return;
      }

      // 로그인 성공 시
      Alert.alert("로그인 성공", `${json.data.username}님 환영합니다!`);
      setLoginModalVisible(false);
      await login(json.data.username, json.data.accessToken);
    } catch (error) {
      // 로그인 에러 발생 시
      console.error("로그인 에러:", error);
      Alert.alert("오류", "네트워크 오류가 발생했습니다");
    }

    setLoginModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          if (isLoggedIn) {
            setLogoutModalVisible(true); // 로그인 상태 시 로그아웃 모달 보여줌
          } else {
            setLoginModalVisible(true); // 비로그인 상태 시 로그인 모달 보여줌
          }
        }}
      >
        <Text style={styles.loginText}>
          {isLoggedIn ? `${username}님, 좋은 여행 되세요!` : "로그인하세요  >"}
        </Text>
      </Pressable>

      {/* 로그인 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={loginModalVisible}
        onRequestClose={() => setLoginModalVisible(false)}
      >
        {/* 입력 도중 다른 곳 터치 시 키보드 내림 */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>로그인</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>이메일</Text>
                <TextInput
                  style={styles.input}
                  placeholder="이메일을 입력하세요"
                  placeholderTextColor={theme.gray}
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
                  placeholderTextColor={theme.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>로그인</Text>
              </TouchableOpacity>

              <View style={styles.signupWrapper}>
                <Text style={styles.signupText}>
                  아직 회원이 아니신가요?{" "}
                  <Text
                    style={styles.signupLink}
                    onPress={() => console.log("회원가입 이동")}
                  >
                    회원가입
                  </Text>
                </Text>
              </View>

              <TouchableOpacity onPress={() => setLoginModalVisible(false)}>
                <Text style={styles.cancel}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 로그아웃 모달 */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalBox}>
            <Text style={styles.logoutTitle}>로그아웃 하시겠어요?</Text>
            <Text style={styles.logoutMessage}>
              언제든지 다시 로그인하실 수 있어요.
            </Text>

            <View style={styles.logoutButtonRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.logoutCancelText}>다음에</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  logout();
                  setLogoutModalVisible(false);
                }}
              >
                <Text style={styles.logoutText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  loginText: {
    fontSize: 16,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 10,
    width: "85%",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
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
    textAlignVertical: "center",
  },
  signupWrapper: {
    alignItems: "center",
    marginBottom: 10,
  },
  signupText: {
    fontSize: 14,
    color: "#444",
  },
  signupLink: {
    color: theme.main_green,
    fontWeight: "bold",
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
  cancel: {
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },
  logoutModalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    width: "80%",
    alignItems: "center",
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.main_green,
    marginBottom: 10,
  },
  logoutMessage: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  logoutButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  logoutCancelBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: "#eee",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    alignItems: "center",
  },
  logoutBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: theme.main_green,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: "center",
  },
  logoutCancelText: {
    color: "#888",
    fontWeight: "500",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
