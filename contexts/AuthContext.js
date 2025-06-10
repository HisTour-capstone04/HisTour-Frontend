import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { IP_ADDRESS } from "../config/apiKeys";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // 추천 유적지 불러오기
  const fetchRecommendations = async (userLocation) => {
    try {
      if (!accessToken || !userLocation) return;
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
      if (data.data && data.data.recommendations) {
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error("추천 유적지 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedAccessToken = await AsyncStorage.getItem("accessToken");
        const savedUsername = await AsyncStorage.getItem("username");
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

  const login = async (username, accessToken) => {
    try {
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("username", username);
      setAccessToken(accessToken);
      setUsername(username);
    } catch (e) {
      console.log("로그인 실패:", e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("username");
      setAccessToken(null);
      setUsername(null);
      setRecommendations([]);
      Toast.show({
        type: "success",
        text1: "로그아웃 되었습니다",
        position: "bottom",
      });
    } catch (e) {
      console.log("로그아웃 실패:", e);
    }
  };

  const isLoggedIn = !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        username,
        isLoggedIn,
        login,
        logout,
        recommendations,
        fetchRecommendations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
