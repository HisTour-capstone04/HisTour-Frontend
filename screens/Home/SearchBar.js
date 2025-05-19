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
  const { destination, setDestination } = useRoute(); // 목적지 정보

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.fakeInputWrapper, destination && styles.expandedWrapper]}
        onPress={() => {
          if (!destination) navigation.navigate("Search");
        }}
        activeOpacity={0.8}
      >
        {destination ? (
          <View style={styles.destinationContainer}>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("", "길찾기를 종료하시겠습니까?", [
                    { text: "취소", style: "cancel" },
                    {
                      text: "확인",
                      onPress: () => setDestination(null),
                    },
                  ])
                }
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color="#888"
                  style={styles.icon}
                />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationText}>내 위치</Text>
                <View style={styles.divider} />
                <Text style={styles.destinationText}>{destination.name}</Text>
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
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 8,
  },

  expandedWrapper: {
    height: 90, // destination 있을 때 커지는 높이
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
  },
  row: {
    flexDirection: "row",
    alignItems: "center", // 아이콘 + 텍스트 수직 가운데 정렬
  },
  icon: {
    marginRight: 10,
    alignSelf: "center", // 아이콘을 카드 중앙에
  },
  locationText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    marginBottom: 2,
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  destinationText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginTop: 2,
    marginLeft: 5,
  },
});
