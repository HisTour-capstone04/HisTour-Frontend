import { StyleSheet, Text, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider } from "./contexts/AuthContext";

import HomeScreen from "./screens/Home/HomeScreen";
import DetailScreen from "./components/DetailScreen";
import TmapScreen from "./MapTest";
import MainNavigator from "./navigation/MainNavigator";
import { UserLocationProvider } from "./contexts/UserLocationContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // <StatusBar style="auto" />
    // <HomeScreen />
    //    <TmapScreen />
    <UserLocationProvider>
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </UserLocationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
