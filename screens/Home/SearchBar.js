import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme/colors";

export default function SearchBar({ onMenuPress }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
        <Ionicons name="menu" size={24} color="black" />
      </TouchableOpacity>
      <TextInput placeholder="검색어를 입력하세요" style={styles.searchInput} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,

    /* iOS 그림자 설정 */
    shadowColor: theme.gray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,

    /* Android 그림자 설정 */
    elevation: 5,
  },
  menuButton: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 40,
  },
});
