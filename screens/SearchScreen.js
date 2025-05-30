import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useUserLocation } from "../contexts/UserLocationContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import Toast from "react-native-toast-message";

import { useRoute } from "../contexts/RouteContext";

import { TMAP_APP_KEY } from "../config/apiKeys";
const MAX_RECENT_KEYWORDS = 15; // 저장 가능한 최근 검색어 최대 개수

export default function SearchScreen() {
  const { userLocation } = useUserLocation();
  const navigation = useNavigation();
  const { setDestination } = useRoute();

  const [input, setInput] = useState("");
  const debouncedInput = useDebouncedValue(input, 500); // 500ms 후 자동 반영

  const [recentKeywords, setRecentKeywords] = useState([]);
  const [results, setResults] = useState([]);
  const [viewMode, setViewMode] = useState("recent"); // recent or result
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  const requestId = useRef(0); // fetch 요청 번호

  // 자동 검색
  useEffect(() => {
    if (!debouncedInput.trim()) {
      setViewMode("recent"); // 검색어가 비었으면 최근 검색어 보기로 전환
      setResults([]); // 기존 검색 결과도 지움
      return;
    }

    // viewMode를 result로 바꾸고 검색 실행
    setViewMode("result");

    const doSearch = async () => {
      // 이전 결과 비우기
      setResults([]);

      const searchResults = await fetchSearchResults(debouncedInput);

      // 최신 요청만 반영
      if (searchResults !== null) {
        setResults(searchResults);
      }

      console.log(
        debouncedInput +
          "(으)로 검색한 결과: " +
          JSON.stringify(searchResults, ["name"])
      );
    };

    doSearch();
  }, [debouncedInput]);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    const json = await AsyncStorage.getItem("recentKeywords");
    if (json) setRecentKeywords(JSON.parse(json));
  };

  const saveKeyword = async (keyword) => {
    if (!keyword.trim()) return; // 공백만 있는 경우 저장하지 않음

    const updated = [
      keyword,
      ...recentKeywords.filter((k) => k !== keyword),
    ].slice(0, MAX_RECENT_KEYWORDS);
    await AsyncStorage.setItem("recentKeywords", JSON.stringify(updated));
    setRecentKeywords(updated);
  };

  const clearAllKeywords = async () => {
    await AsyncStorage.removeItem("recentKeywords");
    setRecentKeywords([]);
    Toast.show({
      type: "info",
      text1: "최근 검색어 내역이 삭제되었습니다",
      position: "bottom",
    });
  };

  // 유적지 검색
  const fetchSearchResults = async (keyword) => {
    // fetch 요청 번호 설정
    requestId.current += 1;
    const myRequestId = requestId.current; // 해당 건의 요청 번호

    // 로딩 시작
    setIsLoading(true);

    // fetch 과정
    try {
      console.log(keyword + " 검색 시작");
      const response = await fetch(
        `http://192.168.0.15:8080/api/heritages?name=${encodeURIComponent(
          keyword
        )}`
      );
      const result = await response.json();

      // 이 fetch 응답이 가장 최신 요청의 응답이 아니라면 무시
      if (myRequestId !== requestId.current) {
        console.log("무시됨: 이전 요청 도착");
        return null;
      }

      return result.data.heritages || [];
    } catch (error) {
      console.error("검색 오류:", error);
      return [];
    } finally {
      // 로딩 종료
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 입력창 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={"검색어를 입력하세요"}
            returnKeyType="search"
            onSubmitEditing={() => {
              saveKeyword(input);
              Keyboard.dismiss();
            }}
            style={styles.input}
            autoFocus
          />
          {input.length > 0 && (
            <TouchableOpacity
              onPress={() => setInput("")}
              style={styles.clearButton}
            >
              <Ionicons name="close" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 최근 검색어 */}
      {viewMode === "recent" && (
        <FlatList
          data={recentKeywords}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setInput(item); // 검색어로 설정 (자동 검색됨)
                saveKeyword(item); // 최근 검색어로 다시 저장
              }}
            >
              <Text style={styles.keyword}>{item}</Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>최근 검색어</Text>
          }
          ListFooterComponent={
            recentKeywords.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert("", "최근 검색어를 모두 삭제하시겠습니까?", [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: clearAllKeywords,
                    },
                  ]);
                }}
              >
                <Text style={styles.clearAllText}>최근 검색어 삭제</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <Text style={{ padding: 20, textAlign: "center", color: "#999" }}>
              최근 검색어 내역이 없습니다.
            </Text>
          }
        />
      )}

      {/* 검색 결과 */}
      {viewMode === "result" && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                try {
                  saveKeyword(item.name); // 최근 검색어
                  navigation.navigate("Home", { heritage: item });
                } catch (e) {
                  console.error("경로 계산 중 오류:", e);
                  navigation.navigate("Home");
                }
              }}
            >
              <Text style={styles.resultItem}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>검색 결과</Text>
          }
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator
                size="large"
                color="#999"
                style={{ marginTop: 20 }}
              />
            ) : (
              <Text style={{ padding: 20, textAlign: "center", color: "#999" }}>
                검색 결과가 없습니다.
              </Text>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginLeft: 10,
  },
  clearButton: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    height: 40,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "bold",
  },
  keyword: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
  },
  resultItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  clearAllText: {
    textAlign: "center",
    paddingVertical: 15,
    color: "#888",
    fontSize: 14,
  },
});
