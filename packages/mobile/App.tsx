/**
 * AI Tutor — мобильный чат (Expo Go / React Native).
 * Палитра: #464858 фон, #A56F63 акцент, #D99B7F вторичный.
 * Сервер: packages/server (см. config.ts — API_URL).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "./config";
import { createSession, sendChat, SUBJECTS, type ChatMessage, type Lang } from "./api";

interface Bubble extends ChatMessage {
  key: string;
  blocked?: boolean;
}

const T = {
  title: { uz: "AI Tutor", ru: "AI Tutor", en: "AI Tutor" },
  subtitle: { uz: "Maktab AI-yordamchi", ru: "Школьный AI-помощник", en: "School AI helper" },
  placeholder: { uz: "Savolingizni yozing…", ru: "Напиши свой вопрос…", en: "Type your question…" },
  send: { uz: "Yuborish", ru: "Отправить", en: "Send" },
  error: {
    uz: "Xatolik yuz berdi, yana urinib ko'ring 🙏",
    ru: "Произошла ошибка, попробуй ещё раз 🙏",
    en: "Something went wrong, try again 🙏",
  },
  blockedMsg: {
    uz: "Bu savol tizimim tomonidan bloklandi 🛡️",
    ru: "Этот запрос заблокирован защитой 🛡️",
    en: "This request was blocked by the guard 🛡️",
  },
} as const;

let keySeq = 0;
const nextKey = () => `m${++keySeq}`;

export default function App() {
  const [lang, setLang] = useState<Lang>("ru");
  const [subject, setSubject] = useState<string | undefined>(undefined);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const listRef = useRef<FlatList<Bubble>>(null);

  // Регистрация устройства (для истории в MySQL, когда БД включена)
  useEffect(() => {
    const deviceId = `expo-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    createSession(deviceId, lang)
      .then((r) => setUserId(r.userId))
      .catch(() => setUserId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const userBubble: Bubble = { key: nextKey(), role: "user", content: text };
    setBubbles((prev) => [...prev.slice(-40), userBubble]);
    setBusy(true);

    try {
      const history: ChatMessage[] = bubbles.map(({ role, content }) => ({ role, content }));
      const res = await sendChat({ messages: [...history, { role: "user", content: text }], lang, subject, userId });
      setBubbles((prev) => [
        ...prev,
        { key: nextKey(), role: "assistant", content: res.blocked ? T.blockedMsg[lang] : res.reply, blocked: Boolean(res.blocked) },
      ]);
    } catch {
      setBubbles((prev) => [...prev, { key: nextKey(), role: "assistant", content: T.error[lang], blocked: true }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [input, busy, bubbles, lang, subject, userId]);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>🎓 {T.title[lang]}</Text>
          <Text style={s.subtitle}>{T.subtitle[lang]}</Text>
        </View>
        <View style={s.langRow}>
          {(["uz", "ru", "en"] as Lang[]).map((l) => (
            <Pressable key={l} onPress={() => setLang(l)} style={[s.langBtn, lang === l && s.langBtnOn]}>
              <Text style={[s.langTxt, lang === l && s.langTxtOn]}>{l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Subjects */}
      <FlatList
        horizontal
        data={SUBJECTS}
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSubject(subject === item.id ? undefined : item.id)}>
            <Text style={[s.subjectChip, subject === item.id && s.subjectChipOn]}>
              {item.emoji} {item.label[lang]}
            </Text>
          </Pressable>
        )}
      />

      {/* Chat */}
      <FlatList
        ref={listRef}
        data={bubbles}
        keyExtractor={(x) => x.key}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={s.chatList}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📚</Text>
            <Text style={s.emptyText}>
              {lang === "ru" ? "Спроси про любой школьный урок — объясню, но решать за тебя не буду 😉" : lang === "uz" ? "Har qanday maktab darsi haqida so'rang — tushuntiraman, lekin o'rniga bajarmayman 😉" : "Ask about any school lesson — I'll explain, but won't do it for you 😉"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === "user" ? s.bubbleUser : s.bubbleBot]}>
            <Text style={item.role === "user" ? s.bubbleUserTxt : s.bubbleBotTxt}>
              {item.blocked ? "🛡️ " : ""}
              {item.content}
            </Text>
          </View>
        )}
      />

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder={T.placeholder[lang]}
          placeholderTextColor={COLORS.muted}
          multiline
          editable={!busy}
        />
        <Pressable onPress={send} disabled={busy || !input.trim()} style={({ pressed }) => [s.sendBtn, (busy || !input.trim()) && s.sendBtnOff, pressed && s.sendBtnPressed]}>
          {busy ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={s.sendTxt}>➤</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === "android" ? 24 : 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  subtitle: { color: COLORS.sand, fontSize: 13, marginTop: 2 },
  langRow: { flexDirection: "row", gap: 6 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.bubbleBot },
  langBtnOn: { backgroundColor: COLORS.accent },
  langTxt: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  langTxtOn: { color: COLORS.text },
  subjectChip: { color: COLORS.muted, backgroundColor: COLORS.bubbleBot, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8, overflow: "hidden", fontSize: 13 },
  subjectChipOn: { color: "#fff", backgroundColor: COLORS.accent, fontWeight: "700" },
  chatList: { padding: 16, gap: 10 },
  empty: { alignItems: "center", marginTop: 80, paddingHorizontal: 30 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyText: { color: COLORS.muted, textAlign: "center", fontSize: 15, lineHeight: 22 },
  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: COLORS.bubbleUser, borderBottomRightRadius: 6 },
  bubbleBot: { alignSelf: "flex-start", backgroundColor: COLORS.bubbleBot, borderBottomLeftRadius: 6 },
  bubbleUserTxt: { color: "#FFF7F0", fontSize: 15, lineHeight: 21 },
  bubbleBotTxt: { color: COLORS.text, fontSize: 15, lineHeight: 21 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: "#565868" },
  input: { flex: 1, minHeight: 44, maxHeight: 110, backgroundColor: COLORS.bubbleBot, borderRadius: 14, color: COLORS.text, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 15 },
  sendBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  sendBtnOff: { opacity: 0.4 },
  sendBtnPressed: { transform: [{ scale: 0.94 }] },
  sendTxt: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
});
