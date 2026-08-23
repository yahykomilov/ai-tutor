/** Данные приложения: предметы с прогрессом, достижения, недельный график. */
import type { Lang } from "../api";

export interface SubjectData {
  id: string;
  icon: "math" | "physics" | "history" | "biology" | "language" | "chemistry" | "cs" | "english";
  title: Record<Lang, string>;
  desc: Record<Lang, string>;
  sample: Record<Lang, string>;
  progress: number; // 0..100
  lessons: number;
}

export const SUBJECTS_DATA: SubjectData[] = [
  {
    id: "algebra", icon: "math",
    title: { uz: "Algebra", ru: "Алгебра", en: "Algebra" },
    desc: { uz: "Tenglamalar, funksiyalar, grafiklar", ru: "Уравнения, функции, графики", en: "Equations, functions, graphs" },
    sample: { uz: "2x + 5 = 15 tenglamani qanday yechamiz?", ru: "Как решить уравнение 2x + 5 = 15?", en: "How do we solve 2x + 5 = 15?" },
    progress: 0, lessons: 24,
  },
  {
    id: "physics", icon: "physics",
    title: { uz: "Fizika", ru: "Физика", en: "Physics" },
    desc: { uz: "Harakat, kuch, energiya", ru: "Движение, силы, энергия", en: "Motion, forces, energy" },
    sample: { uz: "Erkin tushish tezligi qanday o'sadi?", ru: "Почему тело падает быстрее?", en: "Why do objects fall faster?" },
    progress: 0, lessons: 18,
  },
  {
    id: "history", icon: "history",
    title: { uz: "Tarix", ru: "История", en: "History" },
    desc: { uz: "Qadimgi davrdan hozirgacha", ru: "От древности до наших дней", en: "From ancient times to today" },
    sample: { uz: "Buyuk Ipak yo'li nima uchun muhim edi?", ru: "Почему Великий шёлковый путь был важен?", en: "Why did the Silk Road matter?" },
    progress: 0, lessons: 15,
  },
  {
    id: "biology", icon: "biology",
    title: { uz: "Biologiya", ru: "Биология", en: "Biology" },
    desc: { uz: "Hujayra, organizmlar, ekologiya", ru: "Клетка, организмы, экология", en: "Cells, organisms, ecology" },
    sample: { uz: "Fotosintez qanday ishlaydi?", ru: "Как работает фотосинтез?", en: "How does photosynthesis work?" },
    progress: 0, lessons: 20,
  },
  {
    id: "russian", icon: "language",
    title: { uz: "Rus tili", ru: "Русский язык", en: "Russian" },
    desc: { uz: "Grammatika, imlo, uslub", ru: "Грамматика, орфография, стиль", en: "Grammar, spelling, style" },
    sample: { uz: "-тся ва -ться qanday farqlanadi?", ru: "Когда пишется -тся, а когда -ться?", en: "When -тся vs -ться?" },
    progress: 0, lessons: 30,
  },
];

export interface Achievement {
  id: string;
  icon: "trophy" | "flame" | "target" | "zap";
  title: Record<Lang, string>;
  desc: Record<Lang, string>;
  unlocked: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-week", icon: "flame", unlocked: false,
    title: { uz: "Bir hafta", ru: "Неделя в деле", en: "First week" },
    desc: { uz: "7 kun ketma-ket o'qiding", ru: "7 дней учёбы подряд", en: "7 days learning streak" } },
  { id: "algebra-hero", icon: "target", unlocked: false,
    title: { uz: "Algebra qahramoni", ru: "Герой алгебры", en: "Algebra hero" },
    desc: { uz: "10 ta tenglama yechildi", ru: "10 уравнений разобрано", en: "10 equations solved together" } },
  { id: "socratic", icon: "zap", unlocked: false,
    title: { uz: "So'rovchi zehni", ru: "Пытливый ум", en: "Curious mind" },
    desc: { uz: "50 ta savol berildi", ru: "50 вопросов задано", en: "50 questions asked" } },
  { id: "champion", icon: "trophy", unlocked: false,
    title: { uz: "Chempion", ru: "Чемпион", en: "Champion" },
    desc: { uz: "Barcha fanlar 100%", ru: "Все предметы на 100%", en: "All subjects at 100%" } },
];

/** Очки за неделю (пн-вс) — для графика профиля */
export const WEEKLY_POINTS = [40, 65, 30, 80, 55, 90, 45];

export const USER_STATS = {
  name: { uz: "Otabek", ru: "Оtabek", en: "Otabek" },
  points: 1240,
  streak: 7,
  lessonsDone: 42,
};
