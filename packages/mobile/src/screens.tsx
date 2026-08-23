/** Экраны: Onboarding, Home, Subjects, Chat (сократ), Profile. */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, FlatList, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import {
  BookOpen, Flame, GraduationCap, History, Languages, Leaf, Lightbulb,
  MessageCircle, Mic, Send, Sparkles, Target, Trophy, Zap,
} from "lucide-react-native";
import { C, FONT, RADIUS, S, T } from "./theme";
import { AchievementCard, AnimatedProgressBar, PageContainer, PremiumButton, StatBadge, SubjectCard } from "./components";
import { ACHIEVEMENTS, SUBJECTS_DATA, USER_STATS, WEEKLY_POINTS, type SubjectData } from "./data";
import { fetchHistory, sendChat, type ChatMessage } from "../api";

const ICONS = {
  math: <BookOpen size={22} color={C.primaryHover} />,
  physics: <Zap size={22} color={C.primaryHover} />,
  history: <History size={22} color={C.primaryHover} />,
  biology: <Leaf size={22} color={C.primaryHover} />,
  language: <Languages size={22} color={C.primaryHover} />,
  chemistry: <Sparkles size={22} color={C.primaryHover} />,
  cs: <Target size={22} color={C.primaryHover} />,
  english: <MessageCircle size={22} color={C.primaryHover} />,
} as const;

type Lang = "uz" | "ru" | "en";
const UI = {
  greeting: { uz: "Xayrli tong", ru: "Доброе утро", en: "Good morning" },
  points: { uz: "ball", ru: "баллов", en: "points" },
  streak: { uz: "kun ketma-ket", ru: "дней подряд", en: "day streak" },
  mySubjects: { uz: "Fanlarim", ru: "Мои предметы", en: "My subjects" },
  lessons: { uz: "dars", ru: "уроков", en: "lessons" },
  startLearning: { uz: "O'qishni boshlash", ru: "Начать обучение", en: "Start Learning" },
  howItWorks: { uz: "Qanday ishlaydi?", ru: "Как это работает?", en: "How does it work?" },
  smartTitle: { uz: "Aqlli o'quv yordamchisi", ru: "Умный помощник в учёбе", en: "Smart Learning Assistant" },
  smartSub: {
    uz: "Javob bermayman — tushuntiraman. Savollaringizga savollar bilan yo'naltiraman: Sokrat usuli.",
    ru: "Я не даю готовые ответы — я объясняю и веду наводящими вопросами. Метод Сократа.",
    en: "I don't give answers away — I guide you with questions. The Socratic way.",
  },
  chatTitle: { uz: "Sokrat AI-chat", ru: "Socratic AI-чат", en: "Socratic AI Chat" },
  hint: { uz: "Yordam", ru: "Подсказка", en: "Hint" },
  placeholder: { uz: "Javobingizni yozing…", ru: "Напиши свой ответ…", en: "Type your answer…" },
  profile: { uz: "Profil", ru: "Профиль", en: "Profile" },
  achievements: { uz: "Yutuqlar", ru: "Достижения", en: "Achievements" },
  weekly: { uz: "Haftalik ballar", ru: "Баллы за неделю", en: "Weekly points" },
  done: { uz: "bajarilgan darslar", ru: "пройдено уроков", en: "lessons completed" },
  error: { uz: "Xatolik, yana urinib ko'ring 🙏", ru: "Ошибка, попробуй ещё раз 🙏", en: "Something went wrong 🙏" },
};

/* ================= ONBOARDING ================= */
export function OnboardingScreen({ onStart }: { onStart: () => void }) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return loop.stop;
  }, [float]);

  return (
    <PageContainer>
      <View style={st.onbRoot}>
        <View style={st.onbHero}>
          <Animated.View style={[st.onbCircle, { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] }]}>
            <GraduationCap size={72} color={C.primary} />
          </Animated.View>
          <View style={[st.floatChip, { top: 30, left: 40 }]}><BookOpen size={18} color={C.primaryHover} /></View>
          <View style={[st.floatChip, { top: 60, right: 44 }]}><Lightbulb size={18} color={C.primaryHover} /></View>
          <View style={[st.floatChip, { bottom: 46, left: 70 }]}><Zap size={18} color={C.primaryHover} /></View>
        </View>
        <Text style={[T.h1, { fontFamily: FONT.bold, color: C.textPrimary, textAlign: "center" }]}>{UI.smartTitle.ru}</Text>
        <Text style={[T.body, { color: C.textSecondary, textAlign: "center", marginTop: S.sm, paddingHorizontal: S.lg }]}>
          {UI.smartSub.ru}
        </Text>
        <View style={{ marginTop: S.xl, gap: S.sm, width: "100%" }}>
          <PremiumButton title={UI.startLearning.ru} onPress={onStart} />
          <PremiumButton title={UI.howItWorks.ru} variant="ghost" onPress={onStart} />
        </View>
      </View>
    </PageContainer>
  );
}

/* ================= HOME ================= */
export function HomeScreen({ onOpenSubject }: { onOpenSubject: () => void }) {
  return (
    <PageContainer>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <View style={st.homeHeader}>
          <View>
            <Text style={[T.small, { color: C.textSecondary }]}>{UI.greeting.ru} ☀️</Text>
            <Text style={[T.h2, { fontFamily: FONT.bold, color: C.textPrimary }]}>{USER_STATS.name.ru}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: S.sm }}>
            <StatBadge icon="points" value={`${USER_STATS.points} · ${UI.points.ru}`} />
            <StatBadge icon="streak" value={`${USER_STATS.streak} 🔥`} />
          </View>
        </View>

        <Text style={[T.h3, { fontFamily: FONT.semi, color: C.textPrimary, marginBottom: S.sm }]}>{UI.mySubjects.ru}</Text>
        <View style={{ gap: S.md }}>
          {SUBJECTS_DATA.slice(0, 3).map((s) => (
            <SubjectCard
              key={s.id}
              icon={ICONS[s.icon]}
              title={s.title.ru}
              desc={s.desc.ru}
              progress={s.progress}
              lessons={`${s.lessons} ${UI.lessons.ru}`}
              onPress={onOpenSubject}
            />
          ))}
        </View>
      </ScrollView>
    </PageContainer>
  );
}

/* ================= SUBJECTS ================= */
export function SubjectsScreen({ onAsk }: { onAsk: (subjectId: string) => void }) {
  return (
    <PageContainer>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[T.h2, { fontFamily: FONT.bold, color: C.textPrimary, marginBottom: S.md }]}>Предметы</Text>
        <View style={{ gap: S.md }}>
          {SUBJECTS_DATA.map((s: SubjectData) => (
            <SubjectCard
              key={s.id}
              icon={ICONS[s.icon]}
              title={s.title.ru}
              desc={s.desc.ru}
              sample={s.sample.ru}
              progress={s.progress}
              onPress={() => onAsk(s.id)}
            />
          ))}
        </View>
      </ScrollView>
    </PageContainer>
  );
}

/* ================= CHAT (Socratic) ================= */
interface Bubble extends ChatMessage { key: number; blocked?: boolean }

let seq = 0;

export function ChatScreen({ subjectId, userId }: { subjectId?: string; userId?: number | null }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [points, setPoints] = useState(120);
  const listRef = useRef<FlatList<Bubble>>(null);

  const subject = SUBJECTS_DATA.find((s) => s.id === subjectId);

  // Гидрация истории с сервера (если сессия персистентна)
  useEffect(() => {
    if (userId == null) return;
    fetchHistory(userId)
      .then((msgs) => {
        if (msgs.length) {
          setBubbles(msgs.map((m) => ({ ...m, key: ++seq })));
          requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
        }
      })
      .catch(() => undefined);
  }, [userId]);

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    setInput("");
    const mine: Bubble = { key: ++seq, role: "user", content: text };
    setBubbles((p) => [...p, mine]);
    setBusy(true);
    try {
      const history: ChatMessage[] = bubbles.map(({ role, content }) => ({ role, content }));
      const res = await sendChat({
        messages: [...history, { role: "user", content: text }],
        lang: "ru",
        subject: subjectId,
        userId: userId ?? undefined,
      });
      setBubbles((p) => [
        ...p,
        { key: ++seq, role: "assistant", content: res.reply, blocked: Boolean(res.blocked) },
      ]);
      if (!res.blocked && !res.demo) setPoints((v) => v + 5); // геймификация: +5 за ход
    } catch {
      setBubbles((p) => [...p, { key: ++seq, role: "assistant", content: UI.error.ru, blocked: true }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [input, busy, bubbles, subjectId, userId]);

  return (
    <PageContainer>
      {/* Header */}
      <View style={st.chatHeader}>
        <View>
          <Text style={[T.h3, { fontFamily: FONT.semi, color: C.textPrimary }]}>
            {subject ? `${ICONS[subject.icon] ? "" : ""}${subject.title.ru}` : UI.chatTitle.ru}
          </Text>
          <Text style={[T.caption, { color: C.textSecondary }]}>Сократ спрашивает — ты думаешь</Text>
        </View>
        <StatBadge icon="points" value={points} />
      </View>

      {/* Bubbles */}
      <FlatList
        ref={listRef}
        data={bubbles}
        keyExtractor={(b) => String(b.key)}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: S.md, gap: 10 }}
        ListEmptyComponent={
          <View style={st.chatEmpty}>
            <GraduationCap size={48} color={C.primary} />
            <Text style={[T.small, { color: C.textSecondary, textAlign: "center", marginTop: S.sm }]}>
              Задай вопрос по теме — я не дам готовый ответ, но помогу дойти до него самому 😉
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[st.bubble, item.role === "user" ? st.bubbleUser : st.bubbleBot]}>
            <Text style={[T.small, { color: C.textPrimary }]}>
              {item.blocked ? "🛡️ " : ""}{item.content}
            </Text>
          </View>
        )}
      />

      {/* Input */}
      <View style={st.inputRow}>
        <Pressable style={st.roundBtn} onPress={() => send("Дай мне подсказку, я застрял")}>
          <Lightbulb size={20} color={C.primaryHover} />
        </Pressable>
        <TextInput
          style={st.input}
          value={input}
          onChangeText={setInput}
          placeholder={UI.placeholder.ru}
          placeholderTextColor={C.textSecondary}
          multiline
          editable={!busy}
        />
        <Pressable style={st.roundBtn} disabled>
          <Mic size={20} color={C.textSecondary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [st.sendBtn, pressed && { transform: [{ scale: 0.97 }] }, (!input.trim() || busy) && { opacity: 0.4 }]}
          onPress={() => send()}
          disabled={!input.trim() || busy}
        >
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
        </Pressable>
      </View>
    </PageContainer>
  );
}

/* ================= PROFILE ================= */
export function ProfileScreen() {
  const maxPts = Math.max(...WEEKLY_POINTS);
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return (
    <PageContainer>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", gap: S.xs }}>
          <View style={st.avatar}><Text style={[T.h1, { fontFamily: FONT.bold, color: C.primary }]}>О</Text></View>
          <Text style={[T.h2, { fontFamily: FONT.bold, color: C.textPrimary }]}>{USER_STATS.name.ru}</Text>
          <Text style={[T.caption, { color: C.textSecondary }]}>7 класс · уровень «Искатель»</Text>
        </View>

        <View style={st.statsRow}>
          <View style={st.statCard}>
            <Star size={18} color={C.primary} fill={C.primary} />
            <Text style={[T.h3, { fontFamily: FONT.bold, color: C.textPrimary }]}>{USER_STATS.points}</Text>
            <Text style={[T.caption, { color: C.textSecondary }]}>{UI.points.ru}</Text>
          </View>
          <View style={st.statCard}>
            <Flame size={18} color={C.warning} fill={C.warning} />
            <Text style={[T.h3, { fontFamily: FONT.bold, color: C.textPrimary }]}>{USER_STATS.streak}</Text>
            <Text style={[T.caption, { color: C.textSecondary }]}>{UI.streak.ru}</Text>
          </View>
          <View style={st.statCard}>
            <BookOpen size={18} color={C.success} />
            <Text style={[T.h3, { fontFamily: FONT.bold, color: C.textPrimary }]}>{USER_STATS.lessonsDone}</Text>
            <Text style={[T.caption, { color: C.textSecondary }]}>{UI.done.ru}</Text>
          </View>
        </View>

        <View style={[st.chartCard]}>
          <Text style={[T.h3, { fontFamily: FONT.semi, color: C.textPrimary, marginBottom: S.md }]}>{UI.weekly.ru}</Text>
          <View style={st.chartRow}>
            {WEEKLY_POINTS.map((v, i) => (
              <View key={i} style={st.chartCol}>
                <AnimatedProgressBar value={(v / maxPts) * 100} color={i === 5 ? C.primary : C.primaryLight} />
                <Text style={[T.caption, { color: C.textSecondary }]}>{days[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[T.h3, { fontFamily: FONT.semi, color: C.textPrimary, marginVertical: S.sm }]}>{UI.achievements.ru}</Text>
        <View style={st.achieveGrid}>
          {ACHIEVEMENTS.map((a) => (
            <AchievementCard
              key={a.id}
              unlocked={a.unlocked}
              title={a.title.ru}
              desc={a.desc.ru}
              icon={
                a.icon === "trophy" ? <Trophy size={20} color={C.primaryHover} />
                : a.icon === "flame" ? <Flame size={20} color={C.warning} />
                : a.icon === "target" ? <Target size={20} color={C.success} />
                : <Zap size={20} color={C.primary} />
              }
            />
          ))}
        </View>
      </ScrollView>
    </PageContainer>
  );
}

import { Star } from "lucide-react-native";

const st = StyleSheet.create({
  scroll: { padding: S.md, paddingBottom: 110, gap: S.md },
  /* onboarding */
  onbRoot: { flex: 1, alignItems: "center", justifyContent: "center", padding: S.lg, gap: S.md },
  onbHero: { width: 220, height: 220, alignItems: "center", justifyContent: "center", marginBottom: S.md },
  onbCircle: {
    width: 160, height: 160, borderRadius: 999, backgroundColor: C.primaryLight,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  floatChip: {
    position: "absolute", backgroundColor: C.card, borderRadius: 12, padding: 10,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  /* home */
  homeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: S.sm },
  /* chat */
  chatHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: S.md, paddingTop: S.md, paddingBottom: S.sm,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  chatEmpty: { alignItems: "center", marginTop: 90, paddingHorizontal: S.lg, gap: S.sm },
  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderBottomRightRadius: 6 },
  bubbleBot: { alignSelf: "flex-start", backgroundColor: C.primaryLight, borderBottomLeftRadius: 6 },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: S.sm,
    padding: S.sm, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  roundBtn: {
    width: 44, height: 44, borderRadius: 999, backgroundColor: C.bg,
    alignItems: "center", justifyContent: "center",
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: C.bg, borderRadius: RADIUS.btn,
    paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11, fontSize: 15, color: C.textPrimary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 999, backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
  },
  /* profile */
  avatar: {
    width: 88, height: 88, borderRadius: 999, backgroundColor: C.primaryLight,
    alignItems: "center", justifyContent: "center", marginTop: S.md,
  },
  statsRow: { flexDirection: "row", gap: S.sm },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: RADIUS.card, padding: S.md,
    alignItems: "center", gap: 4,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  chartCard: {
    backgroundColor: C.card, borderRadius: RADIUS.card, padding: S.md,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  chartRow: { flexDirection: "row", gap: 6, alignItems: "flex-end" },
  chartCol: { flex: 1, gap: 6, alignItems: "center" },
  achieveGrid: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
});
