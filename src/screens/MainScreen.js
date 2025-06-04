import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import HeritageNotificationService from "../services/HeritageNotificationService";
import { AuthContext } from "../../contexts/AuthContext";
import { useUserLocation } from "../../contexts/UserLocationContext";

const MainScreen = () => {
  const { accessToken, isLoggedIn } = useContext(AuthContext);
  const { userLocation } = useUserLocation();
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    console.log("userLocation 변경됨:", userLocation);
    if (userLocation) {
      setCurrentLocation({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }
  }, [userLocation]);

  // 컴포넌트 마운트 시 토큰 설정
  useEffect(() => {
    if (accessToken) {
      HeritageNotificationService.setAccessToken(accessToken);
    }
  }, [accessToken]);

  const startNotificationService = async () => {
    if (!isLoggedIn) {
      alert("알림 서비스를 사용하려면 로그인이 필요합니다.");
      return;
    }

    if (!currentLocation) {
      alert("위치 정보를 가져올 수 없습니다.");
      return;
    }

    const hasPermission =
      await HeritageNotificationService.requestPermissions();
    if (hasPermission) {
      HeritageNotificationService.startPeriodicCheck(
        currentLocation.latitude,
        currentLocation.longitude
      );
      alert("알림 서비스가 시작되었습니다.");
    }
  };

  const stopNotificationService = () => {
    HeritageNotificationService.stopPeriodicCheck();
    alert("알림 서비스가 중지되었습니다.");
  };

  const formatCoordinate = (coord) => {
    return coord ? coord.toFixed(8) : "불러오는 중...";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>유적지 알림 테스트</Text>
        <Text style={styles.location}>
          현재 위치:{"\n"}
          {currentLocation ? (
            <>
              위도: {formatCoordinate(currentLocation.latitude)}
              {"\n"}
              경도: {formatCoordinate(currentLocation.longitude)}
            </>
          ) : (
            "위치 정보를 가져오는 중..."
          )}
        </Text>
        <Text style={styles.loginStatus}>
          {isLoggedIn ? "로그인 됨" : "로그인이 필요합니다"}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.startButton,
              !currentLocation && styles.disabledButton,
            ]}
            onPress={startNotificationService}
            disabled={!currentLocation}
          >
            <Text style={styles.buttonText}>알림 시작</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopNotificationService}
          >
            <Text style={styles.buttonText}>알림 중지</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },
  location: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
    lineHeight: 24,
    color: "#333",
  },
  loginStatus: {
    fontSize: 16,
    marginBottom: 30,
    color: "#666",
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  stopButton: {
    backgroundColor: "#f44336",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MainScreen;
