import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import * as Notifications from "expo-notifications";
import { useHeritageNotification } from "../contexts/HeritageNotificationContext";
import { useUserLocation } from "../contexts/UserLocationContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme/colors";

const HeritageNotificationManager = () => {
  const navigation = useNavigation();
  const [lastNotification, setLastNotification] = useState(null);
  const { userLocation, locationPermission } = useUserLocation();
  const { status, isEnabled, setIsEnabled } = useHeritageNotification();

  // 알림 리스너 설정
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("알림 수신:", notification);
        if (notification.request.content.data?.type === "heritage_nearby") {
          setLastNotification({
            message: notification.request.content.body,
            time: new Date().toLocaleTimeString(),
            count: notification.request.content.data.count,
          });
        }
      }
    );

    return () => subscription.remove();
  }, []);

  const getStatusInfo = () => {
    return `
실행 상태: ${status.isRunning ? "실행 중" : "중지됨"}
마지막 알림: ${
      status.lastNotificationTime
        ? new Date(status.lastNotificationTime).toLocaleTimeString()
        : "없음"
    }
    `.trim();
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
        <Text style={styles.headerTitle}>유적지 알림 설정</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>현재 상태</Text>
          <Text style={styles.statusText}>
            위치 권한: {locationPermission ? "허용됨" : "거부됨"}
          </Text>
          <Text style={styles.statusText}>
            현재 위치:{" "}
            {userLocation
              ? `${userLocation.latitude.toFixed(
                  6
                )}, ${userLocation.longitude.toFixed(6)}`
              : "위치 정보 없음"}
          </Text>
          <Text style={styles.statusText}>
            알림 서비스: {isEnabled ? "활성화됨" : "비활성화됨"}
          </Text>
          <Text style={styles.statusText}>{getStatusInfo()}</Text>
        </View>

        <View style={styles.settingContainer}>
          <Text style={styles.settingLabel}>유적지 알림 받기</Text>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: theme.gray, true: theme.main_blue }}
            thumbColor={isEnabled ? "white" : "#f4f3f4"}
          />
        </View>

        <Text style={styles.description}>
          5분마다 주변 1km 내의 유적지를 확인하여 알림을 보냅니다.
        </Text>

        {lastNotification && (
          <View style={styles.lastNotificationContainer}>
            <Text style={styles.lastNotificationTitle}>최근 알림</Text>
            <Text style={styles.lastNotificationTime}>
              {lastNotification.time}
            </Text>
            <Text style={styles.lastNotificationMessage}>
              {lastNotification.message}
            </Text>
            <Text style={styles.lastNotificationCount}>
              총 {lastNotification.count}개의 유적지
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    backgroundColor: theme.main_blue,
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
    lineHeight: 20,
  },
  settingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  lastNotificationContainer: {
    backgroundColor: "#e8f5e8",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  lastNotificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  lastNotificationTime: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  lastNotificationMessage: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    lineHeight: 20,
  },
  lastNotificationCount: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
});

export default HeritageNotificationManager;
