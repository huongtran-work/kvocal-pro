/**
 * Regenerate all 40 lesson JSON files with a prompt that
 * heavily emphasises 연음 (nối âm / liaison) rules.
 *
 * Run: GEMINI_API_KEY=... tsx scripts/regen-lessons.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// ─── Gemini ───────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(1); }

const GEMINI_MODEL = 'gemini-2.5-flash'; // Confirmed working model

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  const json = await res.json() as any;
  if (!res.ok) throw new Error(JSON.stringify(json.error ?? json));
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Empty Gemini response');
  return text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
}

// ─── Prisma ───────────────────────────────────────────────────────────────────
function fixUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try { new URL(raw); return raw; } catch {}
  const p = raw.indexOf('://'); const a = raw.lastIndexOf('@');
  if (p === -1 || a === -1) return raw;
  const proto = raw.substring(0, p + 3);
  const creds = raw.substring(p + 3, a);
  const ci = creds.indexOf(':');
  if (ci === -1) return raw;
  return proto + creds.substring(0, ci) + ':' + encodeURIComponent(creds.substring(ci + 1)) + '@' + raw.substring(a + 1);
}
const prisma = new PrismaClient({ datasources: { db: { url: fixUrl(process.env.DATABASE_URL) } } });

// ─── Topics ───────────────────────────────────────────────────────────────────
const TOPICS: { id: string; title: string; level: string; levelLabel: string }[] = [
  // Sơ cấp
  ...([
    ['beg-1', 'Giới thiệu bản thân'],
    ['beg-2', 'Mua sắm ở chợ'],
    ['beg-3', 'Gọi món ở nhà hàng'],
    ['beg-4', 'Hỏi đường đi'],
    ['beg-5', 'Sở thích cá nhân'],
    ['beg-6', 'Gia đình của tôi'],
    ['beg-7', 'Thời tiết hôm nay'],
    ['beg-8', 'Lịch trình hàng ngày'],
    ['beg-9', 'Kế hoạch cuối tuần'],
    ['beg-10', 'Đi khám bệnh'],
  ] as [string, string][]).map(([id, title]) => ({ id, title, level: 'beginner', levelLabel: 'sơ cấp' })),
  // Trung cấp
  ...([
    ['int-1', 'Đổi và trả hàng'],
    ['int-2', 'Mở tài khoản ngân hàng'],
    ['int-3', 'Đặt vé và phòng khách sạn'],
    ['int-4', 'Xin lỗi và giải thích lý do'],
    ['int-5', 'Miêu tả tính cách'],
    ['int-6', 'Kinh nghiệm học ngoại ngữ'],
    ['int-7', 'Ưu nhược điểm sống ở phố'],
    ['int-8', 'Kể về kỷ niệm đáng nhớ'],
    ['int-9', 'Thói quen ăn uống & sức khỏe'],
    ['int-10', 'Tham gia câu lạc bộ'],
    ['int-11', 'Phỏng vấn xin việc'],
    ['int-12', 'Chuẩn bị cho kỳ thi'],
    ['int-13', 'Lễ hội truyền thống Hàn Quốc'],
    ['int-14', 'Công việc tình nguyện'],
    ['int-15', 'Sử dụng mạng xã hội'],
    ['int-16', 'Kế hoạch du lịch nước ngoài'],
    ['int-17', 'Thuê nhà và chuyển nhà'],
    ['int-18', 'Giải quyết mâu thuẫn bạn bè'],
    ['int-19', 'Văn hóa nhà ở Hàn Quốc'],
    ['int-20', 'Văn hóa công sở Hàn Quốc'],
  ] as [string, string][]).map(([id, title]) => ({ id, title, level: 'intermediate', levelLabel: 'trung cấp' })),
  // Cao cấp
  ...([
    ['adv-1', 'Vấn đề môi trường hiện đại'],
    ['adv-2', 'Sự phát triển của trí tuệ nhân tạo'],
    ['adv-3', 'Tỷ lệ sinh thấp và già hóa dân số'],
    ['adv-4', 'Tầm quan trọng của giáo dục suốt đời'],
    ['adv-5', 'Năng lực truyền thông trong thời đại số'],
    ['adv-6', 'Đa dạng văn hóa và sự chung sống'],
    ['adv-7', 'Tiêu dùng và sản xuất bền vững'],
    ['adv-8', 'Sức khỏe tâm thần trong xã hội hiện đại'],
    ['adv-9', 'Trách nhiệm đạo đức của khoa học công nghệ'],
    ['adv-10', 'Giá trị cốt lõi của dân chủ'],
  ] as [string, string][]).map(([id, title]) => ({ id, title, level: 'advanced', levelLabel: 'cao cấp' })),
];

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(topicTitle: string, levelLabel: string): string {
  const lengthByLevel: Record<string, string> = {
    'sơ cấp': '5-6 câu',
    'trung cấp': '8-10 câu',
    'cao cấp': '12-15 câu',
  };
  const length = lengthByLevel[levelLabel] ?? '6 câu';

  return `Viết một đoạn văn tiếng Hàn ${length} ở trình độ ${levelLabel} về chủ đề "${topicTitle}".

YÊU CẦU QUAN TRỌNG VỀ NỐI ÂM (연음):
- Đoạn văn PHẢI chứa ít nhất 8-10 trường hợp nối âm (연음/liaison) rõ ràng.
- Nối âm xảy ra khi patchim (phụ âm cuối) của âm tiết trước nối với nguyên âm ㅇ (âm câm) của âm tiết sau.
- Ví dụ nối âm: 음악→[으막], 한국어→[한구거], 먹어요→[머거요], 읽어요→[일거요], 
  있어요→[이써요], 좋아요→[조아요], 밖에→[바께], 앞에→[아페], 
  옷이→[오시], 꽃이→[꼬치], 닭이→[달기], 삶이→[살미].
- Cố ý sử dụng các từ/cụm từ hay gặp nối âm:
  - Động từ + 아/어요: 먹어요, 읽어요, 앉아요, 없어요, 있어요, 좋아요, 싫어요, 넣어요
  - Danh từ + 이/을/을: 음악이, 학교에, 옷을, 밖에, 앞에서, 집에서, 직업은
  - Patchim double: 읽어, 닭을, 삶을, 흙이, 넓은
  - Các từ giàu nối âm: 어떻게, 어디에, 언제, 일어나요, 알아요, 열어요

ĐỊNH DẠNG JSON:
{
  "originalText": "Đoạn văn tiếng Hàn gốc",
  "pronouncedText": "[Cách đọc thực tế của toàn bộ đoạn văn - viết trong ngoặc vuông]",
  "translation": "Dịch nghĩa tiếng Việt của toàn đoạn",
  "annotatedWords": [
    Mảng 10-20 từ có hiện tượng nối âm hoặc biến âm đáng chú ý, ưu tiên các từ nối âm.
    Mỗi phần tử:
    {
      "word": "từ gốc trong đoạn văn",
      "pronounced": "cách đọc thực tế",
      "rule": "Tên quy tắc (ưu tiên ghi: Nối âm 연음)",
      "explanation": "Giải thích ngắn gọn: patchim nào nối với âm tiết nào như thế nào"
    }
  ]
}

Chỉ trả về JSON thuần, không thêm markdown hay giải thích.`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const lessonsDir = path.join(process.cwd(), 'data', 'lessons');
  const total = TOPICS.length;
  const maxNew = parseInt(process.env.MAX_NEW ?? '999'); // limit new lessons per run
  let done = 0;
  let newCount = 0;
  let failed = 0;

  console.log(`\n🔄 Regenerating ${total} lessons with focus on 연음 (nối âm)...\n`);

  for (const topic of TOPICS) {
    if (newCount >= maxNew) break; // stop after processing maxNew new lessons

    const filePath = path.join(lessonsDir, `${topic.id}.json`);

    // Skip lessons already having ≥5 nối âm
    if (fs.existsSync(filePath)) {
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const noiAmCount = (existing.annotatedWords ?? []).filter((w: { rule: string }) =>
        w.rule?.toLowerCase().includes('nối âm') || w.rule?.toLowerCase().includes('연음')
      ).length;
      if (noiAmCount >= 5) {
        console.log(`[${done + 1}/${total}] ${topic.id} — ✓ skip (${noiAmCount} nối âm already)`);
        done++;
        continue;
      }
    }

    process.stdout.write(`[${done + 1}/${total}] ${topic.id} — ${topic.title} ... `);

    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      attempts++;
      try {
        const raw = await callGemini(buildPrompt(topic.title, topic.levelLabel));
        const data = JSON.parse(raw);

        // Validate required fields
        if (!data.originalText || !data.pronouncedText || !data.translation || !Array.isArray(data.annotatedWords)) {
          throw new Error('Missing required fields in response');
        }

        // Save JSON file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

        // Upsert to Supabase
        await prisma.lesson.upsert({
          where: { topicId: topic.id },
          update: { lessonData: data },
          create: { topicId: topic.id, lessonData: data },
        });

        const noiAmCount = data.annotatedWords.filter((w: { rule: string }) =>
          w.rule?.toLowerCase().includes('nối âm') || w.rule?.toLowerCase().includes('연음')
        ).length;
        console.log(`✓ (${data.annotatedWords.length} từ, ${noiAmCount} nối âm)`);
        done++;
        newCount++;
        success = true;
      } catch (err) {
        if (attempts < 3) {
          const msg = err instanceof Error ? err.message : String(err);
          const isRateLimit = msg.includes('429') || msg.includes('503');
          const retryDelay = isRateLimit ? 15000 : 3000;
          process.stdout.write(`retry ${attempts}... `);
          await new Promise(r => setTimeout(r, retryDelay));
        } else {
          console.log(`✗ FAILED: ${err instanceof Error ? err.message.slice(0, 80) : err}`);
          failed++;
          done++;
        }
      }
    }

    // Respect free-tier limit of 5 RPM → wait 13s between requests
    if (success) await new Promise(r => setTimeout(r, 13000));
  }

  console.log(`\n✅ Done: ${total - failed} succeeded, ${failed} failed.\n`);
  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
