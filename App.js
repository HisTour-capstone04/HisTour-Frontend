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

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <UserLocationProvider>
        <RouteModeProvider>
          <AuthProvider>
            <RouteProvider>
              <ViaProvider>
                <MainNavigator />
              </ViaProvider>
            </RouteProvider>
          </AuthProvider>
        </RouteModeProvider>
      </UserLocationProvider>
      <Toast />
    </>
  );
}
