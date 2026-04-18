import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const LESSONS_DIR = path.join(process.cwd(), 'data/lessons');
const BATCH_SIZE = 20;

type WordEntry = { file: string; idx: number; word: string; context: string };

async function getMeaningsBatch(batch: WordEntry[]): Promise<{ idx: number; meaning: string }[]> {
  const prompt = `Với mỗi từ/cụm từ tiếng Hàn dưới đây, cho nghĩa tiếng Việt ngắn gọn (tối đa 4 từ), thể hiện ý nghĩa trong ngữ cảnh câu đó.

${batch.map((e, i) => `${i}. "${e.word}" — câu: "${e.context}"`).join('\n')}

Trả lời CHỈ JSON mảng (đúng thứ tự, không thêm gì khác):
[{"idx":0,"meaning":"nghĩa"},{"idx":1,"meaning":"nghĩa"},...]`;

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  const text = result.text?.trim() ?? '';
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error(`No JSON: ${text.slice(0, 200)}`);
  return JSON.parse(m[0]);
}

function saveMeanings(batch: WordEntry[], results: { idx: number; meaning: string }[]) {
  const byFile: Record<string, { idx: number; meaning: string }[]> = {};
  for (const r of results) {
    const entry = batch[r.idx];
    if (!entry) continue;
    if (!byFile[entry.file]) byFile[entry.file] = [];
    byFile[entry.file].push({ idx: entry.idx, meaning: r.meaning });
  }
  for (const [file, changes] of Object.entries(byFile)) {
    const fp = path.join(LESSONS_DIR, file);
    const lesson = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    for (const { idx, meaning } of changes) lesson.annotatedWords[idx].meaning = meaning;
    fs.writeFileSync(fp, JSON.stringify(lesson, null, 2) + '\n');
  }
}

async function main() {
  const target = process.argv[2] ?? 'beg';
  const files = fs.readdirSync(LESSONS_DIR)
    .filter(f => f.endsWith('.json') && f.startsWith(target))
    .sort();

  const allWords: WordEntry[] = [];
  for (const file of files) {
    const lesson = JSON.parse(fs.readFileSync(path.join(LESSONS_DIR, file), 'utf-8'));
    (lesson.annotatedWords ?? []).forEach((ann: { word: string; meaning?: string }, i: number) => {
      if (!ann.meaning) allWords.push({ file, idx: i, word: ann.word, context: lesson.originalText });
    });
  }

  console.log(`Words remaining: ${allWords.length} across ${files.length} files [prefix: ${target}]`);
  if (!allWords.length) { console.log('Nothing to do.'); return; }

  let saved = 0;
  for (let start = 0; start < allWords.length; start += BATCH_SIZE) {
    const batch = allWords.slice(start, start + BATCH_SIZE);
    const end = Math.min(start + BATCH_SIZE, allWords.length);
    process.stdout.write(`  Batch ${start + 1}–${end}: `);

    let ok = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const results = await getMeaningsBatch(batch);
        saveMeanings(batch, results);
        saved += results.length;
        console.log(`✓ saved (${results.length})`);
        ok = true;
        break;
      } catch (err: unknown) {
        const msg = String(err);
        const delay = (parseInt(msg.match(/"retryDelay":"(\d+)s"/)?.[1] ?? '12') + 3) * 1000;
        if (attempt < 4) {
          process.stdout.write(`↻${attempt} (${delay / 1000}s) `);
          await new Promise(r => setTimeout(r, delay));
        } else {
          console.error(`✗ skipped`);
        }
      }
    }

    if (ok && start + BATCH_SIZE < allWords.length) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`\nDone — ${saved}/${allWords.length} meanings saved.`);
}

main().catch(err => { console.error(err); process.exit(1); });
