# NIPPON VIRAL — 完全セットアップガイド

## 📁 プロジェクト構成

```
nippon-viral/
├── public/
│   ├── index.html          ← フロントエンド（見た目）
│   └── data/
│       └── ranking.json    ← 毎日自動生成されるデータ
├── api/
│   └── claude.js           ← Vercel Edge Function（APIキー管理）
├── scripts/
│   └── generate-ranking.js ← 毎朝8時に実行されるスクリプト
├── .github/
│   └── workflows/
│       └── daily-update.yml ← GitHub Actions設定
├── vercel.json              ← Vercelデプロイ設定
├── package.json
├── .env.example             ← 環境変数のサンプル
└── .gitignore
```

---

## STEP 1 — GitHubにアップロード

### 1-1. GitHubアカウント作成（持っている場合はスキップ）
https://github.com にアクセスしてアカウントを作成

### 1-2. 新しいリポジトリを作成
1. https://github.com/new にアクセス
2. Repository name: `nippon-viral`
3. Public または Private を選択
4. 「Create repository」をクリック

### 1-3. ファイルをアップロード
```bash
# ターミナル（Mac: Terminal、Windows: Git Bash）で実行

# ① Gitの初期設定（初回のみ）
git config --global user.name  "あなたの名前"
git config --global user.email "あなたのメール"

# ② プロジェクトフォルダに移動
cd nippon-viral

# ③ Gitを初期化してアップロード
git init
git add .
git commit -m "🚀 初回コミット"
git branch -M main
git remote add origin https://github.com/あなたのID/nippon-viral.git
git push -u origin main
```

---

## STEP 2 — Vercelにデプロイ

### 2-1. Vercelアカウント作成
https://vercel.com にアクセスして「GitHubでログイン」

### 2-2. プロジェクトをインポート
1. Vercelダッシュボード → 「Add New Project」
2. GitHubリポジトリ「nippon-viral」を選択
3. 「Import」をクリック
4. Framework Preset: **Other**（フレームワークなし）
5. Root Directory: `.`（そのまま）
6. 「Deploy」は **まだクリックしない**（先に環境変数を設定）

### 2-3. 環境変数を設定（重要！）
「Environment Variables」セクションで以下を追加：

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxx...`（Anthropicのキー） |
| `ALLOWED_ORIGIN` | `https://あなたのサイト.vercel.app` |

> ⚠️ APIキーは絶対にGitHubにコミットしないこと！

### 2-4. デプロイ実行
「Deploy」をクリック → 1〜2分でデプロイ完了

### 2-5. 動作確認
デプロイ後に表示されるURL（例: https://nippon-viral.vercel.app）にアクセス

---

## STEP 3 — アフィリエイトIDの設定

### Booking.com
1. https://www.booking.com/affiliate-program/ に登録
2. 審査通過後、アフィリエイトIDをもらう（例: `1234567`）
3. `public/index.html` の以下を変更：
```javascript
const AFFILIATE = {
  booking_aid: '1234567',  // ← ここにIDを入力
  ...
};
```

### Airbnb Associates
1. https://www.airbnb.jp/associates に登録
2. リファレンスコードをもらう
3. 同じく`index.html`の`airbnb_ref`に入力

### じゃらん（楽天アフィリエイト）
1. https://affiliate.rakuten.co.jp に登録
2. じゃらんのアフィリエイトIDを取得
3. `jalan_afid`に入力

変更後：
```bash
git add public/index.html
git commit -m "💰 アフィリエイトID設定"
git push
```
→ Vercelが自動で再デプロイします

---

## STEP 4 — GitHub Actionsで毎朝8時自動更新

### 4-1. GitHubにシークレットを設定
1. GitHubリポジトリページ → 「Settings」
2. 左メニュー「Secrets and variables」→「Actions」
3. 「New repository secret」で以下を追加：

| Secret名 | 値 |
|----------|----|
| `ANTHROPIC_API_KEY` | AnthropicのAPIキー |
| `VERCEL_DEPLOY_HOOK` | Vercelのデプロイフック（任意） |

### 4-2. Vercel Deploy Hookの取得（任意）
1. Vercelダッシュボード → プロジェクト → 「Settings」
2. 「Git」→「Deploy Hooks」
3. 「Create Hook」→ 名前: `github-actions`、Branch: `main`
4. 表示されたURLをコピーしてGitHubシークレットに設定

### 4-3. 動作確認（手動テスト）
1. GitHubリポジトリ → 「Actions」タブ
2. 「Daily Trend Update」→「Run workflow」→「Run workflow」
3. 緑のチェックマークが出れば成功！

### 4-4. 自動実行のスケジュール
`.github/workflows/daily-update.yml` の cron 設定：
```yaml
- cron: '0 23 * * *'  # UTC 23:00 = JST 08:00
```

---

## 🔑 Anthropic APIキーの取得方法

1. https://console.anthropic.com にアクセス
2. アカウント作成（クレジットカード登録が必要）
3. 「API Keys」→「Create Key」
4. `sk-ant-` から始まるキーをコピー
5. 料金の目安: 1回の検索 約$0.01〜0.03（1〜4円）

---

## ⚡ ローカルでのテスト方法

```bash
# 依存関係インストール
npm install

# .env.example をコピーして設定
cp .env.example .env
# .env を編集してAPIキーを入力

# ローカルサーバー起動
npm run dev
# → http://localhost:3000 で確認
```

---

## ❓ よくある問題

**Q: デプロイしたがAPIエラーが出る**
→ VercelのEnvironment Variablesに`ANTHROPIC_API_KEY`が設定されているか確認

**Q: CORSエラーが出る**
→ `ALLOWED_ORIGIN`にデプロイ後のURLを正確に設定（末尾スラッシュなし）

**Q: GitHub Actionsが失敗する**
→ Secretsに`ANTHROPIC_API_KEY`が設定されているか確認

**Q: アフィリエイトリンクが機能しない**
→ 各プラットフォームのアフィリエイトプログラムに審査申請・承認が必要
