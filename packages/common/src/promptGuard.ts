/**
 * Layer 1 — детектор prompt injection.
 *
 * Ловит попытки ученика (или подсунутого текста) переопределить правила тьютора:
 * «забудь инструкции», «ты теперь…», подделка ролей system/developer, вскрытие
 * системного промпта, инъекция делимитеров. Работает на 3 языках (uz/ru/en).
 *
 * ВАЖНО про регексы: в JS `\b` и `\w` завязаны на ASCII, поэтому для кириллицы и
 * узбекских апострофов границы слов НЕ используем — матчим по подстрокам и явным
 * классам букв. `\b` оставлен только в англоязычных паттернах.
 *
 * Это только ПЕРВЫЙ слой (намеренно консервативный, ловит явные атаки, не тематику).
 * Семантику «только учёба» держит системный промпт (Layer 2), корректность вывода —
 * Layer 3. Тематику регексами не фильтруем, чтобы не блокировать учебные вопросы.
 */

export interface GuardResult {
  injected: boolean;
  reasons: string[];
}

// апострофы, встречающиеся в узбекской латинице: ' ’ ʻ ‘
const AP = "['’ʻ‘]";

const INJECTION_PATTERNS: { re: RegExp; reason: string }[] = [
  // ---------- English ----------
  { re: /\b(ignore|disregard|forget|override|bypass)\b[\s\S]{0,40}\b(instruction|rule|prompt|context|guideline|direction|command)s?\b/i, reason: "override-instructions" },
  { re: /\byou\s+are\s+now\b|\bfrom\s+now\s+on\s+you\b|\bact\s+as\b|\bpretend(ing)?\s+(to\s+be|you|that)\b|\broleplay(ing)?\s+as\b/i, reason: "identity-override" },
  { re: /\b(developer|god|dan|jailbreak|unrestricted|uncensored)\s+mode\b|\bno\s+restrictions?\b|\bunrestricted\s+ai\b/i, reason: "jailbreak-mode" },
  { re: /^\s*(system|developer|assistant)\s*:/im, reason: "role-spoof" },
  { re: /\b(reveal|show|print|repeat|output|leak|display)\b[\s\S]{0,30}(system\s+prompt|your\s+(instruction|prompt|rule|system)|initial\s+prompt|these\s+instruction)/i, reason: "prompt-exfiltration" },
  { re: /<\/?\s*(topic|system|instruction|context|user_input|student_message|prompt)\s*>/i, reason: "delimiter-injection" },
  { re: /\[\/?(inst|system|sys)\]/i, reason: "delimiter-injection" },

  // ---------- Русский ----------
  { re: /(забудь|игнорируй|проигнорируй|отмени|не\s+обращай\s+внимания)[\s\S]{0,40}(инструкц|правил|указан|промпт|предыдущ|сказанн)/i, reason: "override-instructions" },
  { re: /(теперь\s+ты|ты\s+теперь|притвор|веди\s+себя\s+как|представь,?\s+что\s+ты|ты\s+больше\s+не)/i, reason: "identity-override" },
  { re: /режим\s+(разработчика|бога|без\s+ограничен)|без\s+(каких[\s-]*либо\s+)?ограничений/i, reason: "jailbreak-mode" },
  { re: /(покажи|выведи|повтори|раскрой|напечатай|скажи\s+мне)[\s\S]{0,30}(системн[а-яё]*\s*промпт|свои\s+(инструкц|правил)|начальн[а-яё]*\s*промпт|тво[йи]\s+промпт|промпт[а-яё\s]{0,15}целиком)/i, reason: "prompt-exfiltration" },

  // ---------- O'zbekcha ----------
  { re: new RegExp(`(unut|bekor\\s+qil|e${AP}tibor\\s+berma)[\\s\\S]{0,40}(ko${AP}rsatma|qoida|yo${AP}riqnoma|oldingi)`, "i"), reason: "override-instructions" },
  { re: new RegExp(`(oldingi|barcha|avvalgi|ko${AP}rsatma|qoida)[\\s\\S]{0,40}(unut|bekor\\s+qil)`, "i"), reason: "override-instructions" },
  { re: new RegExp(`endi\\s+sen|sen\\s+endi|o${AP}zingni[\\s\\S]{0,15}dek\\s+tut|boshqa[\\s\\S]{0,8}bo${AP}l`, "i"), reason: "identity-override" },
  { re: new RegExp(`tizim\\w*\\s*prompt|prompting|(prompt\\w*|ko${AP}rsatma\\w*)[\\s\\S]{0,20}(ko${AP}rsat|chiqar|oshkor)`, "i"), reason: "prompt-exfiltration" },
];

/** Проверяет один фрагмент текста на признаки инъекции. */
export function detectInjection(text: string): GuardResult {
  const reasons = new Set<string>();
  const normalized = text.normalize("NFKC");
  for (const { re, reason } of INJECTION_PATTERNS) {
    if (re.test(normalized)) reasons.add(reason);
  }
  return { injected: reasons.size > 0, reasons: [...reasons] };
}

/**
 * Оборачивает ненадёжный пользовательский ввод в явные делимитеры и
 * нейтрализует внутренние закрывающие теги — Layer 2 (структурная изоляция).
 */
export function wrapUserInput(text: string): string {
  const safe = text.replace(/<\s*\/?\s*student_message\s*>/gi, "");
  return `<student_message>\n${safe}\n</student_message>`;
}
