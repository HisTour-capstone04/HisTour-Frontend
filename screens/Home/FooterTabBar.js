// FooterTabBar.js
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme/colors";

export default function FooterTabBar({ currentTab, onTabPress }) {
  const tabs = [
    { key: "nearby", label: "주변 정보", icon: "location" },
    { key: "directions", label: "길찾기", icon: "navigate" },
    { key: "bookmark", label: "북마크", icon: "bookmark" },
    { key: "myPage", label: "마이", icon: "person" },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onTabPress(tab.key)}
          style={styles.tabItem}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={currentTab === tab.key ? theme.main_blue : theme.gray}
          />
          <Text
            style={[
              styles.label,
              currentTab === tab.key && { color: theme.main_blue },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,

    /* iOS 그림자 설정 */
    shadowColor: theme.gray,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,

    /* Android 그림자 설정 */
    elevation: 5,
  },
  tabItem: {
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: theme.gray,
    marginTop: 5,
  },
});
