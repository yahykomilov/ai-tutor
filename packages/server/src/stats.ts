import type { AdminStats, Lang } from "@ai-tutor/common";

/**
 * Реальная (не мок) статистика для admin panel — собирается в рантайме из
 * настоящих запросов к /api/tutor/chat. Хранится в памяти процесса: без БД,
 * поэтому обнуляется при перезапуске сервера — это осознанный компромисс для
 * хакатон-демо (см. .env.example / README), не выдаётся за постоянное хранилище.
 */
interface SecurityLogEntry {
  time: string;
  layer: 1 | 2 | 3;
  lang: Lang;
  text: string;
}

interface State {
  day: string;
  questionsToday: number;
  blockedToday: number;
  subjectUsage: Map<string, number>;
  activeClients: Set<string>;
  securityLog: SecurityLogEntry[];
}

const MAX_LOG = 30;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fresh(): State {
  return {
    day: today(),
    questionsToday: 0,
    blockedToday: 0,
    subjectUsage: new Map(),
    activeClients: new Set(),
    securityLog: [],
  };
}

let state = fresh();

function ensureDay() {
  const d = today();
  if (state.day !== d) {
    // новый день — суточные счётчики сбрасываем, накопительную статистику по предметам оставляем
    state.day = d;
    state.questionsToday = 0;
    state.blockedToday = 0;
    state.activeClients = new Set();
  }
}

export function recordRequest(opts: {
  clientId?: string;
  subject?: string;
  lang: Lang;
  blocked?: { reason: string; layer: 1 | 2 | 3 };
  lastMessage: string;
}): void {
  ensureDay();
  state.questionsToday += 1;
  if (opts.clientId) state.activeClients.add(opts.clientId);
  if (opts.subject) state.subjectUsage.set(opts.subject, (state.subjectUsage.get(opts.subject) ?? 0) + 1);
  if (opts.blocked) {
    state.blockedToday += 1;
    state.securityLog.unshift({
      time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      layer: opts.blocked.layer,
      lang: opts.lang,
      text: opts.lastMessage.slice(0, 200),
    });
    if (state.securityLog.length > MAX_LOG) state.securityLog.length = MAX_LOG;
  }
}

export function getStats(): AdminStats {
  ensureDay();
  const subjectUsage = [...state.subjectUsage.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  return {
    activeStudents: state.activeClients.size,
    questionsToday: state.questionsToday,
    blockedToday: state.blockedToday,
    topSubject: subjectUsage[0]?.id,
    subjectUsage,
    securityLog: state.securityLog.slice(0, 8),
  };
}
