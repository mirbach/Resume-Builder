import { Router, type Request, type Response } from 'express';
import { readJson } from '../lib/storage.js';
import type { AppSettings } from '../types.js';

const router = Router();

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  grok: 'grok-3-mini',
  google: 'gemini-2.0-flash',
};

const CAR_SYSTEM_PROMPT = `You are a management consulting resume expert specialising in the CAR (Challenge–Action–Result) and ELITE (Experience–Leadership–Impact–Transformation–Excellence) frameworks.

Review the provided CAR achievement entry and return a JSON object with this exact shape:
{
  "scores": {
    "challenge": <1-5>,
    "action": <1-5>,
    "result": <1-5>
  },
  "issues": ["<concise issue>", ...],
  "suggestions": {
    "challenge": "<improved text or empty string>",
    "action": "<improved text or empty string>",
    "result": "<improved text or empty string>"
  },
  "overallFeedback": "<2-3 sentence summary>"
}

Scoring criteria:
- Challenge 5: Specific business/technical context, quantified scope, clear stakeholder impact
- Action 5: First-person active verbs, specific steps, demonstrates leadership or skill
- Result 5: Quantified outcome (%, €/$, time saved), attribution to your actions
- Deduct points for: passive voice, vague verbs (e.g. "helped", "worked on"), missing metrics, missing context
Only provide improved text in suggestions when the score is below 4. Return valid JSON only — no markdown, no extra text.`;

interface CarReviewRequest {
  challenge: string;
  action: string;
  result: string;
  lang?: 'en' | 'de';
}

interface CarReviewResponse {
  scores: { challenge: number; action: number; result: number };
  issues: string[];
  suggestions: { challenge: string; action: string; result: string };
  overallFeedback: string;
}

async function callOpenAiCompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  userMessage: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: CAR_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI API error (${res.status}): ${body}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '';
}

async function callGoogle(apiKey: string, model: string, userMessage: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: CAR_SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google AI error (${res.status}): ${body}`);
  }

  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  return data.candidates[0]?.content?.parts[0]?.text ?? '';
}

// POST /api/ai/review
router.post('/review', async (req: Request, res: Response) => {
  try {
    const { challenge, action, result, lang = 'en' } = req.body as CarReviewRequest;

    if (!challenge?.trim() && !action?.trim() && !result?.trim()) {
      return res.status(400).json({ success: false, error: 'At least one CAR field must have content.' });
    }

    const settings = await readJson<AppSettings>('settings.json').catch(() => null);
    const ai = settings?.ai;

    if (!ai?.apiKey?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'AI API key not configured. Go to Settings → AI Assistant to add your key.',
      });
    }

    const provider = ai.provider ?? 'openai';
    const model = ai.model?.trim() || DEFAULT_MODELS[provider];
    const apiKey = ai.apiKey.trim();

    const userMessage = `Review this CAR achievement (language: ${lang.toUpperCase()}):

Challenge: ${challenge || '(empty)'}
Action: ${action || '(empty)'}
Result: ${result || '(empty)'}`;

    let raw = '';
    if (provider === 'google') {
      raw = await callGoogle(apiKey, model, userMessage);
    } else {
      const baseUrl = provider === 'grok'
        ? 'https://api.x.ai/v1'
        : 'https://api.openai.com/v1';
      raw = await callOpenAiCompat(baseUrl, apiKey, model, userMessage);
    }

    const parsed = JSON.parse(raw) as CarReviewResponse;
    return res.json({ success: true, data: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI review failed';
    return res.status(500).json({ success: false, error: message });
  }
});

export default router;
