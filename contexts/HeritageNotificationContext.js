import React, { createContext, useContext, useState, useEffect } from "react";

// 외부 라이브러리 import
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// 내부 컨텍스트 및 유틸리티 import
import { useUserLocation } from "./UserLocationContext";
import { useAuth } from "./AuthContext";

// 서버 주소 상수
import { IP_ADDRESS } from "../config/apiKeys";

// 알림 관련 상수
const CHECK_INTERVAL = 5 * 60 * 1000; // 5분 (밀리초) = 5분 간격으로 api 호출
const RADIUS = 1000; // 1km
const MIN_NOTIFICATION_INTERVAL = 5 * 60 * 1000; // 5분 간격으로 알림 제한

// 유적지 알림 컨텍스트 생성
const HeritageNotificationContext = createContext();
``;

/**
 * 유적지 알림 프로바이더 컴포넌트
 * 주요 기능:
 * 1. 사용자 위치 근처 유적지 자동 감지 및 알림 전송 (5분 간격)
 * 2. 알림 클릭 시 유적지 상세 정보 전달
 */
export const HeritageNotificationProvider = ({ children }) => {
  // 알림 상태 관리
  const [isEnabled, setIsEnabled] = useState(true); // 알림 활성화 상태
  const [isRunning, setIsRunning] = useState(false); // 알림 서비스 실행 상태
  const [lastNotificationTime, setLastNotificationTime] = useState(0); // 마지막 알림 전송 시간
  const [checkIntervalId, setCheckIntervalId] = useState(null); // 주기적 체크 인터벌 ID
  const [notificationSubscription, setNotificationSubscription] =
    useState(null); // 알림 응답 리스너 (알림 클릭 시 유적지 상세 정보 전달)

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

        // 알림 응답 리스너 설정
        const subscription =
          Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("사용자가 알림을 클릭했습니다");
            const data = response.notification.request.content.data;

            // 전역 이벤트로 알림 데이터 전달
            if (data && data.heritages) {
              if (global.notificationHandler) {
                global.notificationHandler(data.heritages);
              }
            }
          });

        setNotificationSubscription(subscription);

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

    return () => {
      if (notificationSubscription) {
        notificationSubscription.remove();
      }
    };
  }, []);

  // userLocation이 변경될 때마다 ref 업데이트
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // 근처 유적지 API 호출 메서드
  const fetchNearbyHeritages = async (latitude, longitude) => {
    if (!accessToken) {
      console.warn("토큰 없음 → 알림 요청 중단");
      return;
    }

    try {
      const url = `http://${IP_ADDRESS}:8080/api/heritages/nearby-for-alarm?latitude=${latitude}&longitude=${longitude}&radius=${RADIUS}`;

      console.log("알림 API 호출:", url);

      // 서버에 근처 유적지 요청
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

  // 로컬 알림 전송 메서드
  const sendNotification = async (message, count = 0, heritages = []) => {
    try {
      const currentTime = Date.now();

      // 너무 자주 알림이 가지 않도록 제한 (5분 간격)
      if (currentTime - lastNotificationTime < MIN_NOTIFICATION_INTERVAL) {
        console.log("알림 간격 제한으로 스킵");
        return;
      }

      // 알림 스케줄링
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "내 근처 새로운 유적지가 발견됐어요 👀",
          body: message,
          sound: "default",
          data: {
            type: "heritage_nearby",
            count: count,
            timestamp: currentTime,
            heritages: heritages,
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

  // 위치 기반 유적지 체크 및 알림 메서드
  const checkAndNotifyHeritages = async (location) => {
    if (!location || !location.latitude || !location.longitude) {
      console.log("사용자 위치 정보 없음");
      return;
    }

    try {
      const { latitude, longitude } = location;
      const response = await fetchNearbyHeritages(latitude, longitude);

      if (!response || !response.data) {
        console.log("유적지 데이터 없음");
        return;
      }

      const { data } = response;

      // 유적지가 있는 경우에만 알림 전송
      if (data.count > 0 && data.message) {
        await sendNotification(data.message, data.count, data.heritages);
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

    // 알림 서비스가 활성화되고 필요한 조건이 모두 충족된 경우에만 시작
    console.log("알림 서비스 시작");

    // 첫 번째 체크 즉시 실행
    checkAndNotifyHeritages(userLocation);

    // 주기적 체크 시작 (5분 간격)
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

  return (
    <HeritageNotificationContext.Provider
      value={{
        // 알림 상태
        isEnabled,
        setIsEnabled,

        // 알림 서비스 상태
        status: {
          isRunning,
          lastNotificationTime,
        },

        // 알림 관련 메서드
        manualCheck: (userLocation) => {
          if (isEnabled) {
            checkAndNotifyHeritages(userLocation);
          } else {
            console.log(
              "알림이 비활성화되어 있어 수동 체크를 수행하지 않습니다."
            );
          }
        },

        // 알림 가능 여부
        canCheck: !!userLocation && !!locationPermission,
      }}
    >
      {children}
    </HeritageNotificationContext.Provider>
  );
};

// 유적지 알림 컨텍스트 사용을 위한 커스텀 훅
export const useHeritageNotification = () => {
  const context = useContext(HeritageNotificationContext);
  if (context === undefined) {
    throw new Error(
      "useHeritageNotification must be used within a HeritageNotificationProvider"
    );
  }
  return context;
};
