import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 내부 컴포넌트 및 유틸리티 import
import { useHeritageNotification } from "../contexts/HeritageNotificationContext";
import { AuthContext } from "../contexts/AuthContext";
import { theme } from "../theme/colors";

/**
 * 설정 화면 컴포넌트
 *
 * 주요 기능 :
 * 1. 내 주변 유적지 알림 설정 (on/off)
 * 2. 로그아웃 버튼
 */
const ConfigScreen = () => {
  const navigation = useNavigation();
  const { isEnabled, setIsEnabled } = useHeritageNotification();
  const { logout } = useContext(AuthContext);

  // 로그아웃 확인 모달 표시 상태
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        {/* 뒤로 가기 버튼 */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.black} />
        </TouchableOpacity>

        {/* 화면 제목 */}
        <Text style={styles.title}>설정</Text>

        {/* 헤더 우측 여백 */}
        <View style={styles.headerButton} />
      </View>

      {/* 설정 내용 */}
      <View style={styles.content}>
        {/* 유적지 알림 설정 항목 (스위치) */}
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>내 주변 유적지 알림 받기</Text>
          <Switch
            trackColor={{ false: theme.darkgray, true: theme.main_blue }}
            onValueChange={setIsEnabled}
            value={isEnabled}
          />
        </View>
        {/* 설정 설명 */}
        <Text style={styles.settingDescription}>
          5분마다 주변 1km 내의 유적지를 확인하여 알림을 보냅니다
        </Text>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 로그아웃 확인 모달 */}
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

            {/* 모달 버튼 영역 */}
            <View style={styles.logoutButtonRow}>
              {/* 취소 버튼 */}
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.logoutCancelText}>다음에</Text>
              </TouchableOpacity>

              {/* 로그아웃 확인 버튼 */}
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  logout(); // 로그아웃 실행
                  setLogoutModalVisible(false); // 모달 닫기
                  navigation.navigate("Home"); // 홈 화면으로 이동
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
};

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bluegray,
  },
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
  content: {
    padding: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  settingText: {
    fontSize: 16,
    color: theme.black,
  },
  settingDescription: {
    fontSize: 13,
    color: theme.darkgray,
    marginLeft: 10,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutModalBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 25,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.main_blue,
    marginBottom: 10,
  },
  logoutMessage: {
    fontSize: 14,
    color: theme.bodyblack,
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
    color: theme.darkgray,
    fontWeight: "500",
  },
  logoutText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ConfigScreen;
