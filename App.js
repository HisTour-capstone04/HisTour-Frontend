import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import MainNavigator from "./navigation/MainNavigator";

import { AuthProvider } from "./contexts/AuthContext";
import { UserLocationProvider } from "./contexts/UserLocationContext";
import { RouteProvider } from "./contexts/RouteContext";
import { ViaProvider } from "./contexts/ViaContext";
import { RouteModeProvider } from "./contexts/RouteModeContext";
import { HeritageNotificationProvider } from "./contexts/HeritageNotificationContext";
import { BookmarkProvider } from "./contexts/BookmarkContext";

/**
 * <메인 컴포넌트>
 * 1. 모든 ContextProvider를 적절한 순서로 감싸 앱 전체에서 상태 관리
 * 2. 제스처 핸들링을 위한 GestureHandlerRootView 제공
 * 3. Toast 메시지 표시를 위한 Toast 컴포넌트 포함
 *
 * Provider 중첩 순서 - 의존성에 따라 결정
 * - UserLocationProvider: 가장 바깥쪽 (다른 모든 기능이 위치 정보에 의존함)
 * - RouteModeProvider: 길찾기 모드 설정
 * - AuthProvider: 사용자 인증 상태 관리
 * - BookmarkProvider: 북마크 기능
 * - HeritageNotificationProvider: 문화재 알림 기능
 * - RouteProvider: 길찾기 경로 정보 관리
 * - ViaProvider: 장바구니 유적지 정보 관리
 **/

export default function App() {
  return (
    <>
      {/* 제스처 핸들링을 위한 루트 뷰 */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Context Provider 중첩 구조 */}
        <UserLocationProvider>
          <RouteModeProvider>
            <AuthProvider>
              <BookmarkProvider>
                <HeritageNotificationProvider>
                  <RouteProvider>
                    <ViaProvider>
                      {/* 메인 네비게이션 컴포넌트 */}
                      <MainNavigator />
                    </ViaProvider>
                  </RouteProvider>
                </HeritageNotificationProvider>
              </BookmarkProvider>
            </AuthProvider>
          </RouteModeProvider>
        </UserLocationProvider>

        {/* 토스트 메시지 컴포넌트 */}
        <Toast />
      </GestureHandlerRootView>
    </>
  );
}
