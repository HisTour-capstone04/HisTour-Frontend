import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { LOCATION_TASK_NAME } from "./UserLocationTask";

const UserLocationContext = createContext();

export function UserLocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null); // 사용자 현재 위치
  const [locationPermission, setLocationPermission] = useState(true); // 위치 권한

  // 위치 권한 요청 메서드
  const requestLocationPermission = async () => {
    try {
      console.log("위치 권한 요청 시작");

      // foreground 위치 권한 요청
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (!foreground.granted) {
        console.warn("foreground 위치 권한 거부됨");
        setLocationPermission(false);
        return false;
      }

      // background 위치 권한 요청
      const background = await Location.requestBackgroundPermissionsAsync();
      if (!background.granted) {
        console.warn("background 위치 권한 거부됨");
        setLocationPermission(false);
        return false;
      }

      setLocationPermission(true);
      return true;
    } catch (e) {
      console.error("위치 권한 요청 중 에러 발생:", e);
      setLocationPermission(false);
      return false;
    }
  };

  // foreground 위치 추적 메서드
  const startForegroundWatching = async () => {
    return await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 }, // 10미터 움직일 때마다 위치 업데이트
      (loc) => {
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    );
  };

  // background 위치 추적 메서드
  const startBackgroundTracking = async () => {
    console.log("📡 백그라운드 추적 시작 호출됨");

    const hasPermission = await Location.getBackgroundPermissionsAsync();
    if (!hasPermission.granted) {
      console.warn("🚫 백그라운드 권한 없음");
      return;
    }

    // 이미 백그라운드 추적이 실행 중인지 확인
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );

    // 추적 시작 안 했으면 백그라운드 위치 추적 시작
    if (!hasStarted) {
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 0,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "HisTour 위치 추적 중",
            notificationBody: "주변 유적지를 탐색 중입니다",
          },
        });
        const afterStart = await Location.hasStartedLocationUpdatesAsync(
          LOCATION_TASK_NAME
        );
        console.log("📡 시작 시도 후 상태:", afterStart);
      } catch (e) {
        console.error("❌ 추적 시작 실패:", e);
      }
    }
  };

  // 처음 mount 될 때 실행됨
  useEffect(() => {
    let watcher;
    let appStateSubscription;

    // 권한 요청 & 위치 추적 처리
    const setupLocationTracking = async () => {
      const granted = await requestLocationPermission();
      if (!granted) return;

      // 포그라운드 추적 시작
      watcher = await startForegroundWatching();
      await startBackgroundTracking();

      // 앱 상태 변화 감지 -> 백그라운드 진입 시 백그라운드 추적 시작
      appStateSubscription = AppState.addEventListener(
        "change",
        async (nextState) => {
          if (nextState === "background") {
            console.log("📥 앱 백그라운드 진입");
          } else if (nextState === "active") {
            console.log("📤 앱 포그라운드 복귀 → 백그라운드 추적 중지");
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          }
        }
      );
    };

    setupLocationTracking();

    // 컴포넌트가 꺼질 때 watcher를 제거해서 메모리 누수 방지
    return () => {
      if (watcher) watcher.remove();
      if (appStateSubscription) appStateSubscription.remove();
    };
  }, []);

  return (
    <UserLocationContext.Provider value={{ userLocation, locationPermission }}>
      {children}
    </UserLocationContext.Provider>
  );
}

export const useUserLocation = () => useContext(UserLocationContext);
