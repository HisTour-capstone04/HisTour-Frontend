import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useUserLocation } from "./UserLocationContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { AuthContext } from "./AuthContext";
import { IP_ADDRESS } from "../config/apiKeys";

const HeritageContext = createContext();

export function HeritageProvider({ children, range }) {
  const { userLocation } = useUserLocation();
  const [heritages, setHeritages] = useState([]);
  const [lastFetchedLocation, setLastFetchedLocation] = useState(null);

  const { accessToken } = useContext(AuthContext);
  const debouncedRange = useDebouncedValue(range, 300); // debounce 처리 (300ms동안 슬라이더 변화 없을 경우 range 설정)

  const requestId = useRef(0); // fetch 요청 번호
  const currentRequestId = useRef(0); // 최신 요청 번호

  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  // 거리 계산 함수 (Haversine 공식)
  const getDistance = (loc1, loc2) => {
    if (!loc1 || !loc2) return Infinity;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371e3;
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

  // 유적지 fetch 해오기
  const fetchNearbyHeritages = async () => {
    // 사용자 위치 정의 안 됐을 경우 중단
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.log("context - userLocation이 아직 준비되지 않음, fetch 중단");
      return;
    }

    // fetch 요청 번호 설정
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

      // 이 fetch 응답이 가장 최신 요청의 응답이 아니라면 무시
      if (currentRequestId.current !== myRequestId) {
        console.log("무시됨: 이전 요청 도착");
        return;
      }

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
      value={{ heritages, fetchNearbyHeritages, getDistance, isLoading }}
    >
      {children}
    </HeritageContext.Provider>
  );
}

export const useHeritages = () => useContext(HeritageContext);
