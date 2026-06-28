export type Lang = "ja" | "en";

export type Preset = {
  id: string;
  emoji: string;
  query: string;
  label: { ja: string; en: string };
  description: { ja: string; en: string };
};

export const PRESETS: Preset[] = [
  {
    id: "event",
    emoji: "🎤",
    query:
      "AWS Community Day Singapore 2026 August 22 venue agenda speakers location",
    label: { ja: "登壇イベント", en: "Speaking event" },
    description: {
      ja: "AWS Community Day SG 2026 (2026-08-22) 会場・登壇",
      en: "AWS Community Day SG 2026 (2026-08-22) venue & talks",
    },
  },
  {
    id: "event-area",
    emoji: "📍",
    query:
      "AWS Singapore office Asia Square Tower 1 Marina View nearby cafe lunch food MRT access",
    label: { ja: "会場周辺", en: "Around the venue" },
    description: {
      ja: "AWS SGオフィス(Marina View)周辺",
      en: "Around the AWS SG office (Marina View)",
    },
  },
  {
    id: "travel-flight",
    emoji: "✈️",
    query:
      "Tokyo Narita Haneda to Singapore Changi flight price August 2026 ANA JAL Singapore Airlines cheapest fare",
    label: { ja: "フライト相場", en: "Flight prices" },
    description: {
      ja: "東京⇔SG 8月後半の相場",
      en: "Tokyo–SG fares in late August",
    },
  },
  {
    id: "travel-visa",
    emoji: "🛂",
    query:
      "Singapore Arrival Card SGAC Japan passport 2026 entry requirements ICA",
    label: { ja: "SG Arrival Card", en: "SG Arrival Card" },
    description: {
      ja: "SGAC手続き・入国要件",
      en: "SGAC process & entry requirements",
    },
  },
  {
    id: "travel-sim",
    emoji: "📶",
    query:
      "Singapore eSIM tourist Singtel StarHub M1 best prepaid data plan 2026",
    label: { ja: "SIM/eSIM", en: "SIM/eSIM" },
    description: {
      ja: "現地SIM/eSIM選択肢",
      en: "Local SIM/eSIM options",
    },
  },
  {
    id: "travel-grab",
    emoji: "🚕",
    query:
      "Singapore Grab vs taxi vs MRT Changi airport to city August 2026 tips",
    label: { ja: "Grab/移動", en: "Grab/transport" },
    description: {
      ja: "Grab/タクシー/MRT・空港アクセス",
      en: "Grab/taxi/MRT & airport access",
    },
  },
  {
    id: "travel-cash",
    emoji: "💳",
    query:
      "Singapore credit card vs cash 2026 Visa Mastercard Wise PayNow tourist payment",
    label: { ja: "現金/決済", en: "Cash/payments" },
    description: {
      ja: "カード/現金/Wise/PayNow",
      en: "Card / cash / Wise / PayNow",
    },
  },
  {
    id: "hotel-marina",
    emoji: "🏨",
    query:
      "Singapore Marina Bay CBD hotel near AWS office Asia Square August 2026 booking",
    label: { ja: "ホテル(CBD)", en: "Hotels (CBD)" },
    description: {
      ja: "Marina/CBD(会場至近)",
      en: "Marina/CBD (near venue)",
    },
  },
  {
    id: "hotel-area",
    emoji: "🗺️",
    query:
      "Singapore best area to stay tourist Marina Bay vs Chinatown vs Orchard vs Bugis comparison",
    label: { ja: "エリア比較", en: "Area comparison" },
    description: {
      ja: "Marina / Chinatown / Orchard / Bugis 比較",
      en: "Marina / Chinatown / Orchard / Bugis",
    },
  },
  {
    id: "tour-must",
    emoji: "🌃",
    query:
      "Singapore must visit attractions Marina Bay Sands Gardens by the Bay Sentosa 2026 first time visitor",
    label: { ja: "観光定番", en: "Top sights" },
    description: {
      ja: "初回でも外せない観光地",
      en: "Must-see spots for first visits",
    },
  },
  {
    id: "tour-weather",
    emoji: "☀️",
    query:
      "Singapore weather August rainy humidity temperature what to pack 2026",
    label: { ja: "8月の天気", en: "August weather" },
    description: {
      ja: "8月の気候・服装の準備",
      en: "August climate & what to pack",
    },
  },
  {
    id: "food",
    emoji: "🍜",
    query:
      "Singapore must eat hawker centre chicken rice chilli crab laksa 2026 local food guide",
    label: { ja: "ローカルグルメ", en: "Local food" },
    description: {
      ja: "ホーカー含む必食リスト",
      en: "Hawker & must-eat list",
    },
  },
];

export const T = {
  ja: {
    poweredBy: "Powered by Tavily Search API",
    subtitle:
      "シンガポール出張 (2026-08-20頃〜 / AWS Community Day SG 2026 登壇) に向けた情報収集ハブ。",
    presetsHeading: "プリセット検索",
    placeholder: "自由入力 (例: Singapore Changi T1 vs T3 transit)",
    search: "検索",
    searching: "検索中…",
    askingTavily: "Tavily に問い合わせ中…",
    sources: (n: number, sec?: number) =>
      `ソース (${n}件${sec != null ? ` · ${sec.toFixed(2)}秒` : ""})`,
    emptyHint:
      "上のプリセット、または自由入力から検索を開始してください。",
    error: "エラー:",
    analyzeHeading: "🧠 Claude の分析",
    thinking: (n: number) => `💭 Thinking (${n.toLocaleString()}字)`,
    thinkingIdle: "💭 Thinking",
    analysisLabel: "📝 分析",
    streamError: "分析エラー:",
    streaming: "streaming",
    langToggleLabel: "Language",
    footer: "Tavily Search API · Bedrock Claude Sonnet 4.6 · Next.js 16",
  },
  en: {
    poweredBy: "Powered by Tavily Search API",
    subtitle:
      "Research hub for a Singapore business trip (around 2026-08-20, speaking at AWS Community Day SG 2026).",
    presetsHeading: "Preset searches",
    placeholder: "Free input (e.g. Singapore Changi T1 vs T3 transit)",
    search: "Search",
    searching: "Searching…",
    askingTavily: "Asking Tavily…",
    sources: (n: number, sec?: number) =>
      `Sources (${n}${sec != null ? ` · ${sec.toFixed(2)}s` : ""})`,
    emptyHint:
      "Pick a preset above, or type a free-form query to start.",
    error: "Error:",
    analyzeHeading: "🧠 Claude analysis",
    thinking: (n: number) => `💭 Thinking (${n.toLocaleString()} chars)`,
    thinkingIdle: "💭 Thinking",
    analysisLabel: "📝 Analysis",
    streamError: "Analysis error:",
    streaming: "streaming",
    langToggleLabel: "言語",
    footer: "Tavily Search API · Bedrock Claude Sonnet 4.6 · Next.js 16",
  },
} as const;
