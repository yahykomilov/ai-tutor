# 🎓 AI Tutor — Maktab uchun AI-yordamchi

> **🌐 Живое демо: https://ai-tutor-site-sable.vercel.app** (чат + вкладка «Xavfsizlik» с живой защитой)

AI-репетитор для обычной школы. Помогает ученику **разобраться** в уроках —
объясняет, ведёт к ответу наводящими вопросами, **но не решает домашку/контрольные
за него** (борьба со списыванием). Отвечает **только по учебным предметам** и
**устойчив к prompt injection** — ученик не может «уговорить» его нарушить правила.

Каналы: **веб-сайт**, **Telegram-бот** и **Telegram Mini App** (один и тот же тьютор).
Языки интерфейса и ответов: **o'zbekcha / русский / English**.

## Почему это сильно
- **Учит, а не списывает** — сократовский метод: наводящие вопросы вместо готового ответа.
- **Строгий учебный скоуп** — на «расскажи анекдот / посоветуй игру» вежливо возвращает к учёбе.
- **3-слойная защита от prompt injection** — детект атаки → делимитированный ввод → валидация вывода. См. `docs/security.md`.
- **Родной язык** — узбекский/русский/английский из коробки.

## Стек
npm workspaces монорепо:
- `packages/common` — типы, системный промпт тьютора, guard от инъекций, zod-схемы.
- `packages/server` — Node + Express, `/api/tutor/chat`, Anthropic Claude, 3 слоя защиты.
- `packages/web` — React + Vite + Tailwind + i18next (чат + Security demo).
- `packages/bot` — Telegram-бот (grammy) + точка входа Mini App.

## Запуск
```bash
npm install
cp .env.example .env   # вставь ANTHROPIC_API_KEY (без него — демо-режим)
npm run dev            # сервер :3001 + веб :5173
npm run dev:bot        # Telegram-бот (нужен TELEGRAM_BOT_TOKEN)
```

## Проверка
```bash
npm run typecheck      # все пакеты
npm run test           # guard-тесты (боевые prompt-injection payload'ы)
npm run build          # прод-сборка веба
```

## Команда (DevX Command, финал 23.08.2026)
- **Yahyo** — mobile app
- **Abdulaziz** (`atxamov99`) — веб-сайт
- **Otabek** (`xcrpty7`) — бэкенд
- **X.O.B** (`odil47`) — интеграция и тестирование
