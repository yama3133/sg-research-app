import { NextRequest } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BEDROCK_REGION = process.env.BEDROCK_REGION ?? "us-east-1";
const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-sonnet-4-6";

type SourceInput = {
  title: string;
  url: string;
  content: string;
};

type AnalyzeBody = {
  query?: string;
  sources?: SourceInput[];
  lang?: "ja" | "en";
};

const SYSTEM_PROMPTS = {
  ja:
    "あなたはシンガポール出張の準備を支援する日本人向け調査アシスタント。" +
    "与えられたWeb検索結果(英語含む)を読み、ユーザーのクエリに対する実用的な日本語の分析を返す。" +
    "出力構成: (A) 2-3行の要約 / (B) 『- 』で始まる箇条書きで重要ポイント5-8点 / (C) 注意点や追加で確認すべき項目 。" +
    "数値・固有名詞・URLは保持。Markdown見出しは使わない。",
  en:
    "You are a research assistant helping a business traveler prepare for a Singapore trip. " +
    "Read the provided web search results and produce a practical analysis in English for the user's query. " +
    "Output structure: (A) 2-3 line summary / (B) 5-8 bullet points starting with '- ' covering the key points / (C) caveats and additional items to verify. " +
    "Preserve numbers, proper nouns, and URLs. Do not use Markdown headings.",
};

function sse(eventName: string, data: unknown): string {
  return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  let body: AnalyzeBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = (body.query ?? "").trim();
  const sources = (body.sources ?? []).slice(0, 10);
  const lang: "ja" | "en" = body.lang === "en" ? "en" : "ja";
  if (!query || sources.length === 0) {
    return Response.json(
      { error: "query and sources are required." },
      { status: 400 },
    );
  }

  const excerptLabel = lang === "en" ? "Excerpt" : "抜粋";
  const sourceText = sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title}\nURL: ${s.url}\n${excerptLabel}: ${s.content.slice(0, 800)}`,
    )
    .join("\n\n");
  const userPrompt =
    lang === "en"
      ? `# Query\n${query}\n\n# Search results (${sources.length})\n${sourceText}\n\nAnalyze the above in English to help prepare a Singapore business trip.`
      : `# クエリ\n${query}\n\n# 検索結果(${sources.length}件)\n${sourceText}\n\n上記を踏まえ、シンガポール出張の準備に役立つ形で日本語で分析してください。`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      try {
        send("status", { phase: "started" });

        const client = new BedrockRuntimeClient({ region: BEDROCK_REGION });
        const command = new ConverseStreamCommand({
          modelId: BEDROCK_MODEL_ID,
          system: [{ text: SYSTEM_PROMPTS[lang] }],
          messages: [
            {
              role: "user",
              content: [{ text: userPrompt }],
            },
          ],
          inferenceConfig: {
            maxTokens: 6000,
            temperature: 1,
          },
          additionalModelRequestFields: {
            thinking: {
              type: "enabled",
              budget_tokens: 3000,
            },
          },
        });

        const response = await client.send(command);
        if (!response.stream) {
          send("error", { message: "No stream returned from Bedrock." });
          controller.close();
          return;
        }

        for await (const event of response.stream) {
          if (event.contentBlockDelta?.delta) {
            const delta = event.contentBlockDelta.delta;
            if ("reasoningContent" in delta && delta.reasoningContent?.text) {
              send("thinking", { text: delta.reasoningContent.text });
            } else if ("text" in delta && delta.text) {
              send("text", { text: delta.text });
            }
          } else if (event.messageStop) {
            send("done", { stopReason: event.messageStop.stopReason });
          } else if (event.metadata?.usage) {
            send("usage", event.metadata.usage);
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
