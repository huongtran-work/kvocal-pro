import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const LESSONS_DIR = path.join(process.cwd(), 'data/lessons');

async function regenAnnotations(file: string) {
  const fp = path.join(LESSONS_DIR, file);
  const lesson = JSON.parse(fs.readFileSync(fp, 'utf-8'));

  const prompt = `Bạn là chuyên gia ngữ âm tiếng Hàn. Hãy phân tích đoạn văn sau và tìm ra TẤT CẢ các hiện tượng nối âm và biến âm quan trọng, chú trọng mức độ KHÓ (cao cấp). Mục tiêu: 16–20 ví dụ, bao gồm đa dạng các quy tắc phức tạp.

Đoạn văn gốc:
"${lesson.originalText}"

Phát âm chuẩn của đoạn:
"${lesson.pronouncedText}"

Yêu cầu với TỪNG annotatedWord:
- "word": từ/cụm từ trong văn bản gốc (giữ nguyên từ gốc, không sửa)
- "pronounced": phát âm thực tế trong ngoặc vuông, ví dụ "[이르믄]"
- "rule": tên quy tắc ngắn gọn (ví dụ: "Nối âm 연음", "Căng hóa 경음화", "Bật hơi 격음화", "Biến âm mũi 비음화", "Biến âm lưỡi 유음화", hoặc kết hợp)
- "explanation": giải thích cụ thể bằng tiếng Việt (nêu patchim nào gặp âm nào, biến thành gì)
- "meaning": nghĩa tiếng Việt ngắn gọn (tối đa 4 từ)

Ưu tiên các từ có:
1. Nhiều hiện tượng xảy ra cùng lúc (vd: nối âm + căng hóa)
2. Patchim kép phức tạp (ㄺ, ㄻ, ㄼ, ㄽ, ㄾ, ㄿ, ㅀ, ㄵ, ㄶ)
3. Chuỗi nhiều nối âm liên tiếp
4. Biến âm mũi, biến âm lưỡi
5. Bật hơi (ㅎ kết hợp patchim)

Trả lời CHỈ JSON mảng (không có gì khác):
[
  {
    "word": "từ_gốc",
    "pronounced": "[phát âm]",
    "rule": "Tên quy tắc",
    "explanation": "Giải thích chi tiết",
    "meaning": "Nghĩa VN"
  }
]`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = result.text?.trim() ?? '';
      const m = text.match(/\[[\s\S]*\]/);
      if (!m) throw new Error(`No JSON array in response: ${text.slice(0, 200)}`);

      const annotatedWords = JSON.parse(m[0]);
      if (!Array.isArray(annotatedWords) || annotatedWords.length < 10) {
        throw new Error(`Too few results: ${annotatedWords.length}`);
      }

      lesson.annotatedWords = annotatedWords;
      fs.writeFileSync(fp, JSON.stringify(lesson, null, 2) + '\n');
      return annotatedWords.length;
    } catch (err: unknown) {
      const msg = String(err);
      const delay = (parseInt(msg.match(/"retryDelay":"(\d+)s"/)?.[1] ?? '15') + 5) * 1000;
      if (attempt < 4) {
        process.stdout.write(`↻${attempt}(${delay / 1000}s) `);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  return 0;
}

async function main() {
  const files = fs.readdirSync(LESSONS_DIR)
    .filter(f => f.startsWith('adv') && f.endsWith('.json'))
    .sort();

  console.log(`Regenerating ${files.length} advanced lessons...\n`);

  for (const file of files) {
    process.stdout.write(`${file}: `);
    try {
      const count = await regenAnnotations(file);
      console.log(`✓ ${count} annotations`);
    } catch (err) {
      console.error(`✗ ${String(err).slice(0, 120)}`);
    }
    if (file !== files[files.length - 1]) {
      process.stdout.write('  (waiting 8s...)\n');
      await new Promise(r => setTimeout(r, 8000));
    }
  }

  console.log('\nDone!');
}

main().catch(err => { console.error(err); process.exit(1); });
