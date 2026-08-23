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
  { re: /<\/?\s*(topic|system|instruction|context|user_input|student_message|assistant_history|prompt)\s*>/i, reason: "delimiter-injection" },
  { re: /\[\/?(inst|system|sys)\]/i, reason: "delimiter-injection" },

  // ---------- Русский ----------
  { re: /(забудь|игнорируй|проигнорируй|отмени|не\s+обращай\s+внимания)[\s\S]{0,40}(инструкц|правил|указан|промпт|предыдущ|сказанн)/i, reason: "override-instructions" },
  { re: /(теперь\s+ты|ты\s+теперь|притвор|веди\s+себя\s+как|представь,?\s+что\s+ты|ты\s+больше\s+не)/i, reason: "identity-override" },
  { re: /режим\s+(разработчика|бога|без\s+ограничен)|без\s+(каких[\s-]*либо\s+)?ограничений/i, reason: "jailbreak-mode" },
  { re: /(покажи|выведи|повтори|раскрой|напечатай|скажи\s+мне)[\s\S]{0,30}(системн[а-яё]*\s*промпт|свои\s+(инструкц|правил)|начальн[а-яё]*\s*промпт|тво[йи]\s+промпт|промпт[а-яё\s]{0,15}целиком)/i, reason: "prompt-exfiltration" },
  { re: /(system|системн\w*)[\s_-]*(override|овервайд|оверрайд|перехват)/i, reason: "jailbreak-mode" },

  // ---------- O'zbekcha ----------
  { re: new RegExp(`(unut|bekor\\s+qil|e${AP}tibor\\s+berma)[\\s\\S]{0,40}(ko${AP}rsatma|qoida|yo${AP}riqnoma|oldingi)`, "i"), reason: "override-instructions" },
  { re: new RegExp(`(oldingi|barcha|avvalgi|ko${AP}rsatma|qoida)[\\s\\S]{0,40}(unut|bekor\\s+qil)`, "i"), reason: "override-instructions" },
  { re: new RegExp(`endi\\s+sen|sen\\s+endi|o${AP}zingni[\\s\\S]{0,15}dek\\s+tut|boshqa[\\s\\S]{0,8}bo${AP}l`, "i"), reason: "identity-override" },
  { re: new RegExp(`tizim\\w*\\s*prompt|prompting|(prompt\\w*|ko${AP}rsatma\\w*)[\\s\\S]{0,20}(ko${AP}rsat|chiqar|oshkor)`, "i"), reason: "prompt-exfiltration" },
];

/** Невидимые символы, которыми разводят буквы обхода детектора (zero-width, bidi, soft-hyphen). */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u00AD]/g;

/**
 * Декодирует кандидатов в base64 (>=16 символов) и возвращает их содержимое
 * вместе с оригиналом — чтобы закодированные инструкции не проходили мимо скана.
 */
function withDecodedBase64(text: string): string {
  const candidates = text.match(/[A-Za-z0-9+/=]{16,}/g);
  if (!candidates) return text;
  const decoded: string[] = [];
  for (const c of candidates) {
    try {
      // strict: только валидный base64, дающий осмысленный текст
      const s = Buffer.from(c, "base64").toString("utf8");
      if (/^[\p{L}\p{P}\p{N}\s]+$/u.test(s) && s.length >= 8) decoded.push(s);
    } catch {
      /* не base64 — пропускаем */
    }
  }
  return decoded.length ? `${text}\n${decoded.join("\n")}` : text;
}

/** Проверяет один фрагмент текста на признаки инъекции. */
export function detectInjection(text: string): GuardResult {
  const reasons = new Set<string>();
  const normalized = withDecodedBase64(
    text.normalize("NFKC").replace(INVISIBLE, ""),
  );
  for (const { re, reason } of INJECTION_PATTERNS) {
    if (re.test(normalized)) reasons.add(reason);
  }
  return { injected: reasons.size > 0, reasons: [...reasons] };
}

/** Сканирует ВСЮ историю сообщений — инъекция в любом месте блокирует запрос. */
export function detectInjectionInHistory(messages: { role: string; content: string }[]): GuardResult {
  const reasons = new Set<string>();
  for (const m of messages) {
    for (const r of detectInjection(m.content).reasons) reasons.add(r);
  }
  return { injected: reasons.size > 0, reasons: [...reasons] };
}

/**
 * Оборачивает ненадёжный пользовательский ввод в явные делимитеры и
 * нейтрализует внутренние закрывающие теги — Layer 2 (структурная изоляция).
 */
export function wrapUserInput(text: string): string {
  const safe = text
    .replace(/<\s*\/?\s*student_message\s*>/gi, "")
    .replace(/<\s*\/?\s*assistant_history\s*>/gi, "");
  return `<student_message>\n${safe}\n</student_message>`;
}

/**
 * Прошлые ходы «ассистента», пришедшие от клиента, тоже ненадёжны:
 * их нельзя отдавать модели как собственные слова тьютора.
 */
export function wrapAssistantHistory(text: string): string {
  const safe = text
    .replace(/<\s*\/?\s*assistant_history\s*>/gi, "")
    .replace(/<\s*\/?\s*student_message\s*>/gi, "");
  return `<assistant_history>\n${safe}\n</assistant_history>`;
}
