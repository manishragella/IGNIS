import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { REPORT_GENERATION_PROMPT } from '@/lib/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      schoolName,
      teacherName,
      visitCount,
      dateRange,
      activitiesCompleted,
      observations,
      achievements,
      challenges,
      supportRequired,
      suggestions,
    } = data;

    if (!schoolName || !teacherName || !observations) {
      return NextResponse.json(
        { error: 'School name, teacher name, and observations are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = REPORT_GENERATION_PROMPT({
      schoolName,
      teacherName,
      visitCount: parseInt(visitCount) || 1,
      dateRange,
      activitiesCompleted: parseInt(activitiesCompleted) || 0,
      observations,
      achievements,
      challenges,
      supportRequired,
      suggestions,
    });

    const result = await model.generateContent(prompt);
    const reportText = result.response.text();

    return NextResponse.json({ report: reportText });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
