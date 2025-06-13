import React, { createContext, useState, useEffect, useContext } from "react";

// 외부 라이브러리 import
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// 서버 주소 상수
import { IP_ADDRESS } from "../config/apiKeys";

// 사용자 인증 컨텍스트 생성
export const AuthContext = createContext();

/**
 * 사용자 인증 프로바이더 컴포넌트
 * 주요 기능:
 * 1. 사용자 로그인/로그아웃 상태 관리
 * 2. 액세스 토큰 및 사용자명 AsyncStorage 저장/복원
 * 3. 사용자 맞춤 추천 유적지 조회 및 관리
 */
export const AuthProvider = ({ children }) => {
  // 인증 상태 관리
  const [accessToken, setAccessToken] = useState(null); // 서버 액세스 토큰
  const [username, setUsername] = useState(null); // 사용자명
  const [recommendations, setRecommendations] = useState([]); // 사용자 맞춤 추천 유적지 목록

  // 사용자 맞춤 추천 유적지 조회 메서드
  const fetchRecommendations = async (userLocation) => {
    try {
      // 토큰이나 위치 정보가 없으면 조회하지 않음
      if (!accessToken || !userLocation) return;

      console.log("추천 유적지 불러오기 시작");

      // 서버에 추천 유적지 요청
      const response = await fetch(
        `http://${IP_ADDRESS}:8080/api/heritages/recommend?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      // 응답 데이터에서 추천 목록 추출하여 상태 업데이트
      if (data.data && data.data.recommendations) {
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error("추천 유적지 불러오기 실패:", error);
    }
  };

  // 앱 시작 시 저장된 인증 정보 복원
  useEffect(() => {
    const loadAuth = async () => {
      try {
        // AsyncStorage에서 저장된 토큰과 사용자명 조회
        const savedAccessToken = await AsyncStorage.getItem("accessToken");
        const savedUsername = await AsyncStorage.getItem("username");

        // 토큰이 있으면 인증 상태 복원
        if (savedAccessToken) {
          setAccessToken(savedAccessToken);
          setUsername(savedUsername);
        }
      } catch (e) {
        console.log("로그인 상태 복원 실패:", e);
      }
    };
    loadAuth();
  }, []);

  // 사용자 로그인 메서드
  const login = async (username, accessToken) => {
    try {
      // AsyncStorage에 인증 정보 저장
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("username", username);

      // 상태 업데이트
      setAccessToken(accessToken);
      setUsername(username);
    } catch (e) {
      console.log("로그인 실패:", e);
    }
  };

  // 사용자 로그아웃 메서드
  const logout = async () => {
    try {
      // AsyncStorage에서 인증 정보 삭제
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("username");

      // 상태 초기화
      setAccessToken(null);
      setUsername(null);
      setRecommendations([]);

      // 로그아웃 완료 알림
      Toast.show({
        type: "success",
        text1: "로그아웃 되었습니다",
        position: "bottom",
      });
    } catch (e) {
      console.log("로그아웃 실패:", e);
    }
  };

  // 로그인 상태 계산 (토큰 존재 여부로 판단)
  const isLoggedIn = !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        // 인증 상태
        accessToken,
        username,
        isLoggedIn,

        // 인증 관련 메서드
        login,
        logout,

        // 사용자 맞춤 추천 유적지 관련
        recommendations,
        fetchRecommendations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 인증 컨텍스트 사용을 위한 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
