# AI Tutor — контекст для команды и агентов

**Проект:** Maktab uchun AI-yordamchi — AI-репетитор для школы. Помогает ученику
разобраться в уроках (объясняет, не решает за него), **только по учёбе**, устойчив к
prompt injection. Каналы: веб + Telegram бот + Mini App. Языки: uz/ru/en.

Хакатон DevX Command, финал **23.08.2026**. Тема уровня O'RTA.

## Стек и структура (npm workspaces)
- `packages/common` — типы, системный промпт (`tutorPrompt.ts`), guard от инъекций (`promptGuard.ts`), zod-схемы, банк предметов.
- `packages/server` — Node + Express, `/api/tutor/chat`, Anthropic Claude, 3 слоя защиты, rate-limit.
- `packages/web` — React + Vite + Tailwind + i18next (чат + Security demo, тёмная тема).
- `packages/bot` — Telegram-бот (grammy), тонкий клиент к серверу, кнопка Mini App.

## Запуск
```
npm install
cp .env.example .env      # ANTHROPIC_API_KEY (без него — демо-режим)
npm run dev               # сервер :3001 + веб :5173
npm run dev:bot           # бот (нужен TELEGRAM_BOT_TOKEN)
npm run typecheck && npm run test && npm run build
```

## Роли
- **Yahyo** — mobile app. **Abdulaziz** (`atxamov99`) — веб. **Otabek** (`xcrpty7`) — бэкенд. **X.O.B** (`odil47`) — интеграция/тесты.

## Жёсткие правила
1. **Секреты — только в `.env`**, в репо лишь `.env.example`. Ключи НИКОГДА не постим в чат.
2. **`packages/common` — общий контракт** фронта и сервера. Правим по согласованию.
3. **Definition of Done:** typecheck + build + живой клик в браузере + guard-тест зелёный.
4. **Правила дня финала** — `docs/finals-playbook.md` (заморозка фич T-90, живой прогон T-60).
5. **Тьютор = только учёба + анти-чит.** Любая фича не должна ослаблять системный промпт или защиту (`docs/security.md`).
