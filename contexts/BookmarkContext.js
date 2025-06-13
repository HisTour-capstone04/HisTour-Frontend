import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

// 외부 라이브러리 import
import Toast from "react-native-toast-message";

// 내부 컴포넌트 및 유틸리티 import
import { AuthContext } from "./AuthContext";

// 서버 주소 상수
import { IP_ADDRESS } from "../config/apiKeys";

// 사용자 북마크 컨텍스트 생성
export const BookmarkContext = createContext();

/**
 * 사용자 북마크 프로바이더 컴포넌트
 * 주요 기능:
 * 1. 사용자 북마크 유적지 목록 관리 (추가/삭제)
 * 2. 지도 마커와 북마크 상태 동기화
 */
export const BookmarkProvider = ({ children }) => {
  const { accessToken } = useContext(AuthContext);

  // 북마크 상태 관리
  const [bookmarks, setBookmarks] = useState([]); // 북마크 유적지 목록 배열
  const [loading, setLoading] = useState(true); // 로딩 상태
  const mapRef = useRef(null); // 지도 WebView 참조

  // 북마크 목록 업데이트 메서드
  const fetchBookmarks = async () => {
    // 토큰 없으면 요청 중단
    if (!accessToken) {
      console.warn("context: 토큰 없음 → 요청 중단");
      return;
    }

    try {
      // 서버에서 북마크 목록 조회
      const response = await fetch(
        "http://" + IP_ADDRESS + ":8080/api/bookmarks",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("북마크 조회 response:", response.status);

      const json = await response.json();
      if (response.ok) {
        // 응답 성공 시 북마크 목록 업데이트
        setBookmarks(json.data.heritages || []);
      } else {
        console.error("북마크 조회 실패:", json.responseMessage);
      }
    } catch (e) {
      console.error("북마크 조회 에러:", e);
    }
  };

  // 북마크 등록 메서드
  const addBookmark = async (heritageId) => {
    // 토큰 없으면 요청 중단
    if (!accessToken) {
      console.warn("context: 토큰 없음 → 요청 중단");
      return;
    }

    try {
      // 서버에 북마크 추가 요청
      const response = await fetch(
        "http://" + IP_ADDRESS + ":8080/api/bookmarks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ heritageId }),
        }
      );

      const json = await response.json();

      // 북마크 목록 갱신
      if (response.ok) {
        try {
          await fetchBookmarks();
        } catch (e) {
          console.warn("북마크 목록 갱신 실패:", e);
        }
        Toast.show({
          type: "success",
          text1: "북마크에 추가되었습니다",
          position: "bottom",
        });
      } else {
        Toast.show({
          type: "error",
          text1: json.responseMessage || "북마크 추가 실패",
          position: "bottom",
        });
      }
    } catch (e) {
      console.error("북마크 추가 에러:", e);
      Toast.show({ type: "error", text1: "네트워크 오류", position: "bottom" });
    }
  };

  // 북마크 삭제 메서드
  const removeBookmark = async (heritageId) => {
    // 삭제할 북마크 찾기
    const bookmark = bookmarks.find((b) => b.id && b.id === heritageId);
    console.log(bookmark.id);
    if (!bookmark) {
      console.warn("해당 heritageId를 가진 북마크가 존재하지 않음");
      return;
    }

    // 토큰 없으면 요청 중단
    if (!accessToken) {
      console.warn("context: 토큰 없음 → 요청 중단");
      return;
    }

    try {
      // 서버에 북마크 삭제 요청
      const response = await fetch(
        "http://" + IP_ADDRESS + ":8080/api/bookmarks",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ bookmarkId: bookmark.id }),
        }
      );

      const json = await response.json();
      if (response.ok) {
        try {
          await fetchBookmarks();
        } catch (e) {
          console.warn("북마크 목록 갱신 실패:", e);
        }
        Toast.show({
          type: "success",
          text1: "북마크에서 삭제되었습니다",
          position: "bottom",
        });
      } else {
        Toast.show({
          type: "error",
          text1: json.responseMessage || "삭제 실패",
          position: "bottom",
        });
      }
    } catch (e) {
      console.error("북마크 삭제 에러:", e);
      Toast.show({ type: "error", text1: "네트워크 오류", position: "bottom" });
    }
  };

  // 북마크 데이터가 변경될 때마다 지도에 반영 (북마크한 유적지는 북마크 마커로 지도에 표시)
  useEffect(() => {
    if (mapRef.current && bookmarks.length > 0) {
      // 지도 WebView에 북마크 마커 표시 메시지 전송
      mapRef.current.postMessage(
        JSON.stringify({
          type: "SHOW_BOOKMARK_MARKERS",
          payload: bookmarks,
        })
      );
    }
  }, [bookmarks]);

  // 인증 토큰이 변경될 때마다 북마크 목록 업데이트
  useEffect(() => {
    if (!accessToken) return; // 로그인 상태일 때만 북마크 업데이트
    fetchBookmarks();
  }, [accessToken]);

  return (
    <BookmarkContext.Provider
      value={{
        // 북마크 상태
        bookmarks,
        loading,

        // 북마크 관련 메서드
        fetchBookmarks,
        addBookmark,
        removeBookmark,

        // 지도 연동
        mapRef,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};

// 북마크 컨텍스트 사용을 위한 커스텀 훅
export const useBookmark = () => useContext(BookmarkContext);
