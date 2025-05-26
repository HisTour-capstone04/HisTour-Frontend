import React, { createContext, useContext, useState } from "react";

const RouteModeContext = createContext();

export function RouteModeProvider({ children }) {
  const [routeMode, setRouteMode] = useState("transit"); // 기본값: 대중교통

  return (
    <RouteModeContext.Provider value={{ routeMode, setRouteMode }}>
      {children}
    </RouteModeContext.Provider>
  );
}

// 3. 커스텀 훅
export function useRouteMode() {
  return useContext(RouteModeContext);
}
