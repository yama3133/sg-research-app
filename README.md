# 🇸🇬 SG Research

[English README ▸](./README.en.md)

[Tavily Search](https://tavily.com) と [Amazon Bedrock](https://aws.amazon.com/bedrock/) (Claude Sonnet 4.6) を使った、シンガポール調査用の小さな Web アプリ。検索結果を取ってくるだけでなく、Bedrock の **Extended Thinking** を SSE ストリーミングで可視化するデモにもなっている。

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tavily](https://img.shields.io/badge/Tavily-Search-22c55e)
![Bedrock](https://img.shields.io/badge/Amazon%20Bedrock-Claude%20Sonnet%204.6-FF9900?logo=amazonaws)

## 機能

- **プリセット + 自由入力で検索**: 12種類のプリセット(フライト/SIM/Grab/ホテル/観光 など) と自由入力をワンクリックで切替
- **AI要約 (日本語)**: Tavily が返す英文サマリーを Bedrock Claude Sonnet 4.6 で日本語化
- **Thinking ストリーミング**: 検索結果を Claude が読みながら考える過程 (extended thinking) と最終分析を **Server-Sent Events** で逐次表示
- **日英切替 (JP / EN)**: UI 文言・要約・分析言語をワンタップで切替
- **iPhone 対応**: モバイルファーストのレイアウト、フォントは LINE Seed JP Bold

> 開発のきっかけは個人的な出張準備でしたが、コードは「Tavily + Bedrock Thinking で何か作りたい人」のサンプルとして読めるよう汎用的にしてあります。

## アーキテクチャ

```
   ┌────────────────┐    POST /api/search    ┌─────────────────┐
   │  Browser (UI)  │ ──────────────────────▶│  Next.js Route  │ ──▶ Tavily Search API
   │  app/page.tsx  │ ◀── Tavily結果(+和訳)──│   /api/search   │ ──▶ Bedrock Converse  (和訳)
   │                │                        └─────────────────┘
   │                │    POST /api/analyze   ┌─────────────────┐
   │                │ ──────────────────────▶│  Next.js Route  │ ──▶ Bedrock ConverseStream
   │                │ ◀── SSE (thinking / ──│   /api/analyze  │     + extended thinking
   │                │       text / done)     └─────────────────┘
   └────────────────┘
```

| エンドポイント | 役割 |
|---|---|
| `POST /api/search` | Tavily Search を叩き、JP モードのみ Bedrock で英文 answer を和訳して返す |
| `POST /api/analyze` | 検索結果10件を Claude に渡し、`thinking` / `text` を SSE で逐次返す |

## 必要なもの

- Node.js 20+
- Tavily API キー (無料、月1000リクエスト)
- AWS アカウント + `us.anthropic.claude-sonnet-4-6` の Bedrock 利用権限 (us-east-1)
- AWS 認証情報 (ローカルは `~/.aws/credentials`、本番は環境変数)

## ローカル起動

```bash
git clone https://github.com/yama3133/sg-research-app
cd sg-research-app
npm install

cp .env.local.example .env.local   # 雛形 (下記参照)
# .env.local を編集して TAVILY_API_KEY を入れる

npm run dev
# → http://localhost:3000
```

### `.env.local`

```
TAVILY_API_KEY=tvly-...
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-6
# AWS 認証はローカルは ~/.aws/credentials のデフォルトプロファイルが使われる
# 本番(Vercel)では AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY を別途設定
```

## Vercel デプロイ

```bash
vercel --prod
```

Vercel ダッシュボードの環境変数に以下を登録:

| キー | 値 |
|---|---|
| `TAVILY_API_KEY` | Tavily のキー |
| `BEDROCK_REGION` | `us-east-1` |
| `BEDROCK_MODEL_ID` | `us.anthropic.claude-sonnet-4-6` |
| `AWS_ACCESS_KEY_ID` | Bedrock InvokeModel 権限を持つ IAM ユーザーのキー |
| `AWS_SECRET_ACCESS_KEY` | 同上のシークレット |

## ファイル構成

```
app/
├── api/
│   ├── search/route.ts      # Tavily 呼び出し + Bedrock 和訳
│   └── analyze/route.ts     # Bedrock ConverseStream + Extended Thinking (SSE)
├── i18n.ts                  # JP/EN 文言・プリセット定義
├── layout.tsx               # フォント (LINE Seed JP Bold) / viewport
├── globals.css
└── page.tsx                 # メインUI (検索 + ストリーミング表示)
public/
└── fonts/LINESeedJP_OTF_Bd.woff   # SIL OFL 1.1
```

## ライセンス

- アプリ本体: MIT
- 同梱フォント [LINE Seed JP](https://seed.line.me/index_jp.html): SIL Open Font License 1.1 (LINE Corporation)
