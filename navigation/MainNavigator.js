import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import ConfigScreen from "../screens/ConfigScreen";
import { HeritageNotificationProvider } from "../contexts/HeritageNotificationContext";

import HomeScreen from "../screens/Home/HomeScreen";
import AuthScreen from "../screens/AuthScreen";
import SearchScreen from "../screens/SearchScreen";
import ChatbotScreen from "../screens/ChatbotScreen";
import ChatbotConfigScreen from "../screens/ChatbotConfigScreen";

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <HeritageNotificationProvider>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            id: "main-stack",
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} id="home-screen" />
          <Stack.Screen
            name="Config"
            component={ConfigScreen}
            id="config-screen"
          />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ animation: "slide_from_bottom" }}
            id="auth-screen"
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ animation: "none" }}
            id="search-screen"
          />
          <Stack.Screen
            name="Chatbot"
            component={ChatbotScreen}
            options={{ animation: "slide_from_right" }}
            id="chatbot-screen"
          />
          <Stack.Screen
            name="ChatbotConfig"
            component={ChatbotConfigScreen}
            options={{ animation: "slide_from_right" }}
            id="chatbot-config-screen"
          />
        </Stack.Navigator>
      </HeritageNotificationProvider>
    </NavigationContainer>
  );
}
