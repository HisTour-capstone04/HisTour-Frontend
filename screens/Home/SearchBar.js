import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";

export default function SearchBar() {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => console.log("메뉴 버튼")}
      >
        <Ionicons name="menu" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fakeInputWrapper}
        onPress={() => navigation.navigate("Search")}
        activeOpacity={0.8}
      >
        <Ionicons
          name="search"
          size={18}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.fakeInput}
          placeholder="검색어를 입력하세요"
          placeholderTextColor="#888"
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
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
    shadowColor: theme.gray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  iconButton: {
    padding: 6,
    marginRight: 10,
  },
  fakeInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  fakeInput: {
    flex: 1,
    fontSize: 15,
    color: "#444",
  },
});
