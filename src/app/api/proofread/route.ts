import { NextRequest, NextResponse } from "next/server";

// Langfuse prompt name (source of truth: Langfuse UI で編集可能)
const LANGFUSE_PROMPT_NAME = "NovelForge：小説校正システムプロンプト";

// フォールバック: Langfuse に接続できない場合に使用
const _FALLBACK_SYSTEM_PROMPT = `あなたは日本語の小説校正の専門家です。出版社の校正担当として、以下のテキストを校正してください。

以下のカテゴリで問題を指摘してください:
- 誤字脱字: 明らかな誤字・脱字・変換ミス
- 表記ゆれ: 同一単語の表記が統一されていない
- 文法: 助詞・活用・係り受けの誤り
- 句読点: 不適切な読点の位置、句読点の過不足
- 表現改善: より適切な表現への提案
- 文体統一: 文体の不統一（である調/ですます調の混在等）

必ず以下のJSON形式のみで回答してください（コードブロック等は不要）:
{
  "issues": [
    {
      "category": "誤字脱字",
      "severity": "error",
      "original": "問題のある原文テキスト（該当箇所のみ）",
      "suggestion": "修正後のテキスト",
      "reason": "修正理由の説明",
      "context": "前後の文脈を含むテキスト（1文程度）"
    }
  ],
  "summary": "全体的な校正所見（2-3文）"
}

重要なルール:
- originalには問題のある箇所の原文テキストをそのまま含めること
- 問題がない場合はissuesを空配列にすること
- severityは error（明確な誤り）、warning（改善推奨）、info（提案）で使い分けること
- JSON以外のテキストは一切出力しないこと`;

// Langfuse prompt cache (5 min TTL)
let _cachedPrompt: { text: string; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function getSystemPrompt(): Promise<string> {
  const baseUrl = process.env.LANGFUSE_BASE_URL;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;

  if (!baseUrl || !publicKey || !secretKey) {
    return _FALLBACK_SYSTEM_PROMPT;
  }

  // Return cached if fresh
  if (_cachedPrompt && Date.now() - _cachedPrompt.fetchedAt < CACHE_TTL) {
    return _cachedPrompt.text;
  }

  try {
    const res = await fetch(
      `${baseUrl}/api/public/v2/prompts/${encodeURIComponent(LANGFUSE_PROMPT_NAME)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`,
        },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!res.ok) throw new Error(`Langfuse ${res.status}`);
    const data = await res.json();
    const text = data.prompt || _FALLBACK_SYSTEM_PROMPT;
    _cachedPrompt = { text, fetchedAt: Date.now() };
    return text;
  } catch {
    // Langfuse unreachable — use fallback
    return _cachedPrompt?.text || _FALLBACK_SYSTEM_PROMPT;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { text: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text } = body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "text field is required" },
      { status: 400 }
    );
  }

  try {
    const systemPrompt = await getSystemPrompt();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "z-ai/glm-4.7",
          reasoning: { effort: "none" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `以下のテキストを校正してください:\n\n${text}`,
            },
          ],
          max_tokens: 4096,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from LLM" },
        { status: 502 }
      );
    }

    // Parse JSON from LLM response, stripping code fences if present
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed.issues)) {
      return NextResponse.json(
        { error: "Invalid response format: missing issues array" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      issues: parsed.issues,
      summary: parsed.summary || "",
    });
  } catch (error) {
    console.error("Proofreading error:", error);
    const message =
      error instanceof SyntaxError
        ? "Failed to parse LLM response as JSON"
        : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
