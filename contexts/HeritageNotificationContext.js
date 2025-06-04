import React, { createContext, useContext, useState, useEffect } from "react";
import { useUserLocation } from "./UserLocationContext";
import { useAuth } from "./AuthContext";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { IP_ADDRESS } from "../config/apiKeys";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5분 (밀리초)
const RADIUS = 1000; // 1km
const MIN_NOTIFICATION_INTERVAL = 60 * 1000; // 1분 간격으로 알림 제한

const HeritageNotificationContext = createContext();

export const HeritageNotificationProvider = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [checkIntervalId, setCheckIntervalId] = useState(null);

  const { userLocation, locationPermission } = useUserLocation();
  const { accessToken } = useAuth();
  const userLocationRef = React.useRef(userLocation);

  // 알림 설정 초기화
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // 알림 핸들러 설정
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        // 디바이스가 물리적 디바이스인지 확인
        if (!Device.isDevice) {
          console.warn("알림은 실제 기기에서만 작동합니다.");
          return false;
        }

        // 알림 권한 요청
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.warn("알림 권한이 거부되었습니다.");
          return false;
        }

        console.log("알림 설정 완료");
        return true;
      } catch (error) {
        console.error("알림 설정 실패:", error);
        return false;
      }
    };

    setupNotifications();
  }, []);

  // userLocation이 변경될 때마다 ref 업데이트
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // 근처 유적지 API 호출
  const fetchNearbyHeritages = async (latitude, longitude) => {
    if (!accessToken) {
      console.error("인증 토큰이 없습니다.");
      return null;
    }

    try {
      const url = `http://${IP_ADDRESS}:8080/api/heritages/nearby-for-alarm?latitude=${latitude}&longitude=${longitude}&radius=${RADIUS}`;

      console.log("유적지 조회 API 호출:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.warn(`API 응답 오류: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log("근처 유적지 조회 성공:", data);

      return data;
    } catch (error) {
      console.error("유적지 조회 API 호출 실패:", error);
      return null;
    }
  };

  // 로컬 알림 전송
  const sendNotification = async (message, count = 0) => {
    try {
      const currentTime = Date.now();

      // 너무 자주 알림이 가지 않도록 제한
      if (currentTime - lastNotificationTime < MIN_NOTIFICATION_INTERVAL) {
        console.log("알림 간격 제한으로 스킵");
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "근처 유적지 발견! 🏛️",
          body: message,
          sound: "default",
          data: {
            type: "heritage_nearby",
            count: count,
            timestamp: currentTime,
          },
        },
        trigger: null, // 즉시 전송
      });

      setLastNotificationTime(currentTime);
      console.log("알림 전송 완료:", message);
    } catch (error) {
      console.error("알림 전송 실패:", error);
    }
  };

  // 위치 기반 유적지 체크 및 알림
  const checkAndNotifyHeritages = async (location) => {
    if (!location || !location.latitude || !location.longitude) {
      console.log("사용자 위치 정보 없음");
      return;
    }

    try {
      const { latitude, longitude } = location;
      const heritageData = await fetchNearbyHeritages(latitude, longitude);

      if (!heritageData || !heritageData.data) {
        console.log("유적지 데이터 없음");
        return;
      }

      const { data } = heritageData;

      // 유적지가 있는 경우에만 알림 전송
      if (data.count > 0 && data.message) {
        await sendNotification(data.message, data.count);
      } else {
        console.log("근처에 유적지 없음");
      }
    } catch (error) {
      console.error("유적지 체크 및 알림 처리 실패:", error);
    }
  };

  // 알림 서비스 시작/중지
  useEffect(() => {
    // 이전 인터벌 정리
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
      setCheckIntervalId(null);
      setIsRunning(false);
    }

    // 알림이 비활성화되었거나 필요한 조건이 충족되지 않으면 여기서 종료
    if (!isEnabled || !locationPermission || !userLocation) {
      console.log("알림 서비스 중지:", {
        isEnabled,
        locationPermission,
        hasLocation: !!userLocation,
      });
      return;
    }

    console.log("알림 서비스 시작");
    // 첫 번째 체크 즉시 실행
    checkAndNotifyHeritages(userLocation);

    // 주기적 체크 시작
    const intervalId = setInterval(() => {
      console.log("유적지 주기적 체크 실행...");
      checkAndNotifyHeritages(userLocationRef.current);
    }, CHECK_INTERVAL);

    setCheckIntervalId(intervalId);
    setIsRunning(true);

    return () => {
      clearInterval(intervalId);
      setCheckIntervalId(null);
      setIsRunning(false);
    };
  }, [isEnabled, locationPermission, userLocation]);

  const value = {
    isEnabled,
    setIsEnabled,
    status: {
      isRunning,
      lastNotificationTime,
    },
    manualCheck: (userLocation) => {
      if (isEnabled) {
        checkAndNotifyHeritages(userLocation);
      } else {
        console.log("알림이 비활성화되어 있어 수동 체크를 수행하지 않습니다.");
      }
    },
    canCheck: !!userLocation && !!locationPermission,
  };

  return (
    <HeritageNotificationContext.Provider value={value}>
      {children}
    </HeritageNotificationContext.Provider>
  );
};

export const useHeritageNotification = () => {
  const context = useContext(HeritageNotificationContext);
  if (context === undefined) {
    throw new Error(
      "useHeritageNotification must be used within a HeritageNotificationProvider"
    );
  }
  return context;
};
