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
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Config" component={ConfigScreen} />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ animation: "none" }}
          />
          <Stack.Screen
            name="Chatbot"
            component={ChatbotScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="ChatbotConfig"
            component={ChatbotConfigScreen}
            options={{ animation: "slide_from_right" }}
          />
        </Stack.Navigator>
      </HeritageNotificationProvider>
    </NavigationContainer>
  );
}
