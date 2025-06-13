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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 외부 라이브러리 import
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// 내부 컴포넌트 및 유틸리티 import
import { theme } from "../theme/colors";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

// 서버 주소 상수
import { IP_ADDRESS } from "../config/apiKeys";

// 저장 가능한 최근 검색어 최대 개수 상수
const MAX_RECENT_KEYWORDS = 15;

/**
 * 검색 화면 컴포넌트
 *
 * 주요 기능 :
 * 1. 유적지 검색 기능 (디바운싱을 통한 실시간 검색)
 * - 검색 버튼을 누르지 않아도 입력값이 500ms 동안 변경되지 않으면(디바운싱) 자동으로 검색 실행
 *
 * 2. 최근 검색어 저장 및 관리
 * - 최근 검색어 저장 기준: 키보드의 검색 버튼 클릭 or 검색 결과 클릭
 *
 */
export default function SearchScreen() {
  const navigation = useNavigation();

  const [input, setInput] = useState("");
  const debouncedInput = useDebouncedValue(input, 500); // 500ms 후 자동 반영 (디바운싱)

  const [recentKeywords, setRecentKeywords] = useState([]); // 최근 검색어 목록 배열
  const [results, setResults] = useState([]); // 검색 결과 목록 배열
  const [viewMode, setViewMode] = useState("recent"); // recent(최근 검색어) or result(검색 결과) 모드 관리
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  const requestId = useRef(0); // fetch 요청 번호

  // 디바운싱된 입력값에 따라 자동 검색 (검색 버튼을 누르지 않아도 자동으로 검색 실행)
  useEffect(() => {
    if (!debouncedInput.trim()) {
      setViewMode("recent"); // 검색어가 비었으면 최근 검색어 보기로 전환
      setResults([]); // 기존 검색 결과도 지움
      return;
    }

    // viewMode를 result로 바꾸고 검색 실행
    setViewMode("result");

    // 검색 실행 메서드
    const doSearch = async () => {
      setResults([]); // 기존 검색 결과 비우기
      const searchResults = await fetchSearchResults(debouncedInput); // 검색 결과 요청

      // 최신 요청만 반영 (이전 요청의 결과는 무시)
      if (searchResults !== null) {
        setResults(searchResults);
      }
    };

    doSearch(); // 검색 실행
  }, [debouncedInput]);

  // 컴포넌트 마운트 시 최근 검색어 불러오기
  useEffect(() => {
    loadKeywords();
  }, []);

  // AsyncStorage에서 최근 검색어 불러오기 메서드
  const loadKeywords = async () => {
    const json = await AsyncStorage.getItem("recentKeywords");
    if (json) setRecentKeywords(JSON.parse(json));
  };

  // 검색어를 최근 검색어로 저장하는 메서드 (저장 기준: 키보드의 검색 버튼 클릭 or 검색 결과 클릭)
  const saveKeyword = async (keyword) => {
    if (!keyword.trim()) return; // 공백만 있는 경우 저장하지 않음

    // 최근 검색어 목록 업데이트 (중복 제거 후 최대 개수 제한)
    const updated = [
      keyword,
      ...recentKeywords.filter((k) => k !== keyword),
    ].slice(0, MAX_RECENT_KEYWORDS);
    await AsyncStorage.setItem("recentKeywords", JSON.stringify(updated));
    setRecentKeywords(updated);
  };

  // 모든 최근 검색어 삭제 메서드
  const clearAllKeywords = async () => {
    await AsyncStorage.removeItem("recentKeywords");
    setRecentKeywords([]);
    Toast.show({
      type: "info",
      text1: "최근 검색어 내역이 삭제되었습니다",
      position: "bottom",
    });
  };

  //  유적지 검색 메서드
  const fetchSearchResults = async (keyword) => {
    requestId.current += 1; // fetch 요청 번호 설정
    const myRequestId = requestId.current; // 해당 건의 요청 번호

    setIsLoading(true); // 로딩 시작

    // 서버에 유적지 검색 요청
    try {
      const response = await fetch(
        "http://" +
          IP_ADDRESS +
          `:8080/api/heritages?name=${encodeURIComponent(keyword)}`
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
      {/* 상단 검색 입력창 */}
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
              saveKeyword(input); // 키보드의 검색 버튼 클릭 시 최근 검색어로 저장
              Keyboard.dismiss();
            }}
            style={styles.input}
            autoFocus
          />
          {/* 입력값이 있을 때만 표시되는 삭제 버튼 */}
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

      {/* 최근 검색어 목록 */}
      {viewMode === "recent" && (
        <FlatList
          data={recentKeywords}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setInput(item); // 검색어로 설정 (자동 검색됨)
                saveKeyword(item); // 최근 검색어 클릭 시 최근 검색어로 다시 저장
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
            <Text
              style={{ padding: 20, textAlign: "center", color: theme.gray }}
            >
              최근 검색어 내역이 없습니다.
            </Text>
          }
        />
      )}

      {/* 검색 결과 목록 */}
      {viewMode === "result" && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                try {
                  saveKeyword(item.name); // 검색 결과 클릭 시 최근 검색어로 저장
                  navigation.goBack();
                  navigation.navigate("Home", { heritage: item });
                } catch (e) {
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

// 스타일 정의
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
    borderColor: theme.gray,
    marginLeft: 10,
  },
  clearButton: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    height: 40,
    fontSize: 16,
    color: theme.bodyblack,
  },
  sectionTitle: {
    marginTop: 15,
    marginBottom: 10,
    marginLeft: 30,
    fontSize: 18,
    fontWeight: "bold",
    color: theme.black,
  },
  keyword: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderBottomColor: theme.divider,
    borderBottomWidth: 1,
    fontSize: 16,
    color: theme.bodyblack,
  },
  resultItem: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderBottomColor: theme.divider,
    borderBottomWidth: 1,
    fontSize: 16,
    color: theme.bodyblack,
  },
  clearAllText: {
    textAlign: "center",
    paddingVertical: 15,
    color: theme.gray,
    fontSize: 14,
  },
});
