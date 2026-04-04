---
title: "Synology NAS DS223j 完全活用ガイド｜自宅サーバーで知的生活を豊かにする"
description: "Synology DS223j の初期設定からObsidianとの連携、写真バックアップ、メディアサーバー構築まで。自宅NASを最大限に活用して、デジタル資産を守りながら知的生活を豊かにする方法を解説します。"
pubDate: 2026-04-02
category: "AI・プログラミング"
categorySlug: "tech"
tags:
  - "Synology NAS"
  - "DS223j"
  - "ホームサーバー"
keywords: "Synology NAS, DS223j, NAS活用, Obsidian, ホームサーバー, バックアップ, ファイル管理"
draft: false
isNovel: false
originalSource: "original"
related:
  - "tech-obsidian-pkm-guide"
  - "nba775177db94"
---

## はじめに：なぜ今、自宅NASなのか

クラウドサービスが普及した今、なぜわざわざ自宅にNAS（Network Attached Storage）を置く必要があるのか——そう思う方も多いでしょう。

私が **Synology DS223j** を導入した理由は明確でした。

- **データの所有権**：クラウドはサービス終了リスクがある
- **月額コストゼロ**：一度買えば維持費は電気代のみ
- **高速なローカルアクセス**：自宅ネットワーク内は爆速
- **Obsidianとの完璧な連携**：ノートを自分のサーバーで同期できる

結果として、**「知的生活の基盤」**が整いました。この記事では、その全貌をお伝えします。

---

## Synology DS223j の概要

**DS223j**（DiskStation 223j）は、Synologyが提供する2ベイのエントリーモデルNASです。

| 仕様 | 詳細 |
|---|---|
| ベイ数 | 2ベイ（RAID 1対応） |
| CPU | Realtek RTD1619B（クアッドコア 1.7GHz） |
| RAM | 1GB DDR4 |
| 対応HDD | 最大2台（最大20TB×2） |
| ネットワーク | 1GbE×1 |
| 消費電力 | 約12W（アクセス時） |

エントリーモデルといえど、**DSM（DiskStation Manager）** という洗練されたOSが走っており、できることの幅は非常に広いです。

---

## セットアップ手順

### 1. HDDの搭載

私は **Seagate IronWolf 4TB × 2本** を搭載しました。NAS専用HDDは耐久性が高く、24時間稼働を想定して設計されています。

RAID 1（ミラーリング）設定にすることで、1台が壊れてもデータを失わない仕組みにしました。

### 2. DSMのインストール

- Synology Assistant または `find.synology.com` にアクセス
- 画面の指示に従いDSMをインストール（約10分）
- 管理者アカウントを設定

### 3. 共有フォルダの設定

```
/volume1/
  ├── homes/        # ユーザーごとのホームフォルダ
  ├── documents/    # 文書類
  ├── obsidian/     # Obsidian Vault（後述）
  ├── photos/       # 写真バックアップ
  └── media/        # 動画・音楽
```

---

## Obsidianとの連携が最強

私がNASを導入して最も恩恵を受けているのが、**Obsidianのメモ管理**との連携です。

### 仕組み

1. NAS上に `/volume1/obsidian/MyVault/` フォルダを作成
2. 各デバイスからSMB（Windows共有）またはWebDAVでマウント
3. Obsidianの「Vault」をこのフォルダに向ける

### メリット

- **複数デバイスで同じVaultを参照**：PC・Mac・iPad すべて同じメモが見られる
- **自動バックアップ**：Hyper Backup でクラウドにも二重バックアップ
- **オフラインでも使える**：ローカルファイルなので接続不要で編集可能
- **月額同期費用ゼロ**：Obsidian Sync（月約1,000円）が不要に

---

## 写真管理：Synology Photos の活用

Synology の純正アプリ「**Synology Photos**」は、Google フォトの自分版です。

- スマホから自動バックアップ
- AI による顔認識・シーン検出
- タイムライン表示
- 家族との共有アルバム

設定は **Package Center** から「Synology Photos」をインストールするだけ。スマホアプリも無料で提供されています。

---

## セキュリティ設定（必須）

NASをインターネットに公開する場合、セキュリティ設定は必須です。

### 最低限やること

1. **デフォルトポートの変更**：5000/5001 → 任意のポートへ
2. **2段階認証の有効化**：DSM管理画面 → セキュリティ → 2要素認証
3. **ファイアウォールの設定**：許可するIPを絞る
4. **QuickConnect の活用**：Synologyの中継サービスで安全にアクセス
5. **自動ブロック**：一定回数ログイン失敗したIPを自動ブロック

---

## 月額コスト比較

| サービス | 月額 |
|---|---|
| Google One 2TB | 約1,300円 |
| Dropbox Plus 2TB | 約1,200円 |
| Obsidian Sync | 約1,000円 |
| **DS223j（電気代のみ）** | **約200円** |

初期投資は **DS223j本体（約3万円）＋HDD代（約3万円）＝6万円程度** ですが、2〜3年で元が取れます。

---

## まとめ

Synology DS223j は、単なる「データ保存装置」ではありません。

**知識を整理し、写真を守り、家族の思い出を管理し、クラウドから自立する——**そのための「自分だけのデジタル基盤」です。

Obsidianとの連携については、次の記事で詳しく解説します。
