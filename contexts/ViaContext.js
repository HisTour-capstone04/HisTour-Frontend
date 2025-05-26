// 경유지 후보군 관리용 context (사용자 로컬에 저장됨)
// 주변 정보 패널에서 경유지 추가 버튼을 누르면 경유지 후보군으로 사용자 로컬에 저장됨
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
const ViaContext = createContext();

const STORAGE_KEY = "stopoverCandidates";

export function ViaProvider({ children }) {
  const [stopovers, setStopovers] = useState([]);

  // 앱 실행 시 사용자 로컬에 저장된 경유지 후보군 불러옴
  useEffect(() => {
    loadStopovers();
  }, []);

  // 저장된 경유지 후보군 불러오기 (context 내부에서만 사용용)
  const loadStopovers = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) setStopovers(JSON.parse(json));
    } catch (e) {
      console.error("경유지 로드 실패:", e);
    }
  };

  // 경유지 후보군 저장하기 (context 내부에서만 사용)
  const saveStopovers = async (list) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setStopovers(list);
    } catch (e) {
      console.error("경유지 저장 실패:", e);
    }
  };

  // 경유지 후보군 추가 (중복 저장 방지)
  const addStopover = async (heritage) => {
    const exists = stopovers.find((h) => h.id === heritage.id);
    if (!exists) {
      const updated = [heritage, ...stopovers];
      await saveStopovers(updated);
      return true;
    }
    return false;
  };

  // 경유지 후보군 삭제
  const removeStopover = async (id) => {
    const updated = stopovers.filter((h) => h.id !== id);
    await saveStopovers(updated);
  };

  // 경유지 후보군 목록 초기화
  const clearStopovers = async () => {
    await saveStopovers([]);
  };

  return (
    <ViaContext.Provider
      value={{ stopovers, addStopover, removeStopover, clearStopovers }}
    >
      {children}
    </ViaContext.Provider>
  );
}

export function useVia() {
  return useContext(ViaContext);
}
