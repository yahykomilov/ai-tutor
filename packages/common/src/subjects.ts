import type { Lang } from "./types.js";

/** Школьные предметы. Ключ — стабильный id, подписи — на трёх языках. */
export interface Subject {
  id: string;
  emoji: string;
  label: Record<Lang, string>;
}

export const SUBJECTS: Subject[] = [
  { id: "math", emoji: "➗", label: { uz: "Matematika", ru: "Математика", en: "Mathematics" } },
  { id: "algebra", emoji: "🧮", label: { uz: "Algebra", ru: "Алгебра", en: "Algebra" } },
  { id: "geometry", emoji: "📐", label: { uz: "Geometriya", ru: "Геометрия", en: "Geometry" } },
  { id: "physics", emoji: "🔭", label: { uz: "Fizika", ru: "Физика", en: "Physics" } },
  { id: "chemistry", emoji: "⚗️", label: { uz: "Kimyo", ru: "Химия", en: "Chemistry" } },
  { id: "biology", emoji: "🧬", label: { uz: "Biologiya", ru: "Биология", en: "Biology" } },
  { id: "geography", emoji: "🌍", label: { uz: "Geografiya", ru: "География", en: "Geography" } },
  { id: "history", emoji: "🏛️", label: { uz: "Tarix", ru: "История", en: "History" } },
  { id: "uzbek", emoji: "📖", label: { uz: "Ona tili", ru: "Узбекский язык", en: "Uzbek language" } },
  { id: "russian", emoji: "📚", label: { uz: "Rus tili", ru: "Русский язык", en: "Russian language" } },
  { id: "english", emoji: "🔤", label: { uz: "Ingliz tili", ru: "Английский язык", en: "English language" } },
  { id: "literature", emoji: "✍️", label: { uz: "Adabiyot", ru: "Литература", en: "Literature" } },
  { id: "informatics", emoji: "💻", label: { uz: "Informatika", ru: "Информатика", en: "Computer science" } },
];

export const SUBJECT_IDS = SUBJECTS.map((s) => s.id);

export function getSubject(id: string | undefined): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}
