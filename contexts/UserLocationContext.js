// UserLocationContext.js (Expo Go 테스트용 - 일단은 백그라운드 추적 제외...)
import React, { createContext, useContext, useEffect, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const UserLocationContext = createContext();

// const LOCATION_TASK_NAME = "background-location-task";

/*
// 백그라운드 위치 바뀌었을 때 실행할 작업 정의
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error("백그라운드 위치 에러:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    console.log("백그라운드 위치:", locations[0].coords);
    // TODO: 여기에 푸시 알림 조건 검사 및 전송 로직 추가 가능
  }
});
*/

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

      /*
      // background 위치 권한 요청
      const background = await Location.requestBackgroundPermissionsAsync();
      const granted = background.granted;
      setLocationPermission(granted);
      

      if (!granted) {
        console.warn("background 위치 권한 거부됨");
      }
      
      else {
      */

      console.log("위치 권한 허용됨");
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
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 1 }, // 1미터 움직일 때마다 위치 업데이트
      (loc) => {
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    );
  };

  /*
  // background 위치 추적 메서드
  const startBackgroundTracking = async () => {
    // 이미 백그라운드 추적이 실행 중인지 확인
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );

    // 추적 시작 안 했으면 백그라운드 위치 추적 시작
    if (!hasStarted) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 5,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "HisTour 위치 추적 중",
          notificationBody: "주변 유적지를 탐색 중입니다",
        },
      });
    }
  };
*/

  // 처음 mount 될 때 실행됨
  useEffect(() => {
    let watcher;

    // 권한 요청 & 위치 추적 처리
    const setupLocationTracking = async () => {
      const granted = await requestLocationPermission();
      if (!granted) return;

      watcher = await startForegroundWatching();
      // await startBackgroundTracking();
    };

    setupLocationTracking();

    // 컴포넌트가 꺼질 때 watcher를 제거해서 메모리 누수 방지
    return () => {
      if (watcher) watcher.remove();
    };
  }, []);

  return (
    <UserLocationContext.Provider value={{ userLocation, locationPermission }}>
      {children}
    </UserLocationContext.Provider>
  );
}

export const useUserLocation = () => useContext(UserLocationContext);
