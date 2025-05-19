import React, { createContext, useState, useContext } from "react";

const RouteContext = createContext();

export function RouteProvider({ children }) {
  const [destination, setDestination] = useState(null); // 목적지
  const [routeData, setRouteData] = useState(null); // 경로 정보

  return (
    <RouteContext.Provider
      value={{ destination, setDestination, routeData, setRouteData }}
    >
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  return useContext(RouteContext);
}
