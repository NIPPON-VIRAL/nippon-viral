// scripts/generate-ranking.js
// GitHub Actions から毎朝呼ばれるスクリプト
// ランキングデータを public/data/ranking.json に保存する

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY   = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY が設定されていません');
  process.exit(1);
}

// ── 集計期間を計算 ──
function getPeriod() {
  const now  = new Date();
  const t8   = new Date(now); t8.setHours(8, 0, 0, 0);
  const y8   = new Date(t8);  y8.setDate(y8.getDate() - 1);
  const fmt  = d => `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  return {
    label: `${fmt(y8)} 08:00 〜 ${fmt(t8)} 08:00`,
    from:  y8.toISOString(),
    to:    t8.toISOString(),
  };
}

// ── Claude API を呼び出す ──
async function callClaude(system, user, useWebSearch = false) {
  const body = {
    model:      'claude-sonnet-4-20250514',
    max_tokens: 5000,
    system,
    messages: [{ role: 'user', content: user }],
  };
  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}

// ── メイン処理 ──
async function main() {
  const period = getPeriod();
  console.log(`📡 集計期間: ${period.label}`);

  const system = `あなたは日本のSNSトレンド専門アナリストです。
YouTube Shorts・TikTok・Instagramの閲覧数データを分析し、
指定期間内に日本国内で最もバズった旅行・グルメスポットのランキングをJSONのみで返してください（前置きも\`\`\`も不要）。

{
  "generated_at": "ISO8601日時",
  "period": "集計期間文字列",
  "spots": [
    {
      "rank": 1,
      "name": "スポット名",
      "location": "都道府県・市区町村",
      "type": "food|nature|culture",
      "emoji": "絵文字",
      "viral_score": 整数,
      "total_views": "表示用文字列",
      "yt_views": "string",
      "tt_views": "string",
      "ig_views": "string",
      "attraction_copy": "魅力コピー文（150〜200文字）",
      "why_trending": "バズり理由（50文字以内）",
      "best_hashtags": ["#tag1","#tag2","#tag3"]
    }
  ]
}`;

  const user = `集計期間: ${period.label}
カテゴリ: 風景・絶景・グルメ・食事 すべて
この期間に YouTube Shorts・TikTok・Instagram で日本の景色・食事として最も閲覧数が多かったスポットトップ10を返してください。`;

  console.log('🤖 Claude API を呼び出し中...');
  const raw = await callClaude(system, user, true);

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON が見つかりませんでした');

  const parsed = JSON.parse(match[0]);
  parsed.generated_at = new Date().toISOString();
  parsed.period_from   = period.from;
  parsed.period_to     = period.to;

  // public/data/ ディレクトリが無ければ作る
  const outDir = path.join(__dirname, '..', 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'ranking.json');
  fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf-8');
  console.log(`✅ 保存完了: ${outPath}`);
  console.log(`📊 ${parsed.spots?.length || 0} スポットを生成`);
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
