import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { AuthContext } from "../../../contexts/AuthContext";

export default function BookmarkPanel() {
  const { username, isLoggedIn } = useContext(AuthContext);

  return (
    <View>
      <Text style={styles.text}>
        {isLoggedIn
          ? `${username}님의 북마크 목록`
          : "로그인하셔야 이용 가능합니다"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: "#333",
  },
});
