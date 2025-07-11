import React, { createContext, useContext, useEffect, useState } from "react";

// 외부 라이브러리 import
import * as Location from "expo-location";

// 사용자 위치 컨텍스트 생성
const UserLocationContext = createContext();

// 위치 추적 관련 상수
const MIN_DISTANCE_CHANGE = 5; // 최소 위치 변경 거리 (m) - 사용자가 5m 이상 이동했을 때만 위치 업데이트

/**
 * 사용자 위치 프로바이더 컴포넌트
 * 주요 기능:
 * 1. 사용자 현재 위치 실시간 추적 및 관리
 * 2. 위치 권한 요청 및 상태 관리
 */
export function UserLocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null); // 사용자 현재 위치
  const [locationPermission, setLocationPermission] = useState(true); // 위치 권한 상태

  // 거리 계산 함수 (Haversine 공식)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (
      typeof lat1 !== "number" ||
      typeof lon1 !== "number" ||
      typeof lat2 !== "number" ||
      typeof lon2 !== "number"
    ) {
      return 0;
    }

    const R = 6371e3; // 지구 반경 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위 거리
  };

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

      console.log("위치 권한 허용됨");
      setLocationPermission(true);
      return true;
    } catch (e) {
      console.error("위치 권한 요청 중 에러 발생:", e);
      setLocationPermission(false);
      return false;
    }
  };

  // 이전 위치 저장용 변수
  let lastLocation = null; // 마지막으로 저장된 위치
  let lastUpdateTime = 0; // 마지막 업데이트 시간

  // foreground 위치 추적 메서드
  const startForegroundWatching = async () => {
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000, // 3초마다 위치 업데이트
        distanceInterval: 5, // 5m 이상 움직였을 때만 위치 업데이트
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const currentTime = Date.now();

        // 새로운 위치 객체 생성
        const newLocation = { latitude, longitude };

        // 위치가 실제로 변경되었는지 확인
        if (!lastLocation) {
          // 첫 위치 업데이트
          lastLocation = newLocation;
          lastUpdateTime = currentTime;
          setUserLocation(newLocation);
          console.log("초기 위치 설정:", newLocation);
          return;
        }

        // 이전 위치와의 거리 계산
        const distance = getDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          latitude,
          longitude
        );

        // 최소 거리 이상 이동했고, 마지막 업데이트로부터 1초 이상 지났을 때만 위치 업데이트
        if (
          distance >= MIN_DISTANCE_CHANGE &&
          currentTime - lastUpdateTime >= 1000
        ) {
          lastLocation = newLocation;
          lastUpdateTime = currentTime;
          setUserLocation(newLocation);
          console.log(`위치 업데이트 (이동 거리: ${distance.toFixed(2)}m)`);
        }
      }
    );
  };

  // 위치 추적 초기화
  useEffect(() => {
    let watcher;

    const setupLocationTracking = async () => {
      // 위치 권한 요청
      const granted = await requestLocationPermission();
      if (!granted) return;

      try {
        // 위치 추적 시작
        watcher = await startForegroundWatching();
      } catch (error) {
        console.error("위치 추적 시작 실패:", error);
      }
    };

    setupLocationTracking();

    // cleanup: 위치 추적 중지
    return () => {
      if (watcher) {
        watcher.remove();
      }
    };
  }, []);

  return (
    <UserLocationContext.Provider
      value={{
        // 위치 상태
        userLocation,
        locationPermission,
      }}
    >
      {children}
    </UserLocationContext.Provider>
  );
}

// 사용자 위치 컨텍스트 사용을 위한 커스텀 훅
export const useUserLocation = () => useContext(UserLocationContext);
