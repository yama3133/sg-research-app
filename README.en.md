# 🇸🇬 SG Research

[日本語 README ▸](./README.md)

A small Next.js demo that wires [Tavily Search](https://tavily.com) and [Amazon Bedrock](https://aws.amazon.com/bedrock/) (Claude Sonnet 4.6) together. It searches the web, summarizes the results, and streams Claude's **extended thinking** over Server-Sent Events so you can watch the model reason in real time. The vertical is "things you'd want to look up before a trip to Singapore", but the codebase is meant to read as a generic Tavily + Bedrock Thinking sample.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tavily](https://img.shields.io/badge/Tavily-Search-22c55e)
![Bedrock](https://img.shields.io/badge/Amazon%20Bedrock-Claude%20Sonnet%204.6-FF9900?logo=amazonaws)

## Features

- **Preset + free-form search**: 12 one-tap presets (flights, SIM, Grab, hotels, sights…) plus free text input
- **Japanese summary**: the English Tavily answer is translated by Claude Sonnet 4.6 when JP is selected
- **Thinking stream**: extended-thinking tokens and the final analysis are streamed as **SSE** events so the UI updates as Claude reasons
- **JP / EN toggle**: UI labels, summary, and analysis all switch language
- **iPhone friendly**: mobile-first layout, LINE Seed JP Bold as the body font

## Architecture

```
   ┌────────────────┐    POST /api/search    ┌─────────────────┐
   │  Browser (UI)  │ ──────────────────────▶│  Next.js Route  │ ──▶ Tavily Search API
   │  app/page.tsx  │ ◀── Tavily results ────│   /api/search   │ ──▶ Bedrock Converse  (translate)
   │                │     (+JP summary)      └─────────────────┘
   │                │    POST /api/analyze   ┌─────────────────┐
   │                │ ──────────────────────▶│  Next.js Route  │ ──▶ Bedrock ConverseStream
   │                │ ◀── SSE (thinking / ──│   /api/analyze  │     + extended thinking
   │                │       text / done)     └─────────────────┘
   └────────────────┘
```

| Endpoint | Role |
|---|---|
| `POST /api/search` | Calls Tavily Search. In JP mode, translates the English answer via Bedrock. |
| `POST /api/analyze` | Sends the top 10 results to Claude and streams `thinking` / `text` chunks over SSE. |

## Requirements

- Node.js 20+
- Tavily API key (free tier: 1,000 requests / month)
- AWS account with Bedrock access to `us.anthropic.claude-sonnet-4-6` in `us-east-1`
- AWS credentials (local: `~/.aws/credentials`; production: env vars)

## Local development

```bash
git clone https://github.com/yama3133/sg-research-app
cd sg-research-app
npm install

cp .env.local.example .env.local
# Edit .env.local and paste your TAVILY_API_KEY

npm run dev
# → http://localhost:3000
```

### `.env.local`

```
TAVILY_API_KEY=tvly-...
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-6
# Locally, AWS credentials come from the default profile in ~/.aws/credentials.
# In production (Vercel), set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY.
```

## Deploy to Vercel

```bash
vercel --prod
```

Add these environment variables in the Vercel dashboard:

| Key | Value |
|---|---|
| `TAVILY_API_KEY` | your Tavily key |
| `BEDROCK_REGION` | `us-east-1` |
| `BEDROCK_MODEL_ID` | `us.anthropic.claude-sonnet-4-6` |
| `AWS_ACCESS_KEY_ID` | IAM user with `bedrock:InvokeModel*` |
| `AWS_SECRET_ACCESS_KEY` | secret for the same user |

## Project layout

```
app/
├── api/
│   ├── search/route.ts      # Tavily + Bedrock translation
│   └── analyze/route.ts     # Bedrock ConverseStream + extended thinking (SSE)
├── i18n.ts                  # JP/EN strings + preset definitions
├── layout.tsx               # font (LINE Seed JP Bold) / viewport
├── globals.css
└── page.tsx                 # Main UI (search + streaming display)
public/
└── fonts/LINESeedJP_OTF_Bd.woff   # SIL OFL 1.1
```

## License

- App code: MIT
- Bundled font [LINE Seed JP](https://seed.line.me/index_en.html): SIL Open Font License 1.1 (LINE Corporation)
