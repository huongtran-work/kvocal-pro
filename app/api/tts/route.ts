import { NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';
import { getDemoSession } from '@/lib/demo-auth';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  const user = await getDemoSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: `Speak the following text: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return NextResponse.json({ error: 'No audio returned' }, { status: 500 });
    }

    return NextResponse.json({ audio: base64Audio });
  } catch (err: unknown) {
    console.error('TTS error:', err);
    const message = err instanceof Error ? err.message : 'TTS failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
