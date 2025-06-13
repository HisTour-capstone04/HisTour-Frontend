import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

// 내부 컨텍스트 및 유틸리티 import
import { useUserLocation } from "./UserLocationContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { AuthContext } from "./AuthContext";

// 서버 주소 상수
import { IP_ADDRESS } from "../config/apiKeys";

// 유적지 컨텍스트 생성
const HeritageContext = createContext();

/**
 * 유적지 프로바이더 컴포넌트
 * 주요 기능:
 * 1. 사용자 현재 위치 중심 range 내 있는 유적지 목록 관리 (range 디바운싱 적용)
 * 2. 사용자 위치 이동 시 자동으로 근처 유적지 목록 업데이트
 */
export function HeritageProvider({ children, range }) {
  const { accessToken } = useContext(AuthContext);
  const { userLocation } = useUserLocation();

  // 유적지 상태 관리
  const [heritages, setHeritages] = useState([]); // 유적지 목록
  const [lastFetchedLocation, setLastFetchedLocation] = useState(null); // 유적지 목록을 마지막으로 불러온 사용자 위치
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  // 범위 설정 디바운싱 처리 (300ms동안 슬라이더 변화 없을 경우 range 설정)
  const debouncedRange = useDebouncedValue(range, 300);

  // 요청 관리용 ref
  const requestId = useRef(0); // fetch 요청 번호
  const currentRequestId = useRef(0); // 최신 요청 번호

  // 거리 계산 함수 (Haversine 공식)
  const getDistance = (loc1, loc2) => {
    if (!loc1 || !loc2) return Infinity;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371e3; // 지구 반지름 (미터)
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const lat1 = toRad(loc1.latitude);
    const lat2 = toRad(loc2.latitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 유적지 fetch 메서드
  const fetchNearbyHeritages = async () => {
    // 사용자 위치 정의 안 됐을 경우 중단
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.log("context - userLocation이 아직 준비되지 않음, fetch 중단");
      return;
    }

    // fetch 요청 번호 설정 (중복 요청 방지)
    requestId.current += 1;
    const myRequestId = requestId.current; // 해당 건의 요청 번호
    currentRequestId.current = myRequestId; // 가장 최신 요청 번호

    // 토큰 없으면 요청 중단
    if (!accessToken) {
      console.warn("context: 토큰 없음 → 요청 중단");
      return;
    }

    // 로딩 시작
    setIsLoading(true);

    // fetch 과정
    try {
      console.log("context: 유적지 fetch 시작");

      // 서버에 근처 유적지 요청
      const response = await fetch(
        "http://" +
          IP_ADDRESS +
          `:8080/api/heritages/nearby?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&radius=${debouncedRange}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();
      console.log(result);
      const list = result?.data?.heritages ?? [];

      // 이 fetch 응답이 가장 최신 요청의 응답이 아니라면 무시 (중복 응답 방지)
      if (currentRequestId.current !== myRequestId) {
        console.log("무시됨: 이전 요청 도착");
        return;
      }

      // 유적지 목록 업데이트
      setHeritages(list);

      console.log("context - 유적지 " + result?.data?.count + "개 불러옴");
      console.log(
        "context - 유적지 목록: " +
          JSON.stringify(result.data.heritages, ["id"])
      );
    } catch (e) {
      console.error("context - 유적지 fetch 실패:", e);
    } finally {
      // 로딩 종료
      setIsLoading(false);
    }
  };

  // 사용자 위치 변경 시 유적지 fetch
  useEffect(() => {
    // 사용자 위치가 아직 준비되지 않은 경우 탈출
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.log("context - userLocation이 아직 준비되지 않음");
      return;
    }

    console.log(
      "context - 위치 변경됨: " + userLocation.latitude,
      userLocation.longitude
    );

    // 50m 이상 이동 시에만 fetch 실행 (불필요한 API 호출 방지)
    if (
      !lastFetchedLocation || // lastFetchedLocation이 정의되지 않은 경우 (=최초) 에도 fetch 실행
      getDistance(userLocation, lastFetchedLocation) > 50 // 50m 이상 이동 시에만 fetch 실행
    ) {
      fetchNearbyHeritages();
      setLastFetchedLocation(userLocation);
    } else {
      console.log("context - 위치 변화 거의 없음, fetch 실행 X");
    }
  }, [userLocation]);

  // debouncedRange 변경 시 유적지 fetch
  useEffect(() => {
    // 사용자 위치가 아직 준비되지 않은 경우 탈출
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return;
    }
    console.log("context: debouncedRange 변경됨: " + debouncedRange);
    fetchNearbyHeritages();
  }, [debouncedRange]);

  return (
    <HeritageContext.Provider
      value={{
        // 유적지 데이터
        heritages,
        isLoading,

        // 유적지 관련 메서드
        fetchNearbyHeritages,
        getDistance,
      }}
    >
      {children}
    </HeritageContext.Provider>
  );
}

// 유적지 컨텍스트 사용을 위한 커스텀 훅
export const useHeritages = () => useContext(HeritageContext);
