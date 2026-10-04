import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/providers/auth";
import { CartProvider } from "@/providers/cart";
import { CatalogProvider } from "@/providers/catalog";
import { SavedProvider } from "@/providers/saved";
import { palette } from "@/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CatalogProvider>
          <AuthProvider>
            <CartProvider>
              <SavedProvider>
                <StatusBar style="dark" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: palette.canvas },
                  }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="product/[slug]" />
                  <Stack.Screen name="checkout" />
                  <Stack.Screen name="account" />
                  <Stack.Screen
                    name="login"
                    options={{ presentation: "modal", animation: "slide_from_bottom" }}
                  />
                </Stack>
              </SavedProvider>
            </CartProvider>
          </AuthProvider>
        </CatalogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
