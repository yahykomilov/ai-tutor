/**
 * ЗАГРУЗКА .env — ОБЯЗАН быть первым импортом в точке входа.
 * ESM поднимает все import'ы наверх, поэтому dotenv.config() внутри тела
 * index.ts выполняется ПОСЛЕ загрузки tutor.js и др. — ключи не видны.
 * Этот модуль делает конфиг побочным эффектом импорта, который идёт первым.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env из корня монорепо (приоритет), затем локальный packages/server/.env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();
