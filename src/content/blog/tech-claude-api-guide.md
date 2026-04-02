---
title: "Claude APIで作るAIアシスタント：実装から本番運用まで完全ガイド"
description: "Anthropic の Claude API を使って実用的なAIアシスタントを構築する方法を解説。APIキーの取得からストリーミングレスポンス実装、コスト管理まで、実践的なコードサンプルとともに紹介します。"
pubDate: 2024-12-01
category: "AI・プログラミング"
categorySlug: "tech"
tags:
  - "Claude API"
  - "AI開発"
  - "Python"
keywords: "Claude API, Anthropic, AI開発, LLM, Python, プログラミング"
draft: false
originalSource: "note"
originalFile: "sample-tech-01.md"
---

## AIを「使う側」から「作る側」へ

ChatGPTやClaude を使う人は増えましたが、それを**自分のアプリに組み込む**ことができる人はまだ少数派です。この記事では、Anthropic の Claude API を使って、実用的なAIアシスタントをゼロから構築する方法を解説します。

---

## 準備: APIキーの取得

1. [console.anthropic.com](https://console.anthropic.com) にアクセス
2. アカウントを作成しログイン
3. 「API Keys」からキーを生成

生成したキーは **必ず環境変数で管理** してください。コードにベタ書きは絶対NGです。

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

## 基本的な呼び出し（Python）

```python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Pythonでフィボナッチ数列を生成する関数を書いて"}
    ]
)

print(message.content[0].text)
```

たったこれだけでClaudeにアクセスできます。

---

## ストリーミングレスポンス

長い回答を待たせないために、ストリーミングは必須の実装です。

```python
with client.messages.stream(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "機械学習について詳しく説明して"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

---

## システムプロンプトで人格を与える

AIアシスタントらしく振る舞わせるには、`system` パラメータが鍵です。

```python
message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=2048,
    system="""あなたはMBAを持つ経営コンサルタントです。
ビジネス戦略について、フレームワークを活用しながら
分かりやすく、実践的なアドバイスを提供してください。""",
    messages=[
        {"role": "user", "content": "新規事業の市場調査の進め方を教えて"}
    ]
)
```

---

## コスト管理のポイント

Claude API はトークン（文字数の単位）ごとに課金されます。

| モデル | 入力 (1Mトークン) | 出力 (1Mトークン) |
|--------|-------------------|-------------------|
| claude-opus-4-6 | $15 | $75 |
| claude-sonnet-4-6 | $3 | $15 |
| claude-haiku-4-5 | $0.25 | $1.25 |

**コスト削減のコツ:**
- 開発中は Haiku を使い、本番で Opus に切り替える
- `max_tokens` を必要最小限に設定する
- キャッシュ可能なシステムプロンプトは `cache_control` を活用する

---

## まとめ

Claude API を使えば、自分だけのAIアシスタントを数行のコードで構築できます。次のステップとして、**ツール使用（Function Calling）** や **マルチターン会話の実装** にも挑戦してみてください。
