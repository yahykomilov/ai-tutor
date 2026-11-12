/**
 * Чистит ответ ИИ от остатков разметки (markdown / LaTeX), чтобы в чате был
 * простой читаемый текст: без ###, **, таблиц из «|---|», \frac{...}{...} и т.п.
 */
const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", n: "ⁿ",
};

const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", theta: "θ", lambda: "λ", mu: "μ", pi: "π",
  rho: "ρ", sigma: "σ", phi: "φ", omega: "ω", Delta: "Δ", Omega: "Ω",
};

function latexToText(s: string): string {
  let out = s;
  // \frac{a}{b} -> (a)/(b), повторяем для вложенных
  for (let i = 0; i < 3; i++) {
    out = out.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)");
  }
  out = out
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
    .replace(/\\text\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\(?:cdot|times)/g, "·")
    .replace(/\\approx/g, "≈")
    .replace(/\\(?:leq|le)\b/g, "≤")
    .replace(/\\(?:geq|ge)\b/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\(?:angle)/g, "∠")
    .replace(/\\(?:circ)/g, "°")
    .replace(/\\(?:left|right)/g, "")
    .replace(/\\[,;:! ]/g, " ")
    .replace(/\\([A-Za-z]+)/g, (_m, name: string) => GREEK[name] ?? name)
    .replace(/\^\{([^{}]*)\}/g, (_m, p: string) => [...p].map((c) => SUP[c] ?? c).join(""))
    .replace(/\^([0-9n])/g, (_m, p: string) => SUP[p] ?? p)
    .replace(/_\{([^{}]*)\}/g, "$1")
    .replace(/[{}]/g, "");
  return out;
}

export function cleanText(input: string): string {
  let t = input.replace(/\r\n/g, "\n");

  // формулы: \[ ... \], \( ... \), $$ ... $$
  t = t.replace(/\\\[([\s\S]*?)\\\]/g, (_m, f: string) => latexToText(f.trim()));
  t = t.replace(/\\\(([\s\S]*?)\\\)/g, (_m, f: string) => latexToText(f.trim()));
  t = t.replace(/\$\$([\s\S]*?)\$\$/g, (_m, f: string) => latexToText(f.trim()));
  // оставшиеся «голые» LaTeX-команды (если закрывающий разделитель не пришёл)
  if (/\\(?:frac|sqrt|text|cdot|times|rho)/.test(t)) t = latexToText(t.replace(/\\\[|\\\]|\\\(|\\\)/g, ""));

  // блоки кода и обратные кавычки
  t = t.replace(/```[a-zA-Z]*\n?/g, "").replace(/`([^`\n]*)`/g, "$1");

  // таблицы: разделители убираем, строки превращаем в «a — b — c»
  t = t
    .split("\n")
    .filter((line) => !/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line))
    .map((line) => {
      if (/^\s*\|.*\|\s*$/.test(line)) {
        return line
          .trim()
          .replace(/^\|\s*|\s*\|$/g, "")
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean)
          .join(" — ");
      }
      return line;
    })
    .join("\n");

  // заголовки, горизонтальные линии, цитаты
  t = t.replace(/^\s{0,3}#{1,6}\s*/gm, "").replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "").replace(/^\s*>\s?/gm, "");

  // жирный / курсив
  t = t.replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/__([^_\n]+)__/g, "$1");
  t = t.replace(/(^|[\s(])\*([^*\s][^*\n]*?)\*(?=[\s).,;:!?]|$)/g, "$1$2");

  // маркеры списков "* " -> "• "
  t = t.replace(/^(\s*)[*•]\s+/gm, "$1• ");

  // лишние пустые строки
  return t.replace(/\n{3,}/g, "\n\n").trim();
}
