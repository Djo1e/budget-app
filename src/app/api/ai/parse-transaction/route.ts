import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { isAuthenticated } from "@/lib/auth-server";
import {
  buildParsePrompt,
  parseTransactionResponseSchema,
} from "@/lib/ai/parse-transaction";

export async function POST(req: NextRequest) {
  const session = await isAuthenticated();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { text, categories, payees } = body as {
    text: string;
    categories: { id: string; name: string }[];
    payees: { id: string; name: string }[];
  };

  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const prompt = buildParsePrompt(text, { categories, payees });

  const { text: aiResponse } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    prompt,
    maxOutputTokens: 200,
  });

  const cleaned = aiResponse.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  const parsed = parseTransactionResponseSchema.safeParse(JSON.parse(cleaned));

  if (!parsed.success) {
    return NextResponse.json({ error: "Failed to parse transaction" }, { status: 422 });
  }

  return NextResponse.json(parsed.data);
}
