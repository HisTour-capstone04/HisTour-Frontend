import React, { createContext, useContext, useEffect, useState } from "react";

//외부 라이브러리 import
import AsyncStorage from "@react-native-async-storage/async-storage";

// 경유지 장바구니 관리 컨텍스트 생성
const ViaContext = createContext();

// 경유지 장바구니 목록 저장 키
const STORAGE_KEY = "stopoverCandidates";

/**
 * 경유지 장바구니 프로바이더 컴포넌트
 * 주요 기능: 경유지 장바구니 목록 로컬 저장 및 복원
 */
export function ViaProvider({ children }) {
  const [stopovers, setStopovers] = useState([]);

  // 앱 실행 시 사용자 로컬에 저장된 경유지 장바구니 목록 불러옴
  useEffect(() => {
    loadStopovers();
  }, []);

  // 저장된 경유지 장바구니 목록 불러오기 (context 내부에서만 사용)
  const loadStopovers = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) setStopovers(JSON.parse(json));
    } catch (e) {
      console.error("경유지 로드 실패:", e);
    }
  };

  // 경유지 장바구니 목록 저장하기 (context 내부에서만 사용)
  const saveStopovers = async (list) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setStopovers(list);
    } catch (e) {
      console.error("경유지 저장 실패:", e);
    }
  };

  // 경유지 장바구니 목록 추가 (중복 저장 방지) - 새로운 경유지를 목록 맨 앞에 추가하고 로컬에 저장
  const addStopover = async (heritage) => {
    const exists = stopovers.find((h) => h.id === heritage.id);
    if (!exists) {
      const updated = [heritage, ...stopovers];
      await saveStopovers(updated);
      return true;
    }
    return false;
  };

  // 경유지 장바구니 목록 삭제 - 해당 ID의 경유지를 목록에서 제거하고 로컬에 저장
  const removeStopover = async (id) => {
    const updated = stopovers.filter((h) => h.id !== id);
    await saveStopovers(updated);
  };

  // 경유지 장바구니 목록 초기화 - 모든 경유지를 삭제하고 빈 배열로 초기화
  const clearStopovers = async () => {
    await saveStopovers([]);
  };

  return (
    <ViaContext.Provider
      value={{
        // 경유지 장바구니 목록
        stopovers,
        // 경유지 장바구니 목록 추가/제거/초기화 메서드
        addStopover,
        removeStopover,
        clearStopovers,
      }}
    >
      {children}
    </ViaContext.Provider>
  );
}

// 경유지 장바구니 컨텍스트 사용을 위한 커스텀 훅
export function useVia() {
  return useContext(ViaContext);
}
