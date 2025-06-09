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
import DraggableFlatList from "react-native-draggable-flatlist";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SearchBar() {
  const navigation = useNavigation();
  const {
    routePoints,
    nowStopovers,
    clearRoute,
    reorderPoints,
    removePoint,
    startPoint,
    destination,
  } = useRoute();

  const handleExit = () => {
    Alert.alert("", "길찾기를 종료하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "확인", onPress: clearRoute },
    ]);
  };

  const isRouting = routePoints.length >= 1; // 길찾기 중인지
  const hasDestination = destination != null; // 목적지를 가지고 있는지

  // 목적지가 없을 경우 placeholder 항목 추가
  const visualRoutePoints = hasDestination
    ? routePoints
    : [...routePoints, { id: "placeholder-destination" }];

  return (
    <View style={styles.header}>
      {isRouting ? (
        <View style={[styles.fakeInputWrapper, styles.expandedWrapper]}>
          <View style={styles.destinationContainer}>
            <View style={styles.row}>
              {/* 길찾기 종료 버튼 */}
              <TouchableOpacity onPress={handleExit}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={theme.darkgray}
                  style={styles.icon}
                />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <DraggableFlatList
                  data={visualRoutePoints}
                  scrollEnabled={false}
                  onDragEnd={({ data }) => {
                    // placeholder는 제외하고 순서 저장
                    const cleaned = data.filter(
                      (item) => item.id !== "placeholder-destination"
                    );
                    reorderPoints(cleaned);
                  }}
                  keyExtractor={(item, index) =>
                    item.id?.toString() ?? index.toString()
                  }
                  renderItem={({ item, drag, isActive, index }) => {
                    const isPlaceholder = item.id === "placeholder-destination";

                    if (isPlaceholder) {
                      return (
                        <View style={styles.routeItem}>
                          <Text style={styles.destinationText}>
                            목적지를 선택하세요
                          </Text>
                        </View>
                      );
                    }

                    const isStart = item.id === startPoint?.id;
                    const isEnd = item.id === destination?.id;
                    const isStopover = nowStopovers.some(
                      (p) => p.id === item.id
                    );

                    return (
                      <View
                        style={[
                          styles.routeItem,
                          isEnd && { borderBottomWidth: 0 },
                        ]}
                      >
                        <Text style={styles.locationText}>
                          {item.id === "user"
                            ? "내 위치"
                            : item.name || item.location?.name || "알 수 없음"}
                        </Text>

                        {isStopover && (
                          <TouchableOpacity
                            onPress={() => {
                              const actualIndex = routePoints.findIndex(
                                (p) => p.id === item.id
                              );
                              if (actualIndex !== -1) removePoint(actualIndex);
                            }}
                            style={{ marginLeft: 10 }}
                          >
                            <Ionicons
                              name="remove-circle-outline"
                              size={20}
                              color={theme.darkgray}
                            />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onLongPress={drag}
                          disabled={isActive}
                          style={{ marginLeft: 10 }}
                        >
                          <MaterialCommunityIcons
                            name="drag"
                            size={22}
                            color={theme.darkgray}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.fakeInputWrapper}
          onPress={() => navigation.navigate("Search")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="search"
            size={18}
            color={theme.gray}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.fakeInput}
            placeholder="검색어를 입력하세요"
            placeholderTextColor={theme.gray}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
      )}
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
    fontSize: 16,
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
    fontSize: 16,
    color: theme.bodyblack,
    fontWeight: "500",
    flex: 1,
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.divider,
    marginVertical: 8,
    marginLeft: 5,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.bodyblack,
    marginTop: 2,
    marginLeft: 5,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 1,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
});
