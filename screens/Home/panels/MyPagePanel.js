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

import Toast from "react-native-root-toast";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../../contexts/AuthContext";
import { theme } from "../../../theme/colors";
import { Ionicons } from "@expo/vector-icons";

export default function MyPagePanel() {
  const navigation = useNavigation();
  const { username, isLoggedIn, logout } = useContext(AuthContext);

  // 로그아웃 모달 창 관리
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => {
            if (isLoggedIn) {
              setLogoutModalVisible(true); // 로그인 상태 시 로그아웃 모달 보여줌
            } else {
              navigation.navigate("Auth"); // 비로그인 상태 시 로그인 화면으로 이동
            }
          }}
        >
          <Text style={styles.loginText}>
            {isLoggedIn
              ? `${username}님, 좋은 여행 되세요!`
              : "로그인하세요  >"}
          </Text>
        </Pressable>

        <TouchableOpacity
          onPress={() => navigation.navigate("Config")}
          style={styles.iconButton}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={theme.main_blue}
          />
        </TouchableOpacity>
      </View>

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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loginText: {
    fontSize: 16,
    color: "#333",
  },
  iconButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutModalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    width: "80%",
    alignItems: "center",

    // 그림자 효과
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10, // Android용 그림자
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.main_blue,
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
    backgroundColor: theme.main_blue,
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
