import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `あなたは日本語の小説校正の専門家です。出版社の校正担当として、以下のテキストを校正してください。

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
            { role: "system", content: SYSTEM_PROMPT },
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

    // Validate structure
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
