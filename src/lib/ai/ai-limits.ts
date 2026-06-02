/**
 * Constantes centralizadas de seguridad/limites para el flujo de IA.
 * Mantener aqui los valores para que sean faciles de auditar y ajustar.
 */

// --- Texto del CV enviado al modelo ---
export const MAX_CV_TEXT_CHARS = 12000;

// --- Configuracion de generacion de Gemini ---
export const GEMINI_MAX_OUTPUT_TOKENS = 1000;
export const GEMINI_TEMPERATURE = 0.2;
export const GEMINI_TOP_P = 0.8;
export const GEMINI_TOP_K = 40;

// --- Timeout / retry de Gemini ---
export const GEMINI_TIMEOUT_MS = 25_000;
export const GEMINI_MAX_RETRIES = 1;
export const GEMINI_RETRY_BACKOFF_MS = 800;

// --- Rate limit del endpoint publico de apply ---
export const RL_PER_JOB_LIMIT = 5;
export const RL_PER_JOB_WINDOW_MS = 10 * 60 * 1000; // 10 min
export const RL_GLOBAL_IP_LIMIT = 20;
export const RL_GLOBAL_IP_WINDOW_MS = 60 * 60 * 1000; // 1 hora

// --- Cuota diaria de analisis IA ---
export const QUOTA_PER_JOB_PER_DAY = 100;
export const QUOTA_GLOBAL_PER_DAY = 300;

export type AiUsageStatus = "success" | "error" | "fallback";
