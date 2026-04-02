/**
 * Phase 1: Note記事のAI分析・カテゴリ分類・SEOメタデータ生成スクリプト
 *
 * 対応フォーマット:
 *   - .xml (note.com WXR/WordPress エクスポート) ← note.com の標準形式
 *   - .md  (Markdown)
 *   - .html / .htm (HTML)
 *   - .txt (プレーンテキスト)
 *
 * 使い方:
 *   1. .env ファイルに ANTHROPIC_API_KEY を設定
 *   2. note_exports/ フォルダに note のエクスポートファイルを配置（すでに配置済み）
 *   3. node scripts/process-notes.js を実行
 *   4. src/content/blog/ に整理済みMarkdownが出力されます
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// .env ファイルを自動読み込み
{
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(/^\s*([\w]+)\s*=\s*(.+)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const INPUT_DIR = path.join(ROOT, 'note_exports');
const OUTPUT_DIR = path.join(ROOT, 'src', 'content', 'blog');

const CATEGORY_SLUGS = {
  '経営学/MBA':        'mba',
  'AI・プログラミング': 'tech',
  '日々のエッセイ':     'essay',
  '小説・創作':         'novel',
};

// ============================================================
// Utilities
// ============================================================

function slugify(text) {
  // ローマ字スラッグ生成（英数字以外をハイフンに変換）
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60)
    || `article-${Date.now()}`;
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractCdata(str) {
  const m = str.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : str;
}

// ============================================================
// XML (note.com WXR) パーサー
// ============================================================

function parseNoteXml(xmlContent) {
  const articles = [];

  // <item> ブロックを正規表現で抽出
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlContent)) !== null) {
    const item = match[1];

    // タイトル
    const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
    const rawTitle = titleMatch ? extractCdata(titleMatch[1]).trim() : '';
    if (!rawTitle) continue;

    // 本文 (content:encoded)
    const contentMatch = item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
    const rawHtml = contentMatch ? extractCdata(contentMatch[1]) : '';
    const textContent = stripHtml(rawHtml).trim();
    if (textContent.length < 50) continue;

    // URL
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
    const link = linkMatch ? linkMatch[1].trim() : '';

    // 公開日
    const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    let pubDate = new Date().toISOString().split('T')[0];
    if (dateMatch) {
      const d = new Date(dateMatch[1].trim());
      if (!isNaN(d.getTime())) pubDate = d.toISOString().split('T')[0];
    }

    // guid（記事ID）
    const guidMatch = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
    const guid = guidMatch ? extractCdata(guidMatch[1]).trim() : '';

    articles.push({ title: rawTitle, textContent, link, pubDate, guid });
  }

  return articles;
}

// ============================================================
// Claude API で分析
// ============================================================

async function analyzeArticle(client, title, content) {
  const excerpt = content.length > 3000 ? content.substring(0, 3000) + '\n...(省略)' : content;

  const prompt = `以下のNote記事を分析し、JSON形式で返してください。

記事タイトル: ${title}
記事本文（一部）:
---
${excerpt}
---

以下のJSONを生成してください:
{
  "title": "SEO最適化されたタイトル（日本語、元のタイトルを参考に40〜60文字程度）",
  "description": "meta descriptionとして使えるSEO最適化された説明文（日本語、120〜160文字）",
  "keywords": ["キーワード1", "キーワード2", "キーワード3", "キーワード4", "キーワード5"],
  "category": "以下のいずれか1つ: 経営学/MBA | AI・プログラミング | 日々のエッセイ | 小説・創作",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "isNovel": false
}

categoryの判定基準:
- 経営学/MBA: 経営戦略、MBAの知識、ビジネスフレームワーク、企業分析
- AI・プログラミング: AI、機械学習、プログラミング、技術解説
- 日々のエッセイ: 日常生活、体験談、感想、考察、雑記
- 小説・創作: フィクション、物語、詩、創作作品

isNovelはcategoryが「小説・創作」かつ小説・詩などの創作物の場合のみtrueにしてください。

JSONのみを返してください。説明文は不要です。`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`JSONが見つかりません: ${responseText.substring(0, 200)}`);
  return JSON.parse(jsonMatch[0]);
}

// ============================================================
// Markdown 出力
// ============================================================

function buildMarkdown(meta, textContent, originalTitle, pubDate, sourceUrl, guid) {
  const categorySlug = CATEGORY_SLUGS[meta.category] || 'essay';
  const keywords = meta.keywords.join(', ');
  const tags = meta.tags.map(t => `  - "${t}"`).join('\n');
  const isNovel = meta.isNovel === true;

  // テキストを段落に変換
  const formattedContent = textContent
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => p)
    .join('\n\n');

  return `---
title: "${meta.title.replace(/"/g, '\\"')}"
description: "${meta.description.replace(/"/g, '\\"')}"
pubDate: ${pubDate}
category: "${meta.category}"
categorySlug: "${categorySlug}"
tags:
${tags}
keywords: "${keywords}"
draft: false
isNovel: ${isNovel}
originalSource: "note"
originalTitle: "${originalTitle.replace(/"/g, '\\"')}"
${sourceUrl ? `sourceUrl: "${sourceUrl}"` : ''}
${guid ? `noteId: "${guid}"` : ''}
---

${formattedContent}
`;
}

function generateSlug(title, guid) {
  // guidがある場合はその末尾8文字をベースにする
  const guidSuffix = guid ? guid.slice(-8) : '';
  const titleSlug = slugify(
    // タイトルからローマ字部分のみ抽出、なければguidを使う
    title.replace(/[^\x00-\x7F]/g, '').trim() || guidSuffix || 'article'
  );
  return guidSuffix ? `${titleSlug}-${guidSuffix}`.replace(/-+/g, '-').replace(/-$/, '') : titleSlug;
}

// ============================================================
// ファイル読み込み（XML以外）
// ============================================================

function readNoteFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, 'utf-8');
  if (ext === '.html' || ext === '.htm') {
    return [{ title: path.basename(filePath, ext), textContent: stripHtml(raw), pubDate: null, link: '', guid: '' }];
  }
  // .md or .txt
  const content = raw.replace(/^---[\s\S]*?---\n/, '').trim();
  return [{ title: path.basename(filePath, ext), textContent: content, pubDate: null, link: '', guid: '' }];
}

// ============================================================
// メイン処理
// ============================================================

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('エラー: ANTHROPIC_API_KEY 環境変数が設定されていません。');
    console.error('.env ファイルに ANTHROPIC_API_KEY=your_key を設定してください。');
    process.exit(1);
  }

  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`エラー: ${INPUT_DIR} フォルダが存在しません。`);
    process.exit(1);
  }

  const supportedExt = ['.xml', '.md', '.html', '.htm', '.txt'];
  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return supportedExt.includes(ext) && !f.startsWith('README');
    });

  if (files.length === 0) {
    console.log(`note_exports/ フォルダにファイルがありません。`);
    process.exit(0);
  }

  console.log(`\n${files.length} 件のファイルを検出しました。\n`);

  const client = new Anthropic({ apiKey });
  const results = { success: 0, skip: 0, error: 0 };

  // 既存の出力ファイルのguidセットを構築（重複スキップ用）
  const existingGuids = new Set();
  if (fs.existsSync(OUTPUT_DIR)) {
    for (const f of fs.readdirSync(OUTPUT_DIR)) {
      if (!f.endsWith('.md')) continue;
      const content = fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8');
      const m = content.match(/noteId:\s*"([^"]+)"/);
      if (m) existingGuids.add(m[1]);
    }
  }

  for (const filename of files) {
    const filePath = path.join(INPUT_DIR, filename);
    const ext = path.extname(filename).toLowerCase();

    console.log(`\nファイル処理: ${filename}`);

    let articles = [];

    if (ext === '.xml') {
      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      articles = parseNoteXml(xmlContent);
      console.log(`  → ${articles.length} 件の記事を検出`);
    } else {
      articles = readNoteFile(filePath);
    }

    for (const article of articles) {
      const { title, textContent, pubDate, link, guid } = article;

      // 重複チェック
      if (guid && existingGuids.has(guid)) {
        console.log(`  スキップ（処理済み）: ${title.substring(0, 40)}`);
        results.skip++;
        continue;
      }

      process.stdout.write(`  処理中: ${title.substring(0, 40)}... `);

      try {
        const meta = await analyzeArticle(client, title, textContent);

        const slug = generateSlug(title, guid);
        let outputPath = path.join(OUTPUT_DIR, `${slug}.md`);
        if (fs.existsSync(outputPath)) {
          outputPath = path.join(OUTPUT_DIR, `${slug}-${Date.now()}.md`);
        }

        const finalPubDate = pubDate || new Date().toISOString().split('T')[0];
        const markdown = buildMarkdown(meta, textContent, title, finalPubDate, link, guid);
        fs.writeFileSync(outputPath, markdown, 'utf-8');

        if (guid) existingGuids.add(guid);

        console.log(`完了 [${meta.category}] → ${path.basename(outputPath)}`);
        results.success++;

        // API レート制限対策
        await new Promise(r => setTimeout(r, 600));

      } catch (err) {
        console.log(`エラー: ${err.message}`);
        results.error++;
      }
    }
  }

  console.log(`\n============================`);
  console.log(`完了: ${results.success} 件成功 / ${results.skip} 件スキップ / ${results.error} 件エラー`);
  console.log(`出力先: src/content/blog/`);
  console.log(`============================\n`);
}

main().catch(err => {
  console.error('予期しないエラー:', err);
  process.exit(1);
});
