import { StyleSheet, Text, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./screens/Home/HomeScreen";
import DetailScreen from "./components/DetailScreen";
import TmapScreen from "./MapTest";
import MainNavigator from "./navigation/MainNavigator";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // <StatusBar style="auto" />
    // <HomeScreen />
    //    <TmapScreen />
    <MainNavigator />
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
