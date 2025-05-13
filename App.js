import { StyleSheet, Text, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider } from "./contexts/AuthContext";

import MainNavigator from "./navigation/MainNavigator";
import { UserLocationProvider } from "./contexts/UserLocationContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserLocationProvider>
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </UserLocationProvider>
  );
}
