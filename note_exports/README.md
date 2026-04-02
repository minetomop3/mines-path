# note_exports フォルダ

このフォルダに Note からエクスポートしたファイルを配置してください。

## 対応ファイル形式

- `.md` — Markdown形式
- `.html` — HTML形式
- `.txt` — テキスト形式

## 使い方

1. Note の記事をエクスポートし、このフォルダに入れてください
2. プロジェクトルートで以下を実行してください:

```bash
cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY を設定

node scripts/process-notes.js
```

3. `src/content/blog/` に整理済み Markdown ファイルが生成されます
