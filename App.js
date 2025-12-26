import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./screens/loginscreen";
import HomeScreen from "./screens/homescreen";
import GroupDetailsScreen from "./screens/GroupDetailsScreen";
import { getMe } from "./services/api";
import {
  connectSocket,
  disconnectSocket,
} from "./services/socket";
import Splash from "./screens/splash";
import * as SplashScreen from "expo-splash-screen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!user) return;
  
    connectSocket((data) => {
      if (data.event === "ITEM_CREATED") {
        console.log("socket event:", data);
      }
    });
  
    return () => disconnectSocket();
  }, [user]);
  
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (token) {
          const me = await getMe();
          setUser(me);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        await AsyncStorage.removeItem("token");
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    boot();
  }, []);

  if (!appReady) {
    return <Splash />;
  }
  

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    onSignup={setUser}
                  />
                )}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="Home">
                  {(props) => (
                    <HomeScreen
                      {...props}
                      user={user}
                      reloadUser={setUser}
                      onLogout={async () => {
                        await AsyncStorage.removeItem("token");
                        setUser(null);
                      }}
                    />
                  )}
                </Stack.Screen>

                <Stack.Screen
                  name="Group"
                  component={GroupDetailsScreen}
                  options={{ headerShown: true, title: "Items" }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
