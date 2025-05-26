// 길찾기 경로 관리용 context

import React, { createContext, useState, useContext } from "react";
import { useUserLocation } from "./UserLocationContext";
import Toast from "react-native-toast-message";

const RouteContext = createContext();

export function RouteProvider({ children }) {
  const [routePoints, setRoutePoints] = useState([]); // 전체 경로 저장 배열 (ex: [출발지, 경유지1, 경유지2, ..., 목적지])
  const [routeData, setRouteData] = useState(null); // 경로 안내 정보
  const { userLocation } = useUserLocation(); // 사용자 위치

  // 출발지 : 배열의 첫번째 요소
  const startPoint = routePoints[0] || null;

  // 목적지 : 배열의 마지막 요소
  const destination = routePoints[routePoints.length - 1] || null;

  // 경유지 : 배열 중간 요소들 (첫번째, 마지막 요소 제외하고 잘라내기)
  const stopovers = routePoints.slice(1, routePoints.length - 1);

  // 출발지 설정 (해당 유적지를 경로 배열 첫번째 요소로 교체)
  const setStart = (heritage) => {
    console.log("출발지 설정: " + heritage.name);
    setRoutePoints((prev) => {
      if (prev.length === 0) return [heritage];
      const copy = [...prev];
      copy[0] = heritage;
      return copy;
    });
  };

  // 목적지 설정 (해당 유적지를 경로 배열 마지막 요소로 교체)
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

    console.log("목적지 설정: " + heritage.name);
    setRoutePoints((prev) => {
      const withoutDestination = prev.slice(0, prev.length - 1);
      return [...withoutDestination, heritage];
    });
  };

  // 경유지 추가 (해당 유적지를 경로 배열 바로 앞 요소로 삽입)
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

  // 경유지 또는 목적지 제거
  const removePoint = (index) => {
    setRoutePoints((prev) => prev.filter((_, i) => i !== index));
  };

  // 경로 배열 순서 재배열
  const reorderPoints = (newOrder) => {
    setRoutePoints(newOrder);
  };

  // 경로 배열 초기화
  const clearRoute = () => {
    setRoutePoints([]);
    setRouteData(null);
  };

  return (
    <RouteContext.Provider
      value={{
        routeData,
        setRouteData,
        routePoints,
        startPoint,
        destination,
        stopovers,
        setRoutePoints,
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

export function useRoute() {
  return useContext(RouteContext);
}
