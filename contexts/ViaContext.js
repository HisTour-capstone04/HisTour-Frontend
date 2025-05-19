import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const ViaContext = createContext();

const STORAGE_KEY = "stopoverHeritages";

export function ViaProvider({ children }) {
  const [stopovers, setStopovers] = useState([]);

  useEffect(() => {
    loadStopovers();
  }, []);

  const loadStopovers = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) setStopovers(JSON.parse(json));
    } catch (e) {
      console.error("경유지 로드 실패:", e);
    }
  };

  const saveStopovers = async (list) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setStopovers(list);
    } catch (e) {
      console.error("경유지 저장 실패:", e);
    }
  };

  const addStopover = async (heritage) => {
    const exists = stopovers.find((h) => h.id === heritage.id);
    if (!exists) {
      const updated = [heritage, ...stopovers];
      await saveStopovers(updated);
    }
  };

  const removeStopover = async (id) => {
    const updated = stopovers.filter((h) => h.id !== id);
    await saveStopovers(updated);
    Toast.show({
      type: "info",
      text1: "삭제되었습니다",
      position: "bottom",
    });
  };

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
