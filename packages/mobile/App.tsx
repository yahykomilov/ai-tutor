/**
 * AI Tutor — корень приложения: шрифты Inter → онбординг → 4 таба.
 * Сессия персистентная (AsyncStorage): история ученика переживает рестарты.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Pressable, StatusBar, StyleSheet, Text, View,
} from "react-native";
import { BookOpen, Home, MessageCircle, User } from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { C, FONT, S } from "./src/theme";
import { ensureSession, type SessionInfo } from "./api";
import { ChatScreen, HomeScreen, OnboardingScreen, ProfileScreen, SubjectsScreen } from "./src/screens";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

type Tab = "home" | "subjects" | "chat" | "profile";

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Главная", icon: Home },
  { id: "subjects", label: "Предметы", icon: BookOpen },
  { id: "chat", label: "AI Чат", icon: MessageCircle },
  { id: "profile", label: "Профиль", icon: User },
];

/** SafeAreaProvider обязателен: useSafeAreaInsets работает только внутри него. */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [started, setStarted] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [chatSubject, setChatSubject] = useState<string | undefined>(undefined);
  const [session, setSession] = useState<SessionInfo>({ userId: null, token: null });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  useEffect(() => {
    ensureSession("ru").then(setSession).catch(() => undefined);
  }, []);

  const openSubjectInChat = useCallback((subjectId: string) => {
    setChatSubject(subjectId);
    setTab("chat");
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      {!started ? (
        <OnboardingScreen onStart={() => setStarted(true)} />
      ) : (
        <View style={{ flex: 1 }}>
          {tab === "home" && <HomeScreen userId={session.userId} onOpenSubject={() => setTab("subjects")} />}
          {tab === "subjects" && <SubjectsScreen onAsk={openSubjectInChat} />}
          {tab === "chat" && <ChatScreen subjectId={chatSubject} userId={session.userId} />}
          {tab === "profile" && <ProfileScreen userId={session.userId} />}

          {/* Bottom Navigation — insets.bottom: не наезжаем на панель жестов Android */}
          <View style={[st.nav, { paddingBottom: Math.max(insets.bottom, 8) + 10 }]}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              const center = id === "chat";
              return (
                <Pressable
                  key={id}
                  onPress={() => setTab(id)}
                  style={({ pressed }) => [
                    st.navItem,
                    center && st.navItemCenter,
                    active && st.navItemActive,
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  <Icon size={center ? 22 : 20} color={active ? "#fff" : C.textSecondary} />
                  <Text style={[st.navLabel, active && { color: "#fff" }, center && !active && { color: C.primary }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  nav: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: 18,
    paddingTop: 8,
    paddingHorizontal: S.sm,
    gap: 4,
  },
  navItem: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 2,
    paddingVertical: 6, borderRadius: 14, minHeight: 52,
  },
  navItemCenter: { backgroundColor: C.primaryLight },
  navItemActive: { backgroundColor: C.primary },
  navLabel: { fontSize: 11, color: C.textSecondary, fontWeight: "600" },
});
