import React, { useState } from "react";
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
import { theme } from "../../../theme/colors";

export default function MyPagePanel() {
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 로그인 처리
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

      if (!response.ok || !json.data) {
        Alert.alert(
          "로그인 실패",
          json.responseMessage || "이메일 또는 비밀번호가 잘못되었습니다"
        );
        return;
      }

      Alert.alert("로그인 성공", `${json.data.username}님 환영합니다!`);
      setModalVisible(false);
      // TODO: 토큰 저장하거나 홈으로 이동하는 처리 추가
    } catch (error) {
      console.error("로그인 에러:", error);
      Alert.alert("오류", "네트워크 오류가 발생했습니다");
    }

    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setModalVisible(true)}>
        <Text style={styles.loginText}>로그인하세요 &gt;</Text>
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
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

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancel}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
});
