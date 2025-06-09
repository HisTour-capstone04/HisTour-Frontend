import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import { useHeritageNotification } from "../contexts/HeritageNotificationContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme/colors";

const ConfigScreen = () => {
  const navigation = useNavigation();
  const { isEnabled, setIsEnabled } = useHeritageNotification();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.black} />
        </TouchableOpacity>

        <Text style={styles.title}>설정</Text>

        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>내 주변 유적지 알림 받기</Text>
          <Switch
            trackColor={{ false: "#767577", true: theme.main_blue }}
            thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
            onValueChange={setIsEnabled}
            value={isEnabled}
          />
        </View>
        <Text style={styles.settingDescription}>
          5분마다 주변 1km 내의 유적지를 확인하여 알림을 보냅니다
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bluegray,
  },
  header: {
    backgroundColor: "white",
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.black,
  },
  content: {
    padding: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  settingText: {
    fontSize: 16,
    color: theme.black,
  },
  settingDescription: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
    marginTop: 2,
  },
});

export default ConfigScreen;
