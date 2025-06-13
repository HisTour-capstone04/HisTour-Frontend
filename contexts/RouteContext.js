import React, { createContext, useState, useContext } from "react";

// 외부 라이브러리 import
import Toast from "react-native-toast-message";

// 내부 컨텍스트 및 유틸리티 import
import { useUserLocation } from "./UserLocationContext";

// 경로 컨텍스트 생성
const RouteContext = createContext();

/**
 * 경로 프로바이더 컴포넌트
 * 주요 기능:
 * 1. 출발지, 목적지, 경유지로 구성된 경로 포인트 배열 관리
 * 2. 경로 포인트 추가/제거/재정렬 기능
 */
export function RouteProvider({ children }) {
  // 경로 상태 관리
  const [routePoints, setRoutePoints] = useState([]); // 전체 경로 저장 배열 (ex: [출발지, 경유지1, 경유지2, ..., 목적지])
  const [routeData, setRouteData] = useState(null); // 경로 안내 정보

  const { userLocation } = useUserLocation();

  // 경로 포인트
  const startPoint = routePoints[0] || null; // 출발지 : 배열의 첫번째 요소
  const destination =
    routePoints.length >= 2 ? routePoints[routePoints.length - 1] : null; // 목적지 : 배열의 마지막 요소
  const nowStopovers = routePoints.slice(1, routePoints.length - 1); // 경유지 : 배열 중간 요소들 (첫번째, 마지막 요소 제외하고 잘라내기)

  // 길찾기 시점의 사용자 위치 ("내 위치") 생성 메서드
  const getCurrentLocationPoint = () => ({
    id: "my-location",
    name: "내 위치",
    ...userLocation,
  });

  // 출발지 설정 메서드 (해당 유적지를 경로 배열 첫번째 요소로 교체)
  const setStart = (heritage) => {
    console.log("출발지 설정: " + heritage.name);
    setRoutePoints((prev) => {
      if (prev.length === 0) return [heritage];
      const copy = [...prev];
      copy[0] = heritage;
      return copy;
    });
  };

  // 목적지 설정 메서드 (해당 유적지를 경로 배열 마지막 요소로 교체)
  const setDestination = (heritage) => {
    // 경로 배열 비어있을 경우 : 내 위치(출발지) -> 해당 유적지(목적지)로 경로 배열 설정
    if (routePoints.length === 0 && userLocation) {
      console.log(
        "목적지 추가 - 출발지가 없어 현위치를 출발지로 추가합니다 : " +
          heritage.name
      );
      setRoutePoints([
        {
          name: "내 위치",
          ...userLocation,
        },
        heritage,
      ]);
      return;
    }

    // 경로 배열 길이가 1일 경우 : 출발지 -> 해당 유적지(목적지)로 경로 배열 설정
    if (routePoints.length === 1) {
      setRoutePoints([...routePoints, heritage]);
      return;
    }

    // 경로 배열 길이가 1보다 클 경우 : 출발지 -> 경유지 -> 해당 유적지(목적지)로 경로 배열 설정
    console.log("목적지 설정: " + heritage.name);
    setRoutePoints((prev) => {
      const withoutDestination = prev.slice(0, prev.length - 1);
      return [...withoutDestination, heritage];
    });
  };

  // 경유지 추가 메서드 (해당 유적지를 경로 배열 바로 앞 요소로 삽입)
  const addVia = (heritage) => {
    // 경로 배열 비어있을 경우 : 내 위치(출발지) -> 해당 유적지(목적지)로 경로 배열 설정
    if (routePoints.length === 0 && userLocation) {
      console.log(
        "경유지 추가 - 목적지가 없어 목적지로 추가합니다 : " + heritage.name
      );
      setRoutePoints([
        {
          name: "내 위치",
          ...userLocation,
        },
        heritage,
      ]);
      return;
    }

    // 경로 배열 길이가 1일 경우 : 출발지 -> 해당 유적지(경유지)로 경로 배열 설정
    if (routePoints.length === 1) {
      // 출발지와 경유지가 같은 유적지일 경우 경유지 추가 X
      if (startPoint.id === heritage.id) {
        Toast.show({
          type: "error",
          text1: "이미 출발지로 설정되어 있습니다.",
          position: "bottom",
        });
        return;
      }

      setRoutePoints([startPoint, heritage]);
      console.log(
        "경유지 추가 - 목적지가 없어 목적지로 추가합니다 :" + heritage.name
      );
      return;
    }

    // 연속으로 같은 유적지 추가 방지 (ex: A -> B -> B 이런 거 안 되게...)
    setRoutePoints((prev) => {
      const insertIndex = Math.max(prev.length - 1, 0); // 삽입될 위치 (목적지 바로 앞)

      const before = prev[insertIndex - 1]; // 삽입될 위치의 이전 유적지
      const after = prev[insertIndex]; // 목적지

      // 앞, 뒤 유적지와 비교하여 같은 유적지 있으면 경유지 추가 X
      if (
        (before && before.id === heritage.id) ||
        (after && after.id === heritage.id)
      ) {
        Toast.show({
          type: "error",
          text1: "인접한 유적지와 중복된 경유지는 추가할 수 없습니다.",
          position: "bottom",
        });
        return prev;
      }

      const copy = [...prev];
      copy.splice(insertIndex, 0, heritage);
      console.log("경유지 추가: " + heritage.name);
      return copy;
    });
  };

  // 경로 포인트 제거 메서드
  const removePoint = (index) => {
    setRoutePoints((prev) => prev.filter((_, i) => i !== index));
  };

  // 경로 포인트 순서 재배열 메서드
  const reorderPoints = (newOrder) => {
    setRoutePoints(newOrder);
  };

  // 경로 배열 초기화 메서드
  const clearRoute = () => {
    setRoutePoints([]);
    setRouteData(null);
  };

  return (
    <RouteContext.Provider
      value={{
        // 경로 데이터
        routeData,
        setRouteData,

        // 경로 포인트
        routePoints,
        setRoutePoints,
        startPoint,
        destination,
        nowStopovers,

        // 경로 관리 메서드
        setStart,
        setDestination,
        addVia,
        removePoint,
        reorderPoints,
        clearRoute,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
}

// 경로 컨텍스트 사용을 위한 커스텀 훅
export function useRoute() {
  return useContext(RouteContext);
}
