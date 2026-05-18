import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ACTIVITY_GENERATION_PROMPT } from '@/lib/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { grade, topic, languageFocus, lifeSkillFocus } = await request.json();

    if (!grade || !topic || !languageFocus || !lifeSkillFocus) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = ACTIVITY_GENERATION_PROMPT(grade, topic, languageFocus, lifeSkillFocus);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean the response - remove markdown code blocks if present
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ activity: parsed });
  } catch (error: any) {
    console.error('Activity generation error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate activity' },
      { status: 500 }
    );
  }
}
