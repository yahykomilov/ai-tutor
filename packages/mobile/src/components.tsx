/** Переиспользуемые компоненты дизайн-системы. */
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronRight, Flame, Star } from "lucide-react-native";
import { C, FONT, RADIUS, S, T } from "./theme";

/* ---------- PremiumButton ---------- */
export function PremiumButton({
  title, onPress, variant = "primary", style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "ghost";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        st.btn,
        variant === "primary" ? st.btnPrimary : st.btnGhost,
        pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      <Text style={[T.body, { fontFamily: FONT.semi }, variant === "primary" ? { color: "#fff" } : { color: C.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}

/* ---------- AnimatedProgressBar ---------- */
export function AnimatedProgressBar({ value, color = C.primary }: { value: number; color?: string }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: value, duration: 600, useNativeDriver: false }).start();
  }, [value, w]);
  return (
    <View style={st.barBg}>
      <Animated.View
        style={[
          st.barFill,
          {
            width: w.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

/* ---------- PageContainer: fade + translateY при входе ---------- */
export function PageContainer({ children }: { children: ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/* ---------- SubjectCard ---------- */
export interface SubjectCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
  sample?: string;
  progress: number;
  lessons?: string;
  onPress?: () => void;
}

export function SubjectCard({ icon, title, desc, sample, progress, lessons, onPress }: SubjectCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.card, st.subjectCard, pressed && { transform: [{ scale: 1.02 }] }]}>
      <View style={st.subjectTop}>
        <View style={st.iconBox}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={[T.h3, { fontFamily: FONT.semi, fontSize: 17 }, { color: C.textPrimary }]}>{title}</Text>
          <Text style={[T.small, { color: C.textSecondary }]} numberOfLines={1}>{desc}</Text>
        </View>
        <ChevronRight size={20} color={C.textSecondary} />
      </View>
      {sample ? (
        <View style={st.sampleBox}>
          <Text style={[T.caption, { color: C.primaryHover, fontFamily: FONT.medium }]} numberOfLines={1}>
            ❝ {sample}
          </Text>
        </View>
      ) : null}
      <View style={st.progressRow}>
        <AnimatedProgressBar value={progress} />
        <Text style={[T.caption, { color: C.textSecondary, marginLeft: S.sm, minWidth: 56, textAlign: "right" }]}>
          {progress}%{lessons != null ? ` · ${lessons}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

/* ---------- StatBadge (очки/стрик в шапке) ---------- */
export function StatBadge({ icon, value }: { icon: "points" | "streak"; value: number | string }) {
  return (
    <View style={st.badge}>
      {icon === "points"
        ? <Star size={14} color="#fff" fill="#fff" />
        : <Flame size={14} color="#fff" fill="#fff" />}
      <Text style={[T.caption, { color: "#fff", fontFamily: FONT.bold, marginLeft: 4 }]}>{value}</Text>
    </View>
  );
}

/* ---------- AchievementCard ---------- */
export function AchievementCard({
  icon, title, desc, unlocked,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  unlocked: boolean;
}) {
  return (
    <View style={[st.card, st.achieveCard, !unlocked && { opacity: 0.55 }]}>
      <View style={[st.iconBox, { backgroundColor: unlocked ? C.primaryLight : C.border }]}>{icon}</View>
      <Text style={[T.small, { fontFamily: FONT.semi, color: C.textPrimary, marginTop: S.sm }]} numberOfLines={1}>{title}</Text>
      <Text style={[T.caption, { color: C.textSecondary }]} numberOfLines={2}>{desc}</Text>
      {!unlocked && (
        <View style={st.lockBox}><Text style={[T.caption, { color: C.textSecondary }]}>🔒</Text></View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  btn: {
    height: 52, borderRadius: RADIUS.btn, alignItems: "center", justifyContent: "center",
    paddingHorizontal: S.lg,
  },
  btnPrimary: { backgroundColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  btnGhost: { backgroundColor: C.primaryLight },
  card: {
    backgroundColor: C.card, borderRadius: RADIUS.card, padding: S.md,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  subjectCard: { gap: 12 },
  subjectTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  sampleBox: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  progressRow: { flexDirection: "row", alignItems: "center" },
  barBg: { flex: 1, height: 8, borderRadius: 999, backgroundColor: C.border, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 999 },
  badge: { flexDirection: "row", alignItems: "center", backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  achieveCard: { flex: 1, alignItems: "flex-start", gap: 2, minWidth: 140 },
  lockBox: { position: "absolute", top: S.sm, right: S.sm },
});
