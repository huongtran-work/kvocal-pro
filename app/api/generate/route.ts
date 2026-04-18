import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { getDemoSession } from '@/lib/demo-auth';
import { prisma } from '@/lib/db';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  const user = await getDemoSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { topicId, topicTitle, levelLabel } = await request.json();

    let lengthRequirement = 'ngắn khoảng 3-4 câu';
    if (levelLabel === 'trung cấp') lengthRequirement = 'dài khoảng 20 câu';
    else if (levelLabel === 'cao cấp') lengthRequirement = 'rất dài khoảng 40 câu';

    const prompt = `Viết một đoạn văn tiếng Hàn ${lengthRequirement} ở trình độ ${levelLabel} về chủ đề "${topicTitle}".
Đoạn văn phải chứa nhiều trường hợp biến âm, nối âm, patchim phức tạp phù hợp với trình độ này.
Trả về định dạng JSON với các trường:
- originalText: Đoạn văn bản tiếng Hàn.
- pronouncedText: Cách đọc thực tế của cả đoạn văn (viết trong ngoặc vuông [...]).
- translation: Dịch nghĩa tiếng Việt của cả đoạn.
- annotatedWords: Mảng các từ có biến âm trong đoạn (chọn lọc tối đa 25 từ tiêu biểu và phức tạp nhất để giải thích, tránh làm JSON quá dài). Mỗi phần tử gồm:
  + word: Từ gốc trong đoạn văn.
  + pronounced: Cách đọc của từ đó.
  + rule: Tên quy tắc biến âm.
  + explanation: Giải thích chi tiết tại sao lại đọc như vậy.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING },
            pronouncedText: { type: Type.STRING },
            translation: { type: Type.STRING },
            annotatedWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  pronounced: { type: Type.STRING },
                  rule: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['word', 'pronounced', 'rule', 'explanation'],
              },
            },
          },
          required: ['originalText', 'pronouncedText', 'translation', 'annotatedWords'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('AI did not return a result');

    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const data = JSON.parse(jsonStr);

    await prisma.lesson.upsert({
      where: { topicId },
      update: { lessonData: data },
      create: { topicId, lessonData: data },
    });

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Generate error:', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
