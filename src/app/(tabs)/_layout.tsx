import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

import { useCart } from "@/providers/cart";
import { fonts, palette } from "@/theme";

export default function TabsLayout() {
  const { count } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.body,
          fontSize: 9,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          marginBottom: Platform.OS === "android" ? 4 : 0,
        },
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.line,
          height: Platform.OS === "android" ? 66 : undefined,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: "Archive",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          title: "Bag",
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" size={size} color={color} />,
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: palette.terracotta, fontSize: 9 },
        }}
      />
    </Tabs>
  );
}
