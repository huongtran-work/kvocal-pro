import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const dbLesson = await prisma.lesson.findUnique({ where: { topicId: id } });
    if (dbLesson) {
      return NextResponse.json(dbLesson.lessonData);
    }

    const filePath = path.join(process.cwd(), 'data', 'lessons', `${id}.json`);
    if (fs.existsSync(filePath)) {
      const lessonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      await prisma.lesson.upsert({
        where: { topicId: id },
        update: { lessonData },
        create: { topicId: id, lessonData },
      });
      return NextResponse.json(lessonData);
    }

    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  } catch (err: unknown) {
    console.error(`Lesson fetch error for ${id}:`, err);
    const message = err instanceof Error ? err.message : 'Failed to fetch lesson';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
