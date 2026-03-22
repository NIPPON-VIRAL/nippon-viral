// api/claude.js
// Vercel Edge Function — APIキーをサーバー側で安全に管理

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS — 自分のドメインのみ許可
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || '',   // 例: https://your-site.vercel.app
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // プリフライトリクエスト
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // APIキーはVercelの環境変数から取得（絶対にフロントに露出しない）
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { system, user, use_web_search, max_tokens = 5000 } = body;

    // リクエストボディを組み立て
    const anthropicBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens,
      system,
      messages: [{ role: 'user', content: user }],
    };

    // ウェブ検索ツールを有効化（オプション）
    if (use_web_search) {
      anthropicBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'API error' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // テキストブロックだけ抽出してフロントに返す
    const content = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
