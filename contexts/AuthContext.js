import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [username, setUsername] = useState(null);

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
      value={{ accessToken, username, isLoggedIn, login, logout }}
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
