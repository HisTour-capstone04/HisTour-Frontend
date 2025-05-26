import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "../../contexts/RouteContext";

export default function SearchBar() {
  const navigation = useNavigation();
  const { routePoints, clearRoute } = useRoute();

  const handleExit = () => {
    Alert.alert("", "길찾기를 종료하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "확인", onPress: clearRoute },
    ]);
  };

  const isRouting = routePoints.length >= 2;

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.fakeInputWrapper, isRouting && styles.expandedWrapper]}
        onPress={() => {
          if (!isRouting) navigation.navigate("Search");
        }}
        activeOpacity={0.8}
      >
        {isRouting ? (
          <View style={styles.destinationContainer}>
            <View style={styles.row}>
              <TouchableOpacity onPress={handleExit}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color="#888"
                  style={styles.icon}
                />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                {routePoints.map((point, idx) => (
                  <React.Fragment key={idx}>
                    <Text style={styles.locationText}>
                      {idx === 0
                        ? "내 위치"
                        : point.name || point.location?.name || "알 수 없음"}
                    </Text>
                    {idx < routePoints.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <>
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
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  fakeInputWrapper: {
    flexDirection: "row",
    alignItems: "flex-start", // 상단 정렬
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12, // 상하 여백 추가
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  fakeInput: {
    flex: 1,
    fontSize: 15,
    color: theme.gray,
  },
  destinationContainer: {
    flex: 1,
    minHeight: 50, // 최소 높이
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
    alignSelf: "center",
  },
  locationText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
    marginLeft: 5,
  },
  destinationText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginTop: 2,
    marginLeft: 5,
  },
});
