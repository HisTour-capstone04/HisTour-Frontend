import { StyleSheet, Text, View, Button } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { AuthProvider } from "./contexts/AuthContext";
import MainNavigator from "./navigation/MainNavigator";
import { UserLocationProvider } from "./contexts/UserLocationContext";
import { RouteProvider } from "./contexts/RouteContext";
import { ViaProvider } from "./contexts/ViaContext.js";
import { RouteModeProvider } from "./contexts/RouteModeContext.js";
import "./tasks/UserLocationTask";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BookmarkProvider } from "./contexts/BookmarkContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <UserLocationProvider>
          <RouteModeProvider>
            <AuthProvider>
              <BookmarkProvider>
                <RouteProvider>
                  <ViaProvider>
                    <MainNavigator />
                  </ViaProvider>
                </RouteProvider>
              </BookmarkProvider>
            </AuthProvider>
          </RouteModeProvider>
        </UserLocationProvider>
        <Toast />
      </GestureHandlerRootView>
    </>
  );
}
