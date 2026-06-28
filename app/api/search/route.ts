import { NextRequest } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BEDROCK_REGION = process.env.BEDROCK_REGION ?? "us-east-1";
const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-sonnet-4-6";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
};

type TavilyResponse = {
  query: string;
  answer?: string;
  answer_ja?: string;
  results: TavilyResult[];
  response_time?: number;
};

async function translateToJapanese(
  query: string,
  englishAnswer: string,
): Promise<string | null> {
  if (!englishAnswer.trim()) return null;
  try {
    const client = new BedrockRuntimeClient({ region: BEDROCK_REGION });
    const command = new ConverseCommand({
      modelId: BEDROCK_MODEL_ID,
      system: [
        {
          text:
            "あなたはシンガポール出張の準備をしている日本人ビジネスパーソン向けの調査アシスタント。" +
            "与えられた英文サマリーを、自然で簡潔な日本語サマリーに変換する。" +
            "出力は: 1) 冒頭に1〜2行の要約、2) 続けて『- 』で始まる箇条書き4〜7点 で、" +
            "重要な数値・固有名詞・URLは保持する。Markdown見出しは使わない。",
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              text: `検索クエリ: ${query}\n\n英文サマリー:\n${englishAnswer}`,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 1200,
        temperature: 0.2,
      },
    });
    const res = await client.send(command);
    const text = res.output?.message?.content
      ?.map((c) => c.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch (e) {
    console.error("Bedrock translate error:", e);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "TAVILY_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: {
    query?: string;
    search_depth?: "basic" | "advanced";
    max_results?: number;
    lang?: "ja" | "en";
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = (body.query ?? "").trim();
  if (!query) {
    return Response.json({ error: "query is required." }, { status: 400 });
  }

  const payload = {
    query,
    search_depth: body.search_depth ?? "advanced",
    include_answer: "advanced",
    max_results: Math.min(Math.max(body.max_results ?? 10, 1), 20),
    topic: "general",
  };

  const upstream = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return Response.json(
      { error: `Tavily API error: ${upstream.status}`, detail: text },
      { status: upstream.status },
    );
  }

  const data = (await upstream.json()) as TavilyResponse;
  if (data.answer && body.lang !== "en") {
    const ja = await translateToJapanese(query, data.answer);
    if (ja) data.answer_ja = ja;
  }
  return Response.json(data);
}
