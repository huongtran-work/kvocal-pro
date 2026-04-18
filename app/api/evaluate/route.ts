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
    const { audioBase64, mimeType, evalText, topicId } = await request.json();

    const prompt = `Bạn là một giáo viên dạy phát âm tiếng Hàn.
Học viên vừa đọc đoạn văn bản sau: "${evalText}"
Hãy nghe file ghi âm và đánh giá:
1. Điểm số phát âm (từ 0 đến 100).
2. Nhận xét chi tiết: Khen ngợi những điểm tốt và chỉ ra những lỗi phát âm cụ thể (đặc biệt chú ý đến các quy tắc biến âm, nối âm, patchim).
Trả về định dạng JSON: { "score": number, "feedback": "string" }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { data: audioBase64, mimeType: mimeType || 'audio/webm' } },
        { text: prompt },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
          },
          required: ['score', 'feedback'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No response from AI');

    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const result = JSON.parse(jsonStr);

    if (topicId) {
      const userId = user.id;
      const existing = await prisma.userProgress.findUnique({
        where: { userId_topicId: { userId, topicId } },
      });
      await prisma.userProgress.upsert({
        where: { userId_topicId: { userId, topicId } },
        update: {
          bestScore: Math.max(result.score, existing?.bestScore ?? 0),
          attempts: { increment: 1 },
          completed: existing?.completed || result.score >= 70,
          lastAccessed: new Date(),
        },
        create: {
          userId,
          topicId,
          bestScore: result.score,
          attempts: 1,
          completed: result.score >= 70,
        },
      });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Evaluate error:', err);
    const message = err instanceof Error ? err.message : 'Evaluation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
