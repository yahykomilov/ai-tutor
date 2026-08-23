/**
 * Конфиг мобильного приложения.
 * API_URL: телефон в Expo Go стучится на ноут по Wi-Fi — сюда LAN IP машины,
 * где поднят сервер (ip addr | grep "inet 192"). localhost с телефона не работает!
 */
import { Platform } from "react-native";

const DEV_LAN_IP = "192.168.1.11"; // ноутбук в Wi-Fi сети (ip addr)

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ && Platform.OS !== "web" ? `http://${DEV_LAN_IP}:3001` : "http://localhost:3001");

/** Палитра команды (фикс — из ТЗ финала). */
export const COLORS = {
  bg: "#464858", // тёмный сланец — фон
  accent: "#A56F63", // терракота — кнопки, акценты
  sand: "#D99B7F", // песочный — вторичный акцент
  text: "#F5EFE9",
  muted: "#B8B2AC",
  bubbleUser: "#A56F63",
  bubbleBot: "#52546A",
  danger: "#C4453C",
} as const;
