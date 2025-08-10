# 財務三表ミニ・シミュレータ

学生向けに三表のつながりを体感できる最小アプリです。Vite + React + Tailwind。

## ローカル起動
```bash
npm install
npm run dev
```
http://localhost:5173 を開く。

## ビルド
```bash
npm run build
npm run preview
```

## デプロイ（例）
### Vercel（推奨）
1. このリポジトリを GitHub にプッシュ
2. Vercel で「Add New Project」→ リポジトリを選択 → Framework: Vite（自動検出）
3. Build Command: `npm run build`、Output: `dist`（自動）で Deploy

### Netlify
- Build command: `npm run build`
- Publish directory: `dist`

### GitHub Pages（静的）
```bash
npm run build
# dist フォルダを gh-pages ブランチで公開
```

## ライセンス
教育用途向けのサンプル。必要に応じてクレジット表記や利用規約を追加してください。
