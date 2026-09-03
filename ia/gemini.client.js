"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callGemini = callGemini;
const env_1 = require("../config/env");

/** Gemini utilise 'model' au lieu de 'assistant' pour les réponses de l'IA */
function toGeminiRole(role) {
    return role === 'assistant' ? 'model' : 'user';
}

/** Petit wrapper autour de l'API Gemini generateContent, partagé par les 3 services IA. */
async function callGemini(messages, system, maxTokens = 1000) {
    if (!env_1.env.geminiApiKey) {
        throw new Error("GEMINI_API_KEY n'est pas configurée (.env)");
    }
    const model = env_1.env.geminiModel || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const contents = messages.map((m) => ({
        role: toGeminiRole(m.role),
        parts: [{ text: m.content }],
    }));

    const body = {
        contents,
        generationConfig: {
            maxOutputTokens: maxTokens,
        },
    };

    if (system) {
        body.systemInstruction = { parts: [{ text: system }] };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': env_1.env.geminiApiKey, // évite d'exposer la clé dans les logs d'URL
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur API Gemini (${response.status}): ${text}`);
    }

    const data = (await response.json());
    const candidate = data.candidates?.[0];

    if (!candidate) {
        // Peut arriver si bloqué par les filtres de sécurité (finishReason: SAFETY)
        throw new Error(`Réponse Gemini vide (finishReason: ${data.promptFeedback?.blockReason ?? 'inconnu'})`);
    }

    const parts = candidate.content?.parts ?? [];
    return parts.map((p) => p.text ?? '').join('\n').trim();
}