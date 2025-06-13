import React, { createContext, useContext, useState } from "react";

// 경로 모드 컨텍스트 생성
const RouteModeContext = createContext();

/**
 * 경로 모드 프로바이더 컴포넌트
 * 주요 기능: 길찾기 모드 상태 관리 (대중교통/자동차/도보)
 */
export function RouteModeProvider({ children }) {
  const [routeMode, setRouteMode] = useState("transit"); // 길찾기 모드 (기본값: 대중교통)

  return (
    <RouteModeContext.Provider
      value={{
        // 길찾기 모드 상태
        routeMode,
        setRouteMode,
      }}
    >
      {children}
    </RouteModeContext.Provider>
  );
}

// 경로 모드 컨텍스트 사용을 위한 커스텀 훅
export function useRouteMode() {
  return useContext(RouteModeContext);
}
