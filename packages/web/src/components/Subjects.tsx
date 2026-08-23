import { useTranslation } from "react-i18next";
import { SUBJECTS, type Lang } from "@ai-tutor/common";

const EXTRA: Record<string, { desc: Record<Lang, string>; sample: Record<Lang, string> }> = {
  math: {
    desc: { uz: "Raqamlar, hisob-kitoblar va mantiqiy masalalar olami.", ru: "Мир чисел, вычислений и логических задач.", en: "The world of numbers, arithmetic, and logic problems." },
    sample: { uz: "Kasrlarni qo'shish qanday?", ru: "Как складывать дроби?", en: "How do you add fractions?" },
  },
  algebra: {
    desc: { uz: "Tenglamalar, funksiyalar va ko'phadlar bilan ishlash asoslari.", ru: "Основы работы с уравнениями, функциями и многочленами.", en: "The basics of equations, functions, and polynomials." },
    sample: { uz: "Kvadrat tenglama nima?", ru: "Что такое квадратное уравнение?", en: "What is a quadratic equation?" },
  },
  geometry: {
    desc: { uz: "Shakllar, fazo, yuzalar va hajmlarni o'rganish.", ru: "Изучение фигур, пространства, площадей и объёмов.", en: "The study of shapes, space, areas, and volumes." },
    sample: { uz: "Pifagor teoremasini tushuntir", ru: "Объясни теорему Пифагора", en: "Explain the Pythagorean theorem" },
  },
  physics: {
    desc: { uz: "Tabiat qonunlari, harakat, energiya va kuchlar.", ru: "Законы природы, движение, энергия и силы.", en: "The laws of nature, motion, energy, and forces." },
    sample: { uz: "Nyutonning 1-qonuni", ru: "Первый закон Ньютона", en: "Newton's 1st law" },
  },
  chemistry: {
    desc: { uz: "Moddalar tuzilishi, xossalari va ularning o'zgarishi.", ru: "Строение веществ, их свойства и превращения.", en: "The structure of matter, its properties, and changes." },
    sample: { uz: "Atom nima degani?", ru: "Что такое атом?", en: "What is an atom?" },
  },
  biology: {
    desc: { uz: "Tirik organizmlar, hayot jarayonlari va ekotizimlar.", ru: "Живые организмы, процессы жизни и экосистемы.", en: "Living organisms, life processes, and ecosystems." },
    sample: { uz: "Fotosintez qanday yuz beradi?", ru: "Как происходит фотосинтез?", en: "How does photosynthesis work?" },
  },
  geography: {
    desc: { uz: "Yer yuzi, iqlim, qit'alar va davlatlar haqida.", ru: "О земной поверхности, климате, континентах и странах.", en: "About the Earth's surface, climate, continents, and countries." },
    sample: { uz: "O'zbekistonning iqlimi", ru: "Климат Узбекистана", en: "The climate of Uzbekistan" },
  },
  history: {
    desc: { uz: "O'tmish voqealari, insoniyat va sivilizatsiyalar rivoji.", ru: "События прошлого, развитие человечества и цивилизаций.", en: "Past events and the development of humanity and civilizations." },
    sample: { uz: "Amir Temur davlati", ru: "Государство Амира Темура", en: "Amir Temur's state" },
  },
  uzbek: {
    desc: { uz: "Til qoidalari, so'z yasalishi va to'g'ri yozish.", ru: "Правила языка, словообразование и грамотное письмо.", en: "Language rules, word formation, and correct writing." },
    sample: { uz: "Fe'l so'z turkumi", ru: "Часть речи «глагол»", en: "The verb word class" },
  },
  russian: {
    desc: { uz: "Rus tili grammatikasi va so'zlashuv asoslari.", ru: "Основы грамматики и разговорной речи русского языка.", en: "The basics of Russian grammar and conversation." },
    sample: { uz: "Rod qoidalari", ru: "Правила рода", en: "Gender rules" },
  },
  english: {
    desc: { uz: "Xalqaro muloqot tili, grammatika va lug'at boyligi.", ru: "Международный язык общения, грамматика и словарный запас.", en: "The international language, grammar, and vocabulary." },
    sample: { uz: "Present Simple zamoni", ru: "Время Present Simple", en: "Present Simple tense" },
  },
  literature: {
    desc: { uz: "Badiiy asarlar, janrlar va ijodkorlar olami.", ru: "Мир художественных произведений, жанров и авторов.", en: "The world of literary works, genres, and authors." },
    sample: { uz: "Doston nima?", ru: "Что такое эпос?", en: "What is an epic poem?" },
  },
  informatics: {
    desc: { uz: "Kompyuter savodxonligi, algoritmlar va dasturlash asoslari.", ru: "Компьютерная грамотность, алгоритмы и основы программирования.", en: "Computer literacy, algorithms, and programming basics." },
    sample: { uz: "Algoritm nima?", ru: "Что такое алгоритм?", en: "What is an algorithm?" },
  },
};

export default function Subjects({ lang, onPick }: { lang: Lang; onPick: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-extrabold text-ink-900 dark:text-white">{t("subjects.title")}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("subjects.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => {
          const extra = EXTRA[s.id];
          return (
            <button
              key={s.id}
              onClick={() => onPick(s.id)}
              className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-ink-900"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl dark:bg-slate-800">
                {s.emoji}
              </span>
              <span className="text-base font-bold text-ink-900 dark:text-white">{s.label[lang]}</span>
              {extra && <span className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{extra.desc[lang]}</span>}
              <span className="mt-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                💬 {extra ? extra.sample[lang] : t("subjects.cardHint")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
